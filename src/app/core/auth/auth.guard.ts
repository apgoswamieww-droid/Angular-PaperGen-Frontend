import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import { AuthService } from './auth.service';

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

export const schoolAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  return auth.user()?.role === 'school_admin' ? true : inject(Router).createUrlTree(['/dashboard']);
};

export const adminGuestGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);

  return adminAuth.isAuthenticated() ? inject(Router).createUrlTree(['/admin/dashboard']) : true;
};
