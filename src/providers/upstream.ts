import type { RouterProvider } from './types';

export const providers = {
  synthetic: 'synthetic',
  openrouter: 'openrouter',
  opencodezen: 'opencodezen',
} as const;

export const models = {
  synthetic: {
    minimax25: 'hf:MiniMaxAI/MiniMax-M2.5',
    qwen35_397b: 'hf:Qwen/Qwen3.5-397B-A17B',
    kimi25_nvfp4: 'hf:nvidia/Kimi-K2.5-NVFP4',
  },
  openrouter: {
    free: 'openrouter/free',
  },
  opencodezen: {
    bigpickle: 'big-pickle',
  },
} as const;

export const upstream: Record<string, RouterProvider> = {
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