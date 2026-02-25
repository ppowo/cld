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
    Providers: [upstream.opencodezen, upstream.openrouter],
    Router: {
      default: `${providers.opencodezen},${models.opencodezen.bigpickle}`
    },
    fallback: {
      default:[`${providers.openrouter},${models.openrouter.free}`]
    },
  },
};
