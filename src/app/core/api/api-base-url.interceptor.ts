import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const ABSOLUTE_URL = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;

/**
 * Prepends `environment.apiUrl` to same-origin requests. When `apiUrl` is empty
 * the URL is left untouched, which is the dev-proxy setup.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiUrl } = environment;

  if (!apiUrl || ABSOLUTE_URL.test(req.url)) {
    return next(req);
  }

  return next(req.clone({ url: `${apiUrl.replace(/\/$/, '')}${req.url}` }));
};
