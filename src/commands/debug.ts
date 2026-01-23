import { readConfig, configExists, getConfigPath, CLD_ROUTER_KEY } from '../config';
import { readRouterConfig, routerConfigExists, getRouterConfigPath } from '../router-config';

function maskKey(key: string): string {
  if (!key || key.length < 10) return '***';
  return key.substring(0, 8) + '***';
}

const ENV_VARS_TO_CHECK = [
  'CLD_ROUTER_KEY',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
];

export function debug(): void {
  // Config file state
  console.log(`\nConfig (${getConfigPath()}):`);

  if (!configExists()) {
    console.log('  (not initialized)');
  } else {
    const config = readConfig();
    console.log(`  activeProvider: ${config.activeProvider || '(none)'}`);
    console.log('  keys:');
    if (Object.keys(config.keys).length === 0) {
      console.log('    (none configured)');
    } else {
      for (const [key, value] of Object.entries(config.keys)) {
        console.log(`    ${key}: ${maskKey(value)}`);
      }
    }
  }

  // Environment variables
  console.log('\nEnvironment Variables:');
  for (const varName of ENV_VARS_TO_CHECK) {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      const masked =
        varName.includes('KEY') || varName.includes('TOKEN') ? maskKey(value) : value;
      console.log(`  ${varName}: ${masked}`);
    } else {
      console.log(`  ${varName}: (not set)`);
    }
  }

  // Also check any CLD_*_API_KEY vars
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('CLD_') && key.endsWith('_API_KEY') && !ENV_VARS_TO_CHECK.includes(key)) {
      console.log(`  ${key}: ${maskKey(value || '')}`);
    }
  }

  // Router config
  console.log(`\nRouter Config (${getRouterConfigPath()}):`);
  if (!routerConfigExists()) {
    console.log('  exists: false');
  } else {
    const routerConfig = readRouterConfig();
    if (routerConfig) {
      console.log('  exists: true');
      console.log(`  PORT: ${routerConfig.PORT}`);
      console.log(`  Providers: ${routerConfig.Providers.map((p) => p.name).join(', ')}`);
    }
  }

  console.log('');
}
