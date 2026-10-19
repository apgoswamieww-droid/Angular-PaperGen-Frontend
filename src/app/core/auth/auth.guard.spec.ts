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
  schoolAdminGuard,
} from './auth.guard';
import { AuthService } from './auth.service';

const SNAPSHOT = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

describe('auth guards', () => {
  function configure(signedIn: boolean, adminSignedIn: boolean, role = 'teacher'): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => signedIn,
            user: () => (signedIn ? { id: 'u1', role } : null),
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

  it('schoolAdminGuard lets school admins manage users', () => {
    configure(true, false, 'school_admin');

    expect(TestBed.runInInjectionContext(() => schoolAdminGuard(SNAPSHOT, STATE))).toBe(true);
  });

  it('schoolAdminGuard sends everyone else to /dashboard', () => {
    configure(true, false, 'teacher');

    expect(urlOf(TestBed.runInInjectionContext(() => schoolAdminGuard(SNAPSHOT, STATE)))).toBe(
      '/dashboard',
    );
  });
});
