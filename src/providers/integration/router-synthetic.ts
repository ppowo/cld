import type { IntegrationProvider } from '../types';

export const syntheticProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-synthetic',
  displayName: 'Router: Synthetic',
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
        name: 'synthetic',
        api_base_url: 'https://api.synthetic.new/anthropic/v1/messages',
        api_key: '$CLD_ROUTER_SYNTHETIC_API_KEY',
        models: ['hf:zai-org/GLM-4.7', 'hf:moonshotai/Kimi-K2.5'],
        transformer: {
          use: ['Anthropic'],
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
      default: 'synthetic,hf:zai-org/GLM-4.7',
      think: 'synthetic,hf:moonshotai/Kimi-K2.5',
    },
    fallback: {
      default: ['zai,glm-4.7'],
    },
  },
  quota: {
    url: 'https://api.synthetic.new/v2/quotas',
    authKeyName: 'CLD_ROUTER_SYNTHETIC_API_KEY',
    parser: 'synthetic',
  },
};
