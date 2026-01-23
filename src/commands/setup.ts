import { readConfig, writeConfig, configExists } from '../config';
import { getProvider, getProviderKeyName } from '../providers';

export function setup(providerName: string, apiKey: string): void {
  if (!configExists()) {
    console.error("[cld] Not initialized. Run 'eval \"$(cld init)\"' first.");
    process.exit(1);
  }

  const provider = getProvider(providerName);
  if (!provider) {
    console.error(`[cld] Unknown provider: ${providerName}`);
    console.error("[cld] Run 'cld list' to see available providers.");
    process.exit(1);
  }

  const keyName = getProviderKeyName(providerName);
  const config = readConfig();
  config.keys[keyName] = apiKey;
  writeConfig(config);

  console.error(`[cld] API key saved for ${providerName}.`);
  console.error(`[cld] Run 'cld set ${providerName}' to switch to this provider.`);
}
