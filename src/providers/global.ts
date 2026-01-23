/**
 * Global environment variables applied to ALL providers.
 * Provider-specific env vars can override these.
 */
export const GLOBAL_ENV_VARS: Record<string, string> = {
  API_TIMEOUT_MS: '3000000', 
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  CLAUDE_CODE_DISABLE_TERMINAL_TITLE: '1',
};