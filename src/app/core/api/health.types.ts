export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  uptime: number;
}
