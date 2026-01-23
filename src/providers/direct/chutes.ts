import type { DirectProvider } from '../types';

export const chutesProvider: DirectProvider = {
  type: 'direct',
  name: 'chutes',
  displayName: 'Chutes.ai',
  env: {
    ANTHROPIC_BASE_URL: 'https://claude.chutes.ai',
    ANTHROPIC_AUTH_TOKEN: '${CLD_CHUTES_API_KEY}',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'moonshotai/Kimi-K2-Thinking-TEE',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'moonshotai/Kimi-K2-Thinking-TEE',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'moonshotai/Kimi-K2-Thinking-TEE',
    CLAUDE_CODE_SUBAGENT_MODEL: 'moonshotai/Kimi-K2-Thinking-TEE',
  },
};
