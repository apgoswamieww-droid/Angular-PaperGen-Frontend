import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ApiError {
  status: number;
  statusText: string;
  message: string;
  errors: string[];
}

function normalise(res: HttpErrorResponse): ApiError {
  const body = res.error as { message?: unknown } | string | null;

  let message = res.statusText || 'Request failed';
  let errors: string[] = [];

  if (typeof body === 'string' && body.length > 0) {
    message = body;
  } else if (body !== null && typeof body === 'object') {
    const raw = body['message'];
    const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];

    if (list.length > 0) {
      message = list.join(', ');
      errors = list;
    }
  } else if (res.error !== null && res.error !== undefined) {
    message = String(res.error);
  }

  if (res.status === 0) {
    message = 'Unable to reach the server. Is the API running?';
  }

  return { status: res.status, statusText: res.statusText, message, errors };
}

/**
 * Collapses every backend failure into a predictable `ApiError` shape so
 * components never have to branch on HttpErrorResponse internals.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => throwError(() => normalise(error as HttpErrorResponse))),
  );
