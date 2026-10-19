export interface Environment {
  readonly production: boolean;
  /** Empty when the API is same-origin (dev proxy or reverse proxy). */
  readonly apiUrl: string;
}
