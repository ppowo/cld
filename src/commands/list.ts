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

  // Calculate max name length for dynamic padding
  const maxNameLen = Math.max(...providers.map(p => p.name.length));

  for (const provider of providers) {
    const keyName = getProviderKeyName(provider.name);
    const isConfigured = keyName in config.keys;
    const isActive = config.activeProvider === provider.name;

    const marker = isActive ? '▸' : ' ';
    const status = isConfigured ? '✓' : '✗';

    // Add quota info if available
    const quotaResult = quotaMap.get(provider.name);
    const quotaStr = quotaResult ? formatQuota(quotaResult) : '';

    const namePadded = provider.name.padEnd(maxNameLen);

    console.log(`${marker} ${namePadded} ${status}${quotaStr}`);
  }
}
