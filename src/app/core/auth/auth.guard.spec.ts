import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import {
  adminAuthGuard,
  adminGuestGuard,
  authGuard,
  guestGuard,
  passwordExpiredGuard,
  permissionGuard,
} from './auth.guard';
import { AuthService } from './auth.service';

const SNAPSHOT = {} as ActivatedRouteSnapshot;
const STATE = { url: '/dashboard' } as RouterStateSnapshot;

describe('auth guards', () => {
  function configure(
    signedIn: boolean,
    adminSignedIn: boolean,
    role = 'teacher',
    permissions: string[] = [],
    passwordExpired = false,
  ): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => signedIn,
            user: () => (signedIn ? { id: 'u1', role, permissions } : null),
            can: (permission: string) => signedIn && permissions.includes(permission),
            passwordExpired: () => signedIn && passwordExpired,
          },
        },
        { provide: AdminAuthService, useValue: { isAuthenticated: () => adminSignedIn } },
      ],
    });
  }

  function urlOf(result: ReturnType<typeof authGuard>): string {
    if (typeof result === 'boolean') {
      return String(result);
    }

    if (result instanceof UrlTree) {
      return result.toString();
    }

    throw new Error('Unexpected guard result');
  }

  it('authGuard lets authenticated users through', () => {
    configure(true, false);

    expect(TestBed.runInInjectionContext(() => authGuard(SNAPSHOT, STATE))).toBe(true);
  });

  it('authGuard sends guests to /login', () => {
    configure(false, false);

    expect(urlOf(TestBed.runInInjectionContext(() => authGuard(SNAPSHOT, STATE)))).toBe('/login');
  });

  it('guestGuard sends authenticated users to /dashboard', () => {
    configure(true, false);

    expect(urlOf(TestBed.runInInjectionContext(() => guestGuard(SNAPSHOT, STATE)))).toBe(
      '/dashboard',
    );
  });

  it('guestGuard lets guests view the login page', () => {
    configure(false, false);

    expect(TestBed.runInInjectionContext(() => guestGuard(SNAPSHOT, STATE))).toBe(true);
  });

  it('adminAuthGuard sends unauthorised users to /admin/login', () => {
    configure(true, false);

    expect(urlOf(TestBed.runInInjectionContext(() => adminAuthGuard(SNAPSHOT, STATE)))).toBe(
      '/admin/login',
    );
  });

  it('adminGuestGuard sends authenticated admins to /admin/dashboard', () => {
    configure(false, true);

    expect(urlOf(TestBed.runInInjectionContext(() => adminGuestGuard(SNAPSHOT, STATE)))).toBe(
      '/admin/dashboard',
    );
  });

  it('permissionGuard lets users with the required permission through', () => {
    configure(true, false, 'teacher', ['users.manage']);

    expect(
      TestBed.runInInjectionContext(() => permissionGuard('users.manage')(SNAPSHOT, STATE)),
    ).toBe(true);
  });

  it('permissionGuard sends users without the permission to /dashboard', () => {
    configure(true, false, 'teacher', ['questions.view']);

    expect(
      urlOf(TestBed.runInInjectionContext(() => permissionGuard('users.manage')(SNAPSHOT, STATE))),
    ).toBe('/dashboard');
  });

  it('permissionGuard sends guests to /dashboard', () => {
    configure(false, false);

    expect(
      urlOf(TestBed.runInInjectionContext(() => permissionGuard('roles.view')(SNAPSHOT, STATE))),
    ).toBe('/dashboard');
  });

  it('passwordExpiredGuard lets users with a current password through', () => {
    configure(true, false);

    expect(TestBed.runInInjectionContext(() => passwordExpiredGuard(SNAPSHOT, STATE))).toBe(true);
  });

  it('passwordExpiredGuard sends users with an expired password to /settings', () => {
    configure(true, false, 'teacher', [], true);

    expect(urlOf(TestBed.runInInjectionContext(() => passwordExpiredGuard(SNAPSHOT, STATE)))).toBe(
      '/settings',
    );
  });

  it('passwordExpiredGuard lets expired users stay on /settings', () => {
    configure(true, false, 'teacher', [], true);

    expect(
      TestBed.runInInjectionContext(() =>
        passwordExpiredGuard(SNAPSHOT, { url: '/settings' } as RouterStateSnapshot),
      ),
    ).toBe(true);
  });
});
