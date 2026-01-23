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
│   │   ├── list.ts           # List providers
│   │   ├── setup.ts          # Configure provider API key
│   │   ├── set.ts            # Switch active provider
│   │   └── debug.ts          # Show env vars and config state
│   ├── providers/
│   │   ├── index.ts          # Provider registry
│   │   ├── types.ts          # Provider type definitions
│   │   ├── direct/
│   │   │   ├── anthropic.ts  # Direct Anthropic API
│   │   │   └── synthetic.ts  # Synthetic API
│   │   └── integration/
│   │       └── router-firmware.ts
│   ├── config.ts             # Config file management (~/.cld/config.json)
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
}
```

**Example: Synthetic Provider (needs model mapping)**

```typescript
const syntheticProvider: DirectProvider = {
  type: 'direct',
  name: 'synthetic',
  displayName: 'Synthetic',
  env: {
    ANTHROPIC_BASE_URL: 'https://api.synthetic.new/anthropic',
    ANTHROPIC_AUTH_TOKEN: '${CLD_SYNTHETIC_API_KEY}',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'hf:zai-org/GLM-4.6',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'hf:zai-org/GLM-4.6',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'hf:zai-org/GLM-4.6',
    CLAUDE_CODE_SUBAGENT_MODEL: 'hf:zai-org/GLM-4.6',
  },
};
```

**Example: OpenRouter (handles model aliases itself)**

```typescript
const openrouterProvider: DirectProvider = {
  type: 'direct',
  name: 'openrouter',
  displayName: 'OpenRouter',
  env: {
    ANTHROPIC_BASE_URL: 'https://openrouter.ai/api/v1',
    ANTHROPIC_AUTH_TOKEN: '${CLD_OPENROUTER_API_KEY}',
    // No model vars needed - provider handles aliasing
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
router-firmware → CLD_ROUTER_FIRMWARE_API_KEY
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
}

interface RouterConfig {
  HOST: string;
  PORT: number;
  APIKEY: string;                  // Always '$CLD_ROUTER_KEY' (hardcoded fake key)
  Providers: RouterProvider[];
  Router: RouterRoutes;
}

interface RouterProvider {
  name: string;
  api_base_url: string;
  api_key: string;                 // Reference to env var, e.g., '$CLD_ROUTER_FIRMWARE_API_KEY'
  models: string[];
}

interface RouterRoutes {
  default: string;                 // 'provider,model' format
  think: string;
  background: string;
  web_search: string;
  long_context: string;
}
```

**Example: Router-Firmware Provider**

```typescript
const routerFirmwareProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-firmware',
  displayName: 'Router: Firmware',
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
        name: 'firmware',
        api_base_url: 'https://app.firmware.ai/api/v1/chat/completions',
        api_key: '$CLD_ROUTER_FIRMWARE_API_KEY',
        models: [
          'claude-sonnet-4-5-20250929',
          'claude-haiku-4-5-20251001',
        ],
      },
    ],
    Router: {
      default: 'firmware,claude-sonnet-4-5-20250929',
      think: 'firmware,claude-sonnet-4-5-20250929',
      background: 'firmware,claude-haiku-4-5-20251001',
      web_search: 'firmware,claude-haiku-4-5-20251001',
      long_context: 'firmware,claude-sonnet-4-5-20250929',
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
      "models": ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]
    }
  ],
  "Router": {
    "default": "firmware,claude-sonnet-4-5-20250929",
    "think": "firmware,claude-sonnet-4-5-20250929",
    "background": "firmware,claude-haiku-4-5-20251001",
    "web_search": "firmware,claude-haiku-4-5-20251001",
    "long_context": "firmware,claude-sonnet-4-5-20250929"
  }
}
```

## Config Files

### ~/.cld/config.json

Stores all configured API keys and the currently active provider:

```json
{
  "activeProvider": "router-firmware",
  "keys": {
    "CLD_SYNTHETIC_API_KEY": "sk-synth-xxx",
    "CLD_ROUTER_FIRMWARE_API_KEY": "sk-firmware-xxx",
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
export CLD_ROUTER_FIRMWARE_API_KEY="sk-firmware-xxx"
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

Lists all available providers with their status:

```
$ cld list

Providers:
  anthropic          Direct Anthropic API           [not configured]
  synthetic          Synthetic                      [configured]
* router-firmware    Router: Firmware               [configured] (active)

* = currently active (use 'cld set none' to disable)
```

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
export ANTHROPIC_DEFAULT_OPUS_MODEL="hf:zai-org/GLM-4.6"
export ANTHROPIC_DEFAULT_SONNET_MODEL="hf:zai-org/GLM-4.6"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="hf:zai-org/GLM-4.6"
export CLAUDE_CODE_SUBAGENT_MODEL="hf:zai-org/GLM-4.6"
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
  activeProvider: router-firmware
  keys:
    CLD_SYNTHETIC_API_KEY: sk-synth-***
    CLD_ROUTER_FIRMWARE_API_KEY: sk-firm-***

Environment Variables:
  CLD_ROUTER_KEY: cld-local-***
  CLD_SYNTHETIC_API_KEY: sk-synth-***
  CLD_ROUTER_FIRMWARE_API_KEY: sk-firm-***
  ANTHROPIC_BASE_URL: http://127.0.0.1:3456
  ANTHROPIC_AUTH_TOKEN: cld-local-***
  ANTHROPIC_DEFAULT_OPUS_MODEL: (not set)
  ANTHROPIC_DEFAULT_SONNET_MODEL: (not set)
  ANTHROPIC_DEFAULT_HAIKU_MODEL: (not set)
  CLAUDE_CODE_SUBAGENT_MODEL: (not set)

Router Config (~/.claude-code-router/config.json):
  exists: true
  PORT: 3456
  Providers: firmware
```

**Notes:**
- API keys are masked (show first few chars + `***`)
- Shows both config file state and current shell environment
- Useful for diagnosing mismatches between config and env (e.g., forgot to re-source)

## Environment Variable Management

### Always Exported

These are always exported by `cld init` regardless of active provider:

| Variable | Source |
|----------|--------|
| `CLD_SYNTHETIC_API_KEY` | User-configured |
| `CLD_ROUTER_FIRMWARE_API_KEY` | User-configured |
| `CLD_ANTHROPIC_API_KEY` | User-configured |
| `CLD_ROUTER_KEY` | Hardcoded in app |

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
  anthropicProvider,
  syntheticProvider,
  routerFirmwareProvider,
  // Add more providers here
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