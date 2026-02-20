import { upstream, models, providers } from '../upstream';
import { ROUTER_DEFAULTS, ROUTER_ENV } from './shared';
import type { IntegrationProvider } from '../types';

export const syntheticProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-synthetic',
  displayName: 'Router: Synthetic',
  env: ROUTER_ENV,
  routerConfig: {
    ...ROUTER_DEFAULTS,
    Providers: [upstream.synthetic, upstream.openrouter],
    Router: {
      default: `${providers.synthetic},${models.synthetic.glm47}`,
      think: `${providers.synthetic},${models.synthetic.kimi25}`,
    },
    fallback: {
      default: [`${providers.openrouter},${models.openrouter.free}`],
      think: [`${providers.openrouter},${models.openrouter.free}`],
    },
  },
  quota: {
    url: 'https://api.synthetic.new/v2/quotas',
    authKeyName: 'CLD_ROUTER_SYNTHETIC_API_KEY',
    parser: 'synthetic',
  },
};
