import type { IntegrationProvider } from '../types';

export const routerOpenrouterProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-openrouter',
  displayName: 'Router: OpenRouter',
  env: {
    ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456',
    ANTHROPIC_AUTH_TOKEN: '${CLD_ROUTER_KEY}',
  },
  routerConfig: {
    HOST: '127.0.0.1',
    PORT: 3456,
    APIKEY: '$CLD_ROUTER_KEY',
    Providers: [
      {
        name: 'openrouter',
        api_base_url: 'https://openrouter.ai/api/v1/chat/completions',
        api_key: '$CLD_ROUTER_OPENROUTER_API_KEY',
        models: ['openrouter/pony-alpha'],
        transformer: {
          use: ['openrouter'],
        },
      },
      {
        name: 'zai',
        api_base_url: 'https://api.z.ai/api/anthropic/v1/messages',
        api_key: '$CLD_ROUTER_ZAI_API_KEY',
        models: ['glm-4.7'],
        transformer: {
          use: ['Anthropic'],
        },
      },
    ],
    Router: {
      default: 'openrouter,openrouter/pony-alpha',
    },
    fallback: {
      default: ['zai,glm-4.7'],
    },
  },
};