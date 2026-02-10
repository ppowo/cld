import { upstream, models, providers } from '../upstream';
import { ROUTER_DEFAULTS, ROUTER_ENV } from './shared';
import type { IntegrationProvider } from '../types';

export const zaiProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-zai',
  displayName: 'Router: Zai API',
  env: ROUTER_ENV,
  routerConfig: {
    ...ROUTER_DEFAULTS,
    Providers: [upstream.zai, upstream.synthetic],
    Router: {
      default: `${providers.zai},${models.zai.glm47}`,
    },
    fallback: {
      default: [`${providers.synthetic},${models.synthetic.glm47}`],
    },
  },
};
