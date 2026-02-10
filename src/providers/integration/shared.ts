export const ROUTER_ENV = {
  ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456',
  ANTHROPIC_AUTH_TOKEN: '${CLD_ROUTER_KEY}',
} as const;

export const ROUTER_DEFAULTS = {
  HOST: '127.0.0.1',
  PORT: 3456,
  APIKEY: '$CLD_ROUTER_KEY',
} as const;
