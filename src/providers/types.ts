export interface QuotaResponse {
  used: number;           // 0 to 1
  reset: string | null;   // ISO 8601 timestamp
  remaining?: number;     // Absolute count remaining (if available)
  total?: number;         // Total quota (if available)
}

export interface QuotaConfig {
  url: string;            // Quota endpoint URL
  authKeyName: string;    // Key name for auth (e.g., 'CLD_SYNTHETIC_API_KEY')
  parser?: string;        // Named parser from quotaParsers (default: expects { used, reset })
}

export interface DirectProvider {
  type: 'direct';
  name: string;
  displayName: string;
  env: Record<string, string>;
  quota?: QuotaConfig;
}

export interface RouterProvider {
  name: string;
  api_base_url: string;
  api_key: string;
  models: string[];
  transformer?: Record<string, unknown>;
}

export interface RouterRoutes {
  default: string;
  think?: string;
  background?: string;
  longContext?: string;
  webSearch?: string;
  image?: string;
}

export interface RouterConfig {
  HOST: string;
  PORT: number;
  APIKEY: string;
  Providers: RouterProvider[];
  Router: RouterRoutes;
  fallback?: Record<string, string[]>;
}

export interface IntegrationProvider {
  type: 'integration';
  name: string;
  displayName: string;
  env: Record<string, string>;
  routerConfig: RouterConfig;
  quota?: QuotaConfig;
}

export type Provider = DirectProvider | IntegrationProvider;
