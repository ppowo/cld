import type { Provider } from './types';
import { zaiProvider } from './direct/zai';
import { syntheticProvider } from './direct/synthetic';
import { chutesProvider } from './direct/chutes';
import { routerFirmwareProvider } from './integration/router-firmware';
import { routerOpenrouterProvider } from './integration/router-openrouter';
import { GLOBAL_ENV_VARS } from './global';

export const providers: Provider[] = [
  zaiProvider,
  syntheticProvider,
  routerOpenrouterProvider,
  chutesProvider,
  routerFirmwareProvider,
];

export function getProvider(name: string): Provider | undefined {
  return providers.find((p) => p.name === name);
}

export function getProviderKeyName(providerName: string): string {
  return `CLD_${providerName.toUpperCase().replace(/-/g, '_')}_API_KEY`;
}

export function getProviderEnv(provider: Provider): Record<string, string> {
  return {
    ...GLOBAL_ENV_VARS,  // Global vars first (can be overridden)
    ...provider.env,     // Provider-specific vars override globals
  };
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

export { GLOBAL_ENV_VARS } from './global';
export { type Provider, type DirectProvider, type IntegrationProvider } from './types';
