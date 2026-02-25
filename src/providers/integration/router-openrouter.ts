import { upstream, models, providers } from '../upstream';
import { ROUTER_DEFAULTS, ROUTER_ENV } from './shared';
import type { IntegrationProvider } from '../types';

export const routerOpenrouterProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-openrouter',
  displayName: 'Router: OpenRouter',
  env: ROUTER_ENV,
  routerConfig: {
    ...ROUTER_DEFAULTS,
    Providers: [upstream.openrouter, upstream.opencodezen],
    Router: {
      default: `${providers.openrouter},${models.openrouter.free}`
    },
    fallback: {
      default:[`${providers.opencodezen},${models.opencodezen.bigpickle}`]
    },
  },
};
