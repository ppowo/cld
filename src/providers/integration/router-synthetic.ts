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
    Providers: [upstream.synthetic, upstream.zai],
    Router: {
      default: `${providers.synthetic},${models.synthetic.glm47}`,
      think: `${providers.synthetic},${models.synthetic.kimi25}`,
    },
    fallback: {
      default: [`${providers.zai},${models.zai.glm47}`],
    },
  },
  quota: {
    url: 'https://api.synthetic.new/v2/quotas',
    authKeyName: 'CLD_ROUTER_SYNTHETIC_API_KEY',
    parser: 'synthetic',
  },
};
