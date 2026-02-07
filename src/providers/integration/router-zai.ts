import type { IntegrationProvider } from '../types';

export const zaiProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-zai',
  displayName: 'Router: Zai API',
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
        name: 'zai',
        api_base_url: 'https://api.z.ai/api/anthropic/v1/messages',
        api_key: '$CLD_ROUTER_ZAI_API_KEY',
        models: ['glm-4.7'],
        transformer: {
          use: ['Anthropic'],
        },
      },
      {
        name: 'synthetic',
        api_base_url: 'https://api.synthetic.new/anthropic/v1/messages',
        api_key: '$CLD_ROUTER_SYNTHETIC_API_KEY',
        models: ['hf:zai-org/GLM-4.7'],
        transformer: {
          use: ['Anthropic'],
        },
      },
    ],
    Router: {
      default: 'zai,glm-4.7',
    },
    fallback: {
      default: ['synthetic,hf:zai-org/GLM-4.7'],
    },
  },
};