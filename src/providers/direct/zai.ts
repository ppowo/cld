import type { DirectProvider } from '../types';

export const zaiProvider: DirectProvider = {
  type: 'direct',
  name: 'zai',
  displayName: 'Direct Zai API',
  env: {
    ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
    ANTHROPIC_AUTH_TOKEN: '${CLD_ZAI_API_KEY}',
  },
};