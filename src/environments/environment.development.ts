import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  /**
   * Empty on purpose: the dev server proxies /api to the NestJS backend, so the
   * app talks to a same-origin path and never trips CORS. See proxy.conf.json.
   */
  apiUrl: '',
};
