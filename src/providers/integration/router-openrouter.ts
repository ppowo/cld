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
        models: ['openai/gpt-oss-20b:free'],
        transformer: {
          use: ['openrouter'],
        },
      },
    ],
    Router: {
      default: 'openrouter,openai/gpt-oss-20b:free',
      think: 'openrouter,openai/gpt-oss-20b:free',
      background: 'openrouter,openai/gpt-oss-20b:free',
      web_search: 'openrouter,openai/gpt-oss-20b:free',
      long_context: 'openrouter,openai/gpt-oss-20b:free',
    },
  },
};
