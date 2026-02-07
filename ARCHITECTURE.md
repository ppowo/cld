# cld - Claude Code Provider Switcher

A Bun.js CLI tool for switching between Claude Code providers.

## Overview

`cld` manages the environment variables and configuration files required to switch Claude Code between different API providers. Providers can be:

- **Direct** - Point Claude Code directly at an alternative API endpoint
- **Integration** - Route through [claude-code-router](https://github.com/musistudio/claude-code-router) for advanced routing, fallbacks, and multi-provider setups

## The Shell Integration Problem

A CLI process cannot modify its parent shell's environment variables. To work around this, `cld` uses the **eval pattern** (like `rbenv`, `direnv`, `nvm`):

1. **Config file** (`~/.cld/config.json`) - Stores API keys and active provider state
2. **Dynamic shell output** (`cld init` / `cld set`) - Outputs export/unset commands to stdout for eval
3. **Shell function wrapper** - Wraps `cld set` to eval its output for seamless switching

## Dual State Model

State is tracked in two places:

| Source | Purpose |
|--------|---------|
| **Environment variables** | Current shell state - `cld set` reads these to know what to unset |
| **`~/.cld/config.json`** | Persistent state - `cld init` reads this on new shell login |

This enables **seamless switching** without opening a new shell:
- `cld set synthetic` reads current env vars, outputs unsets + exports, shell function evals it
- Config is also updated so new shells start with the right provider

## Directory Structure

```
~/.cld/
└── config.json          # API keys + active provider

~/.claude-code-router/
└── config.json          # Generated when using integration providers
```

### Project Structure

```
cld/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── init.ts           # Shell integration (outputs exports for eval)
│   │   ├── list.ts           # List providers (with parallel quota fetching)
│   │   ├── setup.ts          # Configure provider API key
│   │   ├── set.ts            # Switch active provider
│   │   └── debug.ts          # Show env vars and config state
│   ├── providers/
│   │   ├── index.ts          # Provider registry
│   │   ├── types.ts          # Provider type definitions
│   │   ├── global.ts         # Global environment variables
│   │   ├── direct/
│   │   │   ├── zai.ts        # Zai API
│   │   │   ├── synthetic.ts  # Synthetic API
│   │   │   └── chutes.ts     # Chutes API
│   │   └── integration/
│   │       └── router-openrouter.ts
│   ├── config.ts             # Config file management (~/.cld/config.json)
│   ├── quota.ts              # Quota fetching and formatting
│   └── router-config.ts      # claude-code-router config generation
├── package.json
├── tsconfig.json
└── ARCHITECTURE.md
```

## Provider Types

### Direct Provider

Exports environment variables to point Claude Code at an alternative API:

```typescript
interface DirectProvider {
  type: 'direct';
  name: string;                    // e.g., 'synthetic'
  displayName: string;             // e.g., 'Synthetic'
  env: Record<string, string>;     // Environment variables to export
  quota?: QuotaConfig;             // Optional quota endpoint config
}
```

**Example: Synthetic Provider (with quota and model mapping)**

```typescript
const syntheticProvider: DirectProvider = {
  type: 'direct',
  name: 'synthetic',
  displayName: 'Synthetic',
  env: {
    ANTHROPIC_BASE_URL: 'https://api.synthetic.new/anthropic',
    ANTHROPIC_AUTH_TOKEN: '${CLD_SYNTHETIC_API_KEY}',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'hf:moonshotai/Kimi-K2.5',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'hf:zai-org/GLM-4.7',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'hf:zai-org/GLM-4.7',
    CLAUDE_CODE_SUBAGENT_MODEL: 'hf:zai-org/GLM-4.7',
  },
  quota: {
    url: 'https://api.synthetic.new/v2/quotas',
    authKeyName: 'CLD_SYNTHETIC_API_KEY',
    parser: 'synthetic',
  },
};
```

When active, `cld set` exports exactly what's in `env`. Missing vars are not set (and will be unset if previously set).

### Key Derivation

Required API keys are derived automatically by scanning the provider config for `$CLD_*` or `${CLD_*}` patterns:

- **Direct providers**: Scan `env` values
- **Integration providers**: Scan `env` values + `routerConfig` recursively
- **Exception**: `CLD_ROUTER_KEY` is excluded from validation - it's hardcoded and always available via `cld init`

The `cld setup <provider> <key>` command derives the key name from the provider name:

```
synthetic       → CLD_SYNTHETIC_API_KEY
router-openrouter → CLD_ROUTER_OPENROUTER_API_KEY
openrouter      → CLD_OPENROUTER_API_KEY
```

Convention: `CLD_${name.toUpperCase().replace(/-/g, '_')}_API_KEY`

### Integration Provider

Routes through claude-code-router, which provides advanced features like fallback providers:

```typescript
interface IntegrationProvider {
  type: 'integration';
  name: string;                    // e.g., 'router-firmware'
  displayName: string;             // e.g., 'Router: Firmware'
  env: Record<string, string>;     // Environment variables to export
  routerConfig: RouterConfig;      // Config to write to ~/.claude-code-router/config.json
  quota?: QuotaConfig;             // Optional quota endpoint config
}

interface RouterConfig {
  HOST: string;
  PORT: number;
  APIKEY: string;                  // Always '$CLD_ROUTER_KEY' (hardcoded fake key)
  Providers: RouterProvider[];
  Router: RouterRoutes;
  fallback?: Record<string, string[]>;  // Fallback routes per route type
}

interface RouterProvider {
  name: string;
  api_base_url: string;
  api_key: string;                 // Reference to env var, e.g., '$CLD_ROUTER_FIRMWARE_API_KEY'
  models: string[];
  transformer?: Record<string, unknown>;  // Optional request transformer
}

interface RouterRoutes {
  default: string;                 // 'provider,model' format (required)
  think?: string;                  // Optional - falls back to default
  background?: string;             // Optional - falls back to default
  web_search?: string;             // Optional - falls back to default
  long_context?: string;           // Optional - falls back to default
}
```

**Example: Router-OpenRouter Provider**

```typescript
const routerOpenrouterProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-openrouter',
  displayName: 'Router: OpenRouter',
  env: {
    ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456',
    ANTHROPIC_AUTH_TOKEN: '${CLD_ROUTER_KEY}',
  },
  routerConfig: {
    HOST: '127.0.0.1',
    PORT: 3456,
    APIKEY: '$CLD_ROUTER_KEY',
    Providers: [
      {
        name: 'openrouter',
        api_base_url: 'https://openrouter.ai/api/v1/chat/completions',
        api_key: '$CLD_ROUTER_OPENROUTER_API_KEY',
        models: ['openai/gpt-oss-20b:free'],
        transformer: { use: ['openrouter'] },
      },
    ],
    Router: {
      default: 'openrouter,openai/gpt-oss-20b:free',
    },
  },
};
```

When active, sets env vars and writes router config:

**Exports generated by `cld init`:**
```sh
export ANTHROPIC_BASE_URL=http://127.0.0.1:3456
export ANTHROPIC_AUTH_TOKEN=${CLD_ROUTER_KEY}
```

**~/.claude-code-router/config.json:**
```json
{
  "HOST": "127.0.0.1",
  "PORT": 3456,
  "APIKEY": "$CLD_ROUTER_KEY",
  "Providers": [
    {
      "name": "firmware",
      "api_base_url": "https://app.firmware.ai/api/v1/chat/completions",
      "api_key": "$CLD_ROUTER_FIRMWARE_API_KEY",
      "models": ["claude-opus-4-5", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]
    }
  ],
  "Router": {
    "default": "firmware,claude-opus-4-5",
    "think": "firmware,claude-opus-4-5",
    "background": "firmware,claude-haiku-4-5-20251001",
    "web_search": "firmware,claude-haiku-4-5-20251001",
    "long_context": "firmware,claude-opus-4-5"
  },
  "fallback": {
    "default": ["firmware,claude-sonnet-4-5-20250929"],
    "think": ["firmware,claude-sonnet-4-5-20250929"],
    "background": ["firmware,claude-haiku-4-5-20251001"],
    "web_search": ["firmware,claude-haiku-4-5-20251001"],
    "long_context": ["firmware,claude-sonnet-4-5-20250929"]
  }
}
```

## Quota System

Providers can optionally define a `quota` field to enable real-time quota display in `cld list`.

### QuotaConfig

```typescript
interface QuotaConfig {
  url: string;            // Quota endpoint URL
  authKeyName: string;    // Key name for auth (e.g., 'CLD_SYNTHETIC_API_KEY')
  parser?: string;        // Named parser from quotaParsers (default: expects { used, reset })
}

interface QuotaResponse {
  used: number;           // 0 to 1 (percentage used as decimal)
  reset: string | null;   // ISO 8601 timestamp, or null if no active window
  remaining?: number;     // Absolute count remaining (if available)
  total?: number;         // Total quota (if available)
}
```

### Named Parsers

Located in `src/quota.ts`, these transform provider-specific API responses into `QuotaResponse`:

| Parser | API Format | Notes |
|--------|------------|-------|
| `synthetic` | `{ subscription: { limit, requests, renewsAt } }` | Calculates remaining from limit - requests |

If no parser is specified, the response is expected to match `QuotaResponse` directly.

### Quota Fetching

- `cld list` fetches quota for all configured providers **in parallel**
- 5-second timeout per request
- Failed fetches show ` err` instead of quota info
- Unconfigured providers skip quota fetch entirely

## Config Files

### ~/.cld/config.json

Stores all configured API keys and the currently active provider:

```json
{
  "activeProvider": "router-openrouter",
  "keys": {
    "CLD_SYNTHETIC_API_KEY": "sk-synth-xxx",
    "CLD_ROUTER_OPENROUTER_API_KEY": "sk-or-xxx",
    "CLD_ANTHROPIC_API_KEY": "sk-ant-xxx"
  }
}
```

## Commands

### `cld init`

Shell integration command designed to be eval'd in shell profiles:

```bash
# Add to ~/.bashrc or ~/.zshrc
eval "$(cld init)"
```

The `init` command outputs both environment exports and a shell function wrapper for seamless switching.

**Behavior:**

`cld init` outputs shell code to stdout. When eval'd, it:

1. **First run (no ~/.cld exists):**
   - Creates `~/.cld/` directory
   - Creates `config.json` with empty state
   - Outputs minimal bootstrap exports (just `CLD_ROUTER_KEY`)
   - Prints setup instructions to stderr (not captured by eval)

2. **Subsequent runs (config exists):**
   - Reads `~/.cld/config.json`
   - Outputs all configured API key exports
   - Outputs active provider's environment variables
   - Outputs `unset` commands for inactive provider variables

**Output Format (stdout - captured by eval):**

```sh
# Bootstrap (first run)
export CLD_ROUTER_KEY="cld-local-router-key-do-not-share"

# Full initialization (subsequent runs)
export CLD_ROUTER_KEY="cld-local-router-key-do-not-share"
export CLD_SYNTHETIC_API_KEY="sk-synth-xxx"
export CLD_ROUTER_OPENROUTER_API_KEY="sk-or-xxx"
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export ANTHROPIC_AUTH_TOKEN="${CLD_ROUTER_KEY}"
unset ANTHROPIC_DEFAULT_OPUS_MODEL
unset ANTHROPIC_DEFAULT_SONNET_MODEL
unset ANTHROPIC_DEFAULT_HAIKU_MODEL
unset CLAUDE_CODE_SUBAGENT_MODEL
```

**Stderr (informational, not captured by eval):**

```
[cld] Initialized ~/.cld/config.json
[cld] Run 'cld setup <provider>' to configure a provider
[cld] Run 'cld list' to see available providers
```

**Implementation Notes:**

- All informational messages go to stderr so they don't interfere with eval
- Output is pure POSIX shell compatible (works in bash, zsh, sh)
- Idempotent: running multiple times is safe
- Fast: no network calls, just file reads
- The `~/.cld/env.sh` file is no longer needed - init generates exports dynamically

**Shell Detection (optional enhancement):**

```bash
eval "$(cld init --shell=zsh)"   # Explicit shell
eval "$(cld init)"               # Auto-detect from $SHELL
```

Different shells might need slightly different syntax (e.g., zsh has different array syntax), though for basic exports POSIX shell works everywhere.

### `cld list`

Lists all available providers with their status and quota info:

```
$ cld list

Providers:
▸ zai               ✓ 45/100 ~2h30m
  synthetic         ✓ 80% ~5h on use
  router-openrouter ✓
  chutes            ✗

▸ = currently active
✓ = configured, ✗ = not configured
Quota shown as: remaining/total or percentage, with reset time
```

**Quota Display:**

- `45/100 ~2h30m` - Absolute count remaining / total, resets in ~2h30m
- `80%` - Percentage remaining (when absolute count unavailable)
- `~5h on use` - Quota window starts on first use (no active window)
- No quota shown if provider doesn't support it or fetch failed

### `cld setup <provider> <api-key>`

Configures an API key for a provider:

```
$ cld setup synthetic sk-synth-xxx

[cld] API key saved for synthetic.
[cld] Run 'cld set synthetic' to switch to this provider.
```

**Flow:**
1. Validate provider name exists
2. Save key to `config.json`
3. Print confirmation

### `cld set <provider|none>`

Switches the active provider, or disables cld with `none`. Outputs shell code to stdout for eval (used by shell function wrapper).

**Output (stdout - captured by eval via shell function):**

```sh
# Unset previous provider's variables (derived from current env)
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_DEFAULT_OPUS_MODEL
unset ANTHROPIC_DEFAULT_SONNET_MODEL
unset ANTHROPIC_DEFAULT_HAIKU_MODEL
unset CLAUDE_CODE_SUBAGENT_MODEL

# Set new provider's variables
export ANTHROPIC_BASE_URL="https://api.synthetic.new/anthropic"
export ANTHROPIC_AUTH_TOKEN="${CLD_SYNTHETIC_API_KEY}"
export ANTHROPIC_DEFAULT_OPUS_MODEL="hf:moonshotai/Kimi-K2.5"
export ANTHROPIC_DEFAULT_SONNET_MODEL="hf:zai-org/GLM-4.7"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="hf:zai-org/GLM-4.7"
export CLAUDE_CODE_SUBAGENT_MODEL="hf:zai-org/GLM-4.7"
```

**Stderr (informational):**

```
[cld] Switched to synthetic (Synthetic)
```

**`cld set none` - Disable cld:**

```sh
# Output (stdout)
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_DEFAULT_OPUS_MODEL
unset ANTHROPIC_DEFAULT_SONNET_MODEL
unset ANTHROPIC_DEFAULT_HAIKU_MODEL
unset CLAUDE_CODE_SUBAGENT_MODEL
```

```
# Stderr
[cld] Disabled - using default Anthropic API
```

This unsets all provider-specific variables, letting Claude Code use its default Anthropic configuration. Config `activeProvider` is set to `null`.

**Flow:**
1. Validate provider exists (skip for `none`)
2. Scan provider config for required keys (`$CLD_*` patterns in `env` and `routerConfig`)
3. Check all required keys are configured in `~/.cld/config.json`
4. If missing keys, error with list of what's needed:
   ```
   [cld] Error: Missing required keys:
     - CLD_SYNTHETIC_API_KEY (run 'cld setup synthetic <key>')
   ```
5. Read current environment variables to determine what needs to be unset
6. Update `activeProvider` in `config.json` (persists for `cld init` on new shells)
7. For integration providers: write `~/.claude-code-router/config.json`
8. Output `unset` commands for all provider-specific vars currently set
9. Output `export` commands for new provider's variables
10. Print confirmation to stderr

### `cld debug`

Shows current environment variables and config state for debugging:

```
$ cld debug

Config (~/.cld/config.json):
  activeProvider: router-openrouter
  keys:
    CLD_SYNTHETIC_API_KEY: sk-synth-***
    CLD_ROUTER_OPENROUTER_API_KEY: sk-or-***

Environment Variables:
  CLD_ROUTER_KEY: cld-local-***
  CLD_SYNTHETIC_API_KEY: sk-synth-***
  CLD_ROUTER_OPENROUTER_API_KEY: sk-or-***
  ANTHROPIC_BASE_URL: http://127.0.0.1:3456
  ANTHROPIC_AUTH_TOKEN: cld-local-***
  ANTHROPIC_DEFAULT_OPUS_MODEL: (not set)
  ANTHROPIC_DEFAULT_SONNET_MODEL: (not set)
  ANTHROPIC_DEFAULT_HAIKU_MODEL: (not set)
  CLAUDE_CODE_SUBAGENT_MODEL: (not set)

Router Config (~/.claude-code-router/config.json):
  exists: true
  PORT: 3456
  Providers: openrouter
```

**Notes:**
- API keys are masked (show first few chars + `***`)
- Shows both config file state and current shell environment
- Useful for diagnosing mismatches between config and env (e.g., forgot to re-source)

## Environment Variable Management

### Global Environment Variables

Global environment variables are defined in `src/providers/global.ts` and are automatically applied to ALL providers. These vars are merged with provider-specific environment variables, with provider-specific vars taking precedence (allowing overrides).

**Implementation:**

- **Location**: `src/providers/global.ts`
- **Exported as**: `GLOBAL_ENV_VARS` constant object
- **Merge strategy**: Global vars merged first, then provider-specific vars (provider wins on conflict)
- **Helper function**: `getProviderEnv(provider)` in `src/providers/index.ts` performs the merge

**Example:**

```typescript
// src/providers/global.ts
export const GLOBAL_ENV_VARS: Record<string, string> = {
  API_TIMEOUT_MS: '3000000',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  CLAUDE_CODE_DISABLE_TERMINAL_TITLE: '1',
};
```

The `getProviderEnv()` function merges these with provider-specific vars:

```typescript
export function getProviderEnv(provider: Provider): Record<string, string> {
  return {
    ...GLOBAL_ENV_VARS,  // Global vars first (can be overridden)
    ...provider.env,     // Provider-specific vars override globals
  };
}
```

**Usage:**
- Global vars are automatically included when switching providers or running `cld init`
- To modify: Edit `src/providers/global.ts` and rebuild with `bun run build`
- Provider-specific vars can override global vars by defining the same key
- **Important**: Global vars should NOT be added to `PROVIDER_ENV_VARS` arrays - they persist across all providers and should never be unset

### Always Exported

These are always exported by `cld init` regardless of active provider:

| Variable | Source |
|----------|--------|
| `CLD_SYNTHETIC_API_KEY` | User-configured |
| `CLD_ROUTER_OPENROUTER_API_KEY` | User-configured |
| `CLD_ZAI_API_KEY` | User-configured |
| `CLD_CHUTES_API_KEY` | User-configured |
| `CLD_ROUTER_OPENROUTER_API_KEY` | User-configured |
| `CLD_ROUTER_KEY` | Hardcoded in app |
| `API_TIMEOUT_MS` | Global env var (from `global.ts`) |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Global env var (from `global.ts`) |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE` | Global env var (from `global.ts`) |

### Provider-Specific Variables

These are set/unset based on active provider:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_BASE_URL` | API endpoint URL |
| `ANTHROPIC_AUTH_TOKEN` | Mirrors active provider's key |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Model for opus/plan mode |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Model for most tasks |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Model for summarization |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Model for subagents |

### Switching Logic

When switching from Provider A to Provider B:

1. **Keep**: All `CLD_*_API_KEY` variables
2. **Update**: `ANTHROPIC_BASE_URL` to Provider B's URL
3. **Update**: `ANTHROPIC_AUTH_TOKEN` to reference Provider B's key
4. **Set or Unset**: Model variables based on Provider B's `hasModelAliases`

## Hardcoded Values

### CLD_ROUTER_KEY

A fake API key used to authenticate with the local claude-code-router instance:

```typescript
const CLD_ROUTER_KEY = 'cld-local-router-key-do-not-share';
```

This prevents others on the same network from accidentally using your router instance. The actual provider authentication happens inside claude-code-router using the real API keys.

### Provider Registry

All providers are hardcoded in `src/providers/index.ts`:

```typescript
export const providers: Provider[] = [
  zaiProvider,
  syntheticProvider,
  routerOpenrouterProvider,
  chutesProvider,
];
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `cld set` with missing required keys | Error to stderr: "Missing required keys: CLD_X_API_KEY (run 'cld setup x <key>')" |
| `cld setup` with invalid provider name | Error to stderr: "Unknown provider. Run 'cld list' to see available providers." |
| Missing `~/.cld/` directory | `cld init` creates it; other commands error: "Run 'eval \"\$(cld init)\"' first." |
| `cld init` not in shell profile | `cld list`/`cld set` print reminder to stderr |

## Adding New Providers

1. Create provider definition in `src/providers/direct/` or `src/providers/integration/`
2. Add to provider registry in `src/providers/index.ts`
3. Rebuild and publish

Example adding a new direct provider:

```typescript
// src/providers/direct/openrouter.ts
import { DirectProvider } from '../types';

export const openrouterProvider: DirectProvider = {
  type: 'direct',
  name: 'openrouter',
  displayName: 'OpenRouter',
  env: {
    ANTHROPIC_BASE_URL: 'https://openrouter.ai/api/v1',
    ANTHROPIC_AUTH_TOKEN: '${CLD_OPENROUTER_API_KEY}',
    // No model vars - OpenRouter handles model aliasing
  },
};
```

Required keys are automatically derived by scanning `env` for `${CLD_*}` patterns.

## Build

Uses `bun build` (not `bun compile`) to create a bundled script with shebang:

```typescript
// build.ts
import fs from 'fs';
import { $ } from 'bun';

async function build() {
  console.log('Building cld...');

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  await $`bun build src/index.ts --outfile dist/cld --banner '#!/usr/bin/env bun' --target bun --minify`;
  await $`chmod +x dist/cld`;

  console.log('Build complete: dist/cld');
}

build();
```

Run with `bun run build.ts`. Output is a single executable script at `dist/cld`.

## Security Considerations

1. **API keys in plaintext**: `~/.cld/config.json` stores keys in plaintext. File permissions should be `600` (read/write owner only).
2. **Keys visible in shell history**: `cld setup provider key` will appear in history. Use `HISTCONTROL=ignorespace` and prefix with space, or clear history after.
3. **Keys in process list**: `cld setup` args and eval'd exports are visible briefly. Trade-off for scriptability.
4. **Router key**: The `CLD_ROUTER_KEY` is not a real secret, just a local access token to prevent accidental use by others on the network.

## Dependencies

- `bun` - Runtime and package manager
- No external dependencies required for core functionality
- Optional: `chalk` for colored output