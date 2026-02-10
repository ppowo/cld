import { upstream, models, providers } from '../upstream';
import { ROUTER_DEFAULTS, ROUTER_ENV } from './shared';
import type { IntegrationProvider } from '../types';

export const routerOpencodezenProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-opencodezen',
  displayName: 'Router: OpenCodeZen',
  env: ROUTER_ENV,
  routerConfig: {
    ...ROUTER_DEFAULTS,
    Providers: [upstream.opencodezen, upstream.synthetic],
    Router: {
      default: `${providers.opencodezen},${models.opencodezen.gpt47}`,
      think: `${providers.opencodezen},${models.opencodezen.kimi25}`,
    },
    fallback: {
      default: [`${providers.synthetic},${models.synthetic.glm47}`],
      think: [`${providers.synthetic},${models.synthetic.kimi25}`],
    },
  },
};
