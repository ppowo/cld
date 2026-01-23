import type { Provider } from './types';
import { anthropicProvider } from './direct/anthropic';
import { syntheticProvider } from './direct/synthetic';
import { routerFirmwareProvider } from './integration/router-firmware';

export const providers: Provider[] = [
  anthropicProvider,
  syntheticProvider,
  routerFirmwareProvider,
];

export function getProvider(name: string): Provider | undefined {
  return providers.find((p) => p.name === name);
}

export function getProviderKeyName(providerName: string): string {
  return `CLD_${providerName.toUpperCase().replace(/-/g, '_')}_API_KEY`;
}

// Scan provider config for required keys ($CLD_* or ${CLD_*} patterns)
// Excludes CLD_ROUTER_KEY as it's hardcoded
export function getRequiredKeys(provider: Provider): string[] {
  const keys = new Set<string>();
  const pattern = /\$\{?(CLD_[A-Z_]+)\}?/g;

  // Scan env values
  for (const value of Object.values(provider.env)) {
    let match;
    while ((match = pattern.exec(value)) !== null) {
      if (match[1] !== 'CLD_ROUTER_KEY') {
        keys.add(match[1]);
      }
    }
  }

  // Scan routerConfig for integration providers
  if (provider.type === 'integration') {
    const configStr = JSON.stringify(provider.routerConfig);
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(configStr)) !== null) {
      if (match[1] !== 'CLD_ROUTER_KEY') {
        keys.add(match[1]);
      }
    }
  }

  return Array.from(keys);
}

export { type Provider, type DirectProvider, type IntegrationProvider } from './types';
