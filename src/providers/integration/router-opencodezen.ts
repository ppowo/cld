import type { IntegrationProvider } from '../types';

export const routerOpencodezenProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-opencodezen',
  displayName: 'Router: OpenCodeZen',
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
        name: 'opencodezen',
        api_base_url: 'https://opencode.ai/zen/v1/chat/completions',
        api_key: '$CLD_ROUTER_OPENCODEZEN_API_KEY',
        models: ['kimi-k2.5', 'gpt-4.7'],
        transformer: {
          use: ['openrouter'],
        },
      },
      {
        name: 'synthetic',
        api_base_url: 'https://api.synthetic.new/anthropic/v1/messages',
        api_key: '$CLD_ROUTER_SYNTHETIC_API_KEY',
        models: ['hf:moonshotai/Kimi-K2.5'],
        transformer: {
          use: ['Anthropic'],
        },
      },
    ],
    Router: {
      default: 'opencodezen,gpt-4.7',
      think: 'opencodezen,kimi-k2.5',
    },
    fallback: {
      default: ['synthetic,hf:zai-org/GLM-4.7'],
      think: ['synthetic,hf:moonshotai/Kimi-K2.5'],
    },
  },
};