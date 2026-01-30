import { readConfig, configExists } from '../config';
import { providers, getProviderKeyName } from '../providers';
import { fetchQuota, formatQuota, type QuotaResult } from '../quota';

export async function list(): Promise<void> {
  if (!configExists()) {
    console.error("[cld] Not initialized. Run 'eval \"$(cld init)\"' first.");
    process.exit(1);
  }

  const config = readConfig();

  // Fetch quotas in parallel for configured providers that have quota config
  const quotaPromises: Promise<{ name: string; result: QuotaResult }>[] = [];

  for (const provider of providers) {
    if (!provider.quota) continue;

    const keyName = getProviderKeyName(provider.name);
    const isConfigured = keyName in config.keys;
    if (!isConfigured) continue;

    quotaPromises.push(
      fetchQuota(provider.quota, config).then((result) => ({
        name: provider.name,
        result,
      }))
    );
  }

  const quotaResults = await Promise.all(quotaPromises);
  const quotaMap = new Map(quotaResults.map((q) => [q.name, q.result]));

  console.log('\nProviders:');

  for (const provider of providers) {
    const keyName = getProviderKeyName(provider.name);
    const isConfigured = keyName in config.keys;
    const isActive = config.activeProvider === provider.name;

    const marker = isActive ? '*' : ' ';
    let status = isConfigured
      ? isActive
        ? '[configured] (active)'
        : '[configured]'
      : '[not configured]';

    // Add quota info if available
    const quotaResult = quotaMap.get(provider.name);
    if (quotaResult) {
      status += ' ' + formatQuota(quotaResult);
    }

    const namePadded = provider.name.padEnd(18);
    const displayPadded = provider.displayName.padEnd(25);

    console.log(`${marker} ${namePadded} ${displayPadded} ${status}`);
  }

  console.log("\n* = currently active (use 'cld set none' to disable)");
}
