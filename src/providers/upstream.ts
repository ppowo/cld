import type { RouterProvider } from './types';

export const providers = {
  zai: 'zai',
  synthetic: 'synthetic',
  openrouter: 'openrouter',
  opencodezen: 'opencodezen',
} as const;

export const models = {
  zai: {
    glm47: 'glm-4.7',
  },
  synthetic: {
    glm47: 'hf:zai-org/GLM-4.7',
    kimi25: 'hf:moonshotai/Kimi-K2.5',
  },
  openrouter: {
    pony: 'openrouter/pony-alpha',
  },
  opencodezen: {
    kimi25: 'kimi-k2.5',
    gpt47: 'gpt-4.7',
  },
} as const;

export const upstream: Record<string, RouterProvider> = {
  zai: {
    name: providers.zai,
    api_base_url: 'https://api.z.ai/api/anthropic/v1/messages',
    api_key: '$CLD_ROUTER_ZAI_API_KEY',
    models: Object.values(models.zai),
    transformer: { use: ['Anthropic'] },
  },
  synthetic: {
    name: providers.synthetic,
    api_base_url: 'https://api.synthetic.new/anthropic/v1/messages',
    api_key: '$CLD_ROUTER_SYNTHETIC_API_KEY',
    models: Object.values(models.synthetic),
    transformer: { use: ['Anthropic'] },
  },
  openrouter: {
    name: providers.openrouter,
    api_base_url: 'https://openrouter.ai/api/v1/chat/completions',
    api_key: '$CLD_ROUTER_OPENROUTER_API_KEY',
    models: Object.values(models.openrouter),
    transformer: { use: ['openrouter'] },
  },
  opencodezen: {
    name: providers.opencodezen,
    api_base_url: 'https://opencode.ai/zen/v1/chat/completions',
    api_key: '$CLD_ROUTER_OPENCODEZEN_API_KEY',
    models: Object.values(models.opencodezen),
    transformer: { use: ['openrouter'] },
  },
};