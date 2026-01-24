import { readConfig, writeConfig, configExists, ensureConfigDir, CLD_ROUTER_KEY } from '../config';
import { getProvider, getProviderEnv, GLOBAL_ENV_VARS } from '../providers';

// Provider-specific env vars that should be unset when not active
const PROVIDER_ENV_VARS = [
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
];

export function init(): void {
  const isFirstRun = !configExists();

  if (isFirstRun) {
    ensureConfigDir();
    writeConfig({ activeProvider: null, keys: {} });
    console.error('[cld] Initialized ~/.cld/config.json');
    console.error("[cld] Run 'cld setup <provider> <key>' to configure a provider");
    console.error("[cld] Run 'cld list' to see available providers");
  }

  const config = readConfig();

  // Always export CLD_ROUTER_KEY
  console.log(`export CLD_ROUTER_KEY="${CLD_ROUTER_KEY}"`);

  // Export all configured API keys
  for (const [key, value] of Object.entries(config.keys)) {
    console.log(`export ${key}="${value}"`);
  }

  // Handle active provider
  if (config.activeProvider) {
    const provider = getProvider(config.activeProvider);
    if (provider) {
      // Export provider's env vars (merged with globals)
      const providerEnv = getProviderEnv(provider);
      for (const [key, value] of Object.entries(providerEnv)) {
        console.log(`export ${key}="${value}"`);
      }

      // Unset vars not in this provider's env
      for (const varName of PROVIDER_ENV_VARS) {
        if (!(varName in providerEnv)) {
          console.log(`unset ${varName}`);
        }
      }

      // Auto-start ccr for integration providers
      if (provider.type === 'integration') {
        console.log('command -v ccr >/dev/null 2>&1 && { ccr status 2>/dev/null | grep -q "Not Running" && { echo "[cld] Starting CCR..." >&2 && ccr start; }; }');
      }
    }
  } else {
    // No active provider - still export global vars
    for (const [key, value] of Object.entries(GLOBAL_ENV_VARS)) {
      console.log(`export ${key}="${value}"`);
    }

    // Unset all provider-specific vars
    for (const varName of PROVIDER_ENV_VARS) {
      console.log(`unset ${varName}`);
    }
  }

  // Output shell function wrapper for seamless switching
  console.log(`
cld() {
  if ! command -v bun >/dev/null 2>&1; then
    echo "[cld] Error: bun is not installed or not in PATH" >&2
    echo "[cld] Install bun: curl -fsSL https://bun.sh/install | bash" >&2
    return 1
  fi
  if [[ "$1" == "set" ]]; then
    eval "$(command cld "$@")"
  else
    command cld "$@"
  fi
}`);
}
