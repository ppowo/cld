import { readConfig, writeConfig, configExists } from '../config';
import { getProvider, getRequiredKeys, getProviderKeyName } from '../providers';
import { writeRouterConfig } from '../router-config';

// Provider-specific env vars that should be unset when switching
const PROVIDER_ENV_VARS = [
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
];

export function set(providerName: string): void {
  if (!configExists()) {
    console.error("[cld] Not initialized. Run 'eval \"$(cld init)\"' first.");
    process.exit(1);
  }

  const config = readConfig();

  // Handle 'none' - disable cld
  if (providerName === 'none') {
    config.activeProvider = null;
    writeConfig(config);

    // Unset all provider-specific vars
    for (const varName of PROVIDER_ENV_VARS) {
      console.log(`unset ${varName}`);
    }

    console.error('[cld] Disabled - using default Anthropic API');
    return;
  }

  const provider = getProvider(providerName);
  if (!provider) {
    console.error(`[cld] Unknown provider: ${providerName}`);
    console.error("[cld] Run 'cld list' to see available providers.");
    process.exit(1);
  }

  // Check required keys are configured
  const requiredKeys = getRequiredKeys(provider);
  const missingKeys = requiredKeys.filter((key) => !(key in config.keys));

  if (missingKeys.length > 0) {
    console.error('[cld] Error: Missing required keys:');
    for (const key of missingKeys) {
      // Derive provider name from key: CLD_SYNTHETIC_API_KEY -> synthetic
      const keyProviderName = key
        .replace(/^CLD_/, '')
        .replace(/_API_KEY$/, '')
        .toLowerCase()
        .replace(/_/g, '-');
      console.error(`  - ${key} (run 'cld setup ${keyProviderName} <key>')`);
    }
    process.exit(1);
  }

  // Update config
  config.activeProvider = providerName;
  writeConfig(config);

  // Write router config for integration providers
  if (provider.type === 'integration') {
    writeRouterConfig(provider.routerConfig);
    console.error(`[cld] Config written to ~/.claude-code-router/config.json`);
  }

  // Output unset commands for all provider-specific vars
  for (const varName of PROVIDER_ENV_VARS) {
    console.log(`unset ${varName}`);
  }

  // Export all configured API keys (so ${CLD_*} references resolve to latest values)
  for (const [key, value] of Object.entries(config.keys)) {
    console.log(`export ${key}="${value}"`);
  }

  // Output export commands for new provider's vars
  for (const [key, value] of Object.entries(provider.env)) {
    console.log(`export ${key}="${value}"`);
  }

  // Restart router for integration providers (after exports are eval'd)
  if (provider.type === 'integration') {
    console.log('command -v ccr >/dev/null && (ccr stop 2>/dev/null; ccr restart)');
  }

  console.error(`[cld] Switched to ${providerName} (${provider.displayName})`);
}
