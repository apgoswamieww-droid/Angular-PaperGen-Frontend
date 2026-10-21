import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import { AuthService } from './auth.service';
import type { Permission } from './permissions';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};

export const adminAuthGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);

  return adminAuth.isAuthenticated() ? true : inject(Router).createUrlTree(['/admin/login']);
};

export function permissionGuard(permission: Permission): CanActivateFn {
  return () => {
    const auth = inject(AuthService);

    return auth.can(permission) ? true : inject(Router).createUrlTree(['/dashboard']);
  };
}

/**
 * While a password is expired the user may only reach the settings page to
 * set a new one; every other navigation is bounced back to settings.
 */
export const passwordExpiredGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);

  if (!auth.passwordExpired()) {
    return true;
  }

  const url = state.url.split(/[?#]/)[0];

  return url === '/settings' || url.startsWith('/settings/')
    ? true
    : inject(Router).createUrlTree(['/settings']);
};

export const adminGuestGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);

  return adminAuth.isAuthenticated() ? inject(Router).createUrlTree(['/admin/dashboard']) : true;
};
