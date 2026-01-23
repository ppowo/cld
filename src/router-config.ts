import fs from 'fs';
import path from 'path';
import os from 'os';
import type { RouterConfig } from './providers/types';

const ROUTER_CONFIG_DIR = path.join(os.homedir(), '.claude-code-router');
const ROUTER_CONFIG_PATH = path.join(ROUTER_CONFIG_DIR, 'config.json');

export function writeRouterConfig(config: RouterConfig): void {
  if (!fs.existsSync(ROUTER_CONFIG_DIR)) {
    fs.mkdirSync(ROUTER_CONFIG_DIR, { mode: 0o700 });
  }
  fs.writeFileSync(ROUTER_CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function readRouterConfig(): RouterConfig | null {
  if (!fs.existsSync(ROUTER_CONFIG_PATH)) {
    return null;
  }
  const content = fs.readFileSync(ROUTER_CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

export function routerConfigExists(): boolean {
  return fs.existsSync(ROUTER_CONFIG_PATH);
}

export function getRouterConfigPath(): string {
  return ROUTER_CONFIG_PATH;
}
