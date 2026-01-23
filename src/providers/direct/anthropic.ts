import type { DirectProvider } from '../types';

export const anthropicProvider: DirectProvider = {
  type: 'direct',
  name: 'anthropic',
  displayName: 'Direct Anthropic API',
  env: {
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
    ANTHROPIC_AUTH_TOKEN: '${CLD_ANTHROPIC_API_KEY}',
  },
};
