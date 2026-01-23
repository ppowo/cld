export interface DirectProvider {
  type: 'direct';
  name: string;
  displayName: string;
  env: Record<string, string>;
}

export interface RouterProvider {
  name: string;
  api_base_url: string;
  api_key: string;
  models: string[];
}

export interface RouterRoutes {
  default: string;
  think: string;
  background: string;
  web_search: string;
  long_context: string;
}

export interface RouterConfig {
  HOST: string;
  PORT: number;
  APIKEY: string;
  Providers: RouterProvider[];
  Router: RouterRoutes;
}

export interface IntegrationProvider {
  type: 'integration';
  name: string;
  displayName: string;
  env: Record<string, string>;
  routerConfig: RouterConfig;
}

export type Provider = DirectProvider | IntegrationProvider;
