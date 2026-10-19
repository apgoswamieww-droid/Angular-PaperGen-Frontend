import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  /**
   * Empty in production when the API is served from the same origin behind a
   * reverse proxy. Set to an absolute origin such as 'https://api.example.com'
   * when the backend lives on a different host.
   */
  apiUrl: '',
};
