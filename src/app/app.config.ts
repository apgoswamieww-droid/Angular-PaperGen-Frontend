import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { apiBaseUrlInterceptor } from './core/api/api-base-url.interceptor';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';
import { AdminAuthService } from './core/auth/admin-auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiBaseUrlInterceptor, authInterceptor, apiErrorInterceptor]),
    ),
    provideAppInitializer(() => {
      const session = window.location.pathname.startsWith('/admin')
        ? inject(AdminAuthService)
        : inject(AuthService);

      return session.restore();
    }),
  ],
};
