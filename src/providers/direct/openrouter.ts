import type { DirectProvider } from '../types';

export const openrouterProvider: DirectProvider = {
  type: 'direct',
  name: 'openrouter',
  displayName: 'OpenRouter',
  env: {
    ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
    ANTHROPIC_AUTH_TOKEN: '${CLD_OPENROUTER_API_KEY}',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'z-ai/glm-4.5-air:free',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'z-ai/glm-4.5-air:free',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'z-ai/glm-4.5-air:free',
    CLAUDE_CODE_SUBAGENT_MODEL: 'z-ai/glm-4.5-air:free',
  },
};
