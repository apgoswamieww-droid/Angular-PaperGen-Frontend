import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';
import { AuthService } from './auth.service';
import type { SessionClient } from './session-client';

const EXEMPT_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function isExempt(url: string): boolean {
  return EXEMPT_PATHS.some((path) => url.endsWith(path));
}

function statusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null;
  }

  const status = (error as { status?: unknown }).status;

  return typeof status === 'number' ? status : null;
}

/**
 * Attaches the in-memory access token to API calls and, on a 401, performs a
 * single-flight refresh followed by one retry. When the refresh fails the
 * session is cleared and the user is sent back to the right sign-in page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  const session: SessionClient = req.url.includes('/api/admin') ? adminAuth : auth;
  const token = session.token;
  const authorized =
    token === null
      ? req.clone({ withCredentials: true })
      : req.clone({
          withCredentials: true,
          setHeaders: { Authorization: `Bearer ${token}` },
        });

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (statusOf(error) !== 401 || isExempt(req.url)) {
        return throwError(() => error);
      }

      return session.refresh().pipe(
        switchMap(() => {
          const refreshedToken = session.token;

          return next(
            refreshedToken === null
              ? req.clone({ withCredentials: true })
              : req.clone({
                  withCredentials: true,
                  setHeaders: { Authorization: `Bearer ${refreshedToken}` },
                }),
          );
        }),
        catchError((refreshError: unknown) => {
          session.clear();
          void router.navigateByUrl(session === adminAuth ? '/admin/login' : '/login');

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
