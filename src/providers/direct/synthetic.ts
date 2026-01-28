import type { DirectProvider } from '../types';

export const syntheticProvider: DirectProvider = {
  type: 'direct',
  name: 'synthetic',
  displayName: 'Synthetic',
  env: {
    ANTHROPIC_BASE_URL: 'https://api.synthetic.new/anthropic',
    ANTHROPIC_AUTH_TOKEN: '${CLD_SYNTHETIC_API_KEY}',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'hf:moonshotai/Kimi-K2.5',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'hf:moonshotai/Kimi-K2.5',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'hf:moonshotai/Kimi-K2.5',
    CLAUDE_CODE_SUBAGENT_MODEL: 'hf:moonshotai/Kimi-K2.5',
  },
};
