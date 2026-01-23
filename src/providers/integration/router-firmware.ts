import type { IntegrationProvider } from '../types';

export const routerFirmwareProvider: IntegrationProvider = {
  type: 'integration',
  name: 'router-firmware',
  displayName: 'Router: Firmware',
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
        name: 'firmware',
        api_base_url: 'https://app.firmware.ai/api/v1/chat/completions',
        api_key: '$CLD_ROUTER_FIRMWARE_API_KEY',
        models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'],
      },
    ],
    Router: {
      default: 'firmware,claude-sonnet-4-5-20250929',
      think: 'firmware,claude-sonnet-4-5-20250929',
      background: 'firmware,claude-haiku-4-5-20251001',
      web_search: 'firmware,claude-haiku-4-5-20251001',
      long_context: 'firmware,claude-sonnet-4-5-20250929',
    },
  },
};
