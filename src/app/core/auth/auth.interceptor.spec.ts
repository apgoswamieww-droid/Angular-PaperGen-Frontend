import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { apiBaseUrlInterceptor } from '../api/api-base-url.interceptor';
import { apiErrorInterceptor } from '../api/api-error.interceptor';
import { AdminAuthService } from './admin-auth.service';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import type { SessionUser } from './auth.types';

const USER: SessionUser = {
  id: 'user-1',
  name: 'Teacher One',
  email: 'teacher@school.edu',
  role: 'teacher',
};

const ADMIN_USER: SessionUser = {
  id: 'admin-1',
  name: 'Platform Owner',
  email: 'root@papergen.app',
  role: 'super_admin',
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let auth: AuthService;
  let adminAuth: AdminAuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([apiBaseUrlInterceptor, authInterceptor, apiErrorInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    adminAuth = TestBed.inject(AdminAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  function signIn(): void {
    auth.login({ email: USER.email, password: 'secret-pass-1', remember: false }).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ accessToken: 'token-1', user: USER });
  }

  it('attaches the bearer token to API calls after sign-in', () => {
    signIn();

    http.get('/api/auth/me').subscribe();
    const request = httpMock.expectOne('/api/auth/me');

    expect(request.request.headers.get('Authorization')).toBe('Bearer token-1');
    expect(request.request.withCredentials).toBe(true);
    request.flush(USER);
  });

  it('sends requests without an Authorization header when signed out', () => {
    http.get('/api/health').subscribe();
    const request = httpMock.expectOne('/api/health');

    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ status: 'ok' });
  });

  it('refreshes once on a 401 and retries with the new token', () => {
    signIn();
    const userSpy = vi.fn();
    const errorSpy = vi.fn();

    http.get('/api/auth/me').subscribe({ next: userSpy, error: errorSpy });
    httpMock
      .expectOne('/api/auth/me')
      .flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne('/api/auth/refresh').flush({ accessToken: 'token-2', user: USER });

    const retried = httpMock.expectOne('/api/auth/me');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer token-2');
    retried.flush(USER);

    expect(userSpy).toHaveBeenCalledWith(USER);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('shares one refresh between concurrent 401 responses', () => {
    signIn();

    http.get('/api/subjects').subscribe();
    http.get('/api/questions').subscribe();

    httpMock
      .expectOne('/api/subjects')
      .flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne('/api/questions')
      .flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne('/api/auth/refresh').flush({ accessToken: 'token-2', user: USER });

    httpMock.expectOne('/api/subjects').flush([]);
    httpMock.expectOne('/api/questions').flush([]);
  });

  it('clears the session and redirects to /login when the refresh fails', () => {
    signIn();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const errorSpy = vi.fn();

    http.get('/api/auth/me').subscribe({ error: errorSpy });
    httpMock
      .expectOne('/api/auth/me')
      .flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne('/api/auth/refresh')
      .flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorSpy).toHaveBeenCalled();
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('does not attempt a refresh for a failed login', () => {
    http
      .post('/api/auth/login', { email: 'x@y.co', password: 'password1', remember: false })
      .subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/auth/login')
      .flush(
        { message: 'Invalid email or password.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    httpMock.expectNone('/api/auth/refresh');
  });

  it('routes admin 401s through the admin session and redirects to /admin/login', () => {
    adminAuth
      .login({ email: ADMIN_USER.email, password: 'platform-secret-1', remember: false })
      .subscribe();
    httpMock
      .expectOne('/api/admin/auth/login')
      .flush({ accessToken: 'admin-token-1', user: ADMIN_USER });
    signIn();

    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    http.get('/api/admin/auth/me').subscribe({ error: () => undefined });
    const adminRequest = httpMock.expectOne('/api/admin/auth/me');

    expect(adminRequest.request.headers.get('Authorization')).toBe('Bearer admin-token-1');
    adminRequest.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    httpMock
      .expectOne('/api/admin/auth/refresh')
      .flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.isAuthenticated()).toBe(false);
    expect(auth.isAuthenticated()).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith('/admin/login');
  });
});
