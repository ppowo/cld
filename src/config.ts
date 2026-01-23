import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Config {
  activeProvider: string | null;
  keys: Record<string, string>;
}

const CLD_DIR = path.join(os.homedir(), '.cld');
const CONFIG_PATH = path.join(CLD_DIR, 'config.json');

export const CLD_ROUTER_KEY = 'cld-local-router-key-do-not-share';

export function configExists(): boolean {
  return fs.existsSync(CONFIG_PATH);
}

export function ensureConfigDir(): boolean {
  const created = !fs.existsSync(CLD_DIR);
  if (created) {
    fs.mkdirSync(CLD_DIR, { mode: 0o700 });
  }
  return created;
}

export function readConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { activeProvider: null, keys: {} };
  }
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

export function writeConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getConfigDir(): string {
  return CLD_DIR;
}
