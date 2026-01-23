import { readConfig, configExists } from '../config';
import { providers, getProviderKeyName } from '../providers';

export function list(): void {
  if (!configExists()) {
    console.error("[cld] Not initialized. Run 'eval \"$(cld init)\"' first.");
    process.exit(1);
  }

  const config = readConfig();

  console.log('\nProviders:');

  for (const provider of providers) {
    const keyName = getProviderKeyName(provider.name);
    const isConfigured = keyName in config.keys;
    const isActive = config.activeProvider === provider.name;

    const marker = isActive ? '*' : ' ';
    const status = isConfigured
      ? isActive
        ? '[configured] (active)'
        : '[configured]'
      : '[not configured]';

    const namePadded = provider.name.padEnd(18);
    const displayPadded = provider.displayName.padEnd(25);

    console.log(`${marker} ${namePadded} ${displayPadded} ${status}`);
  }

  console.log("\n* = currently active (use 'cld set none' to disable)");
}
