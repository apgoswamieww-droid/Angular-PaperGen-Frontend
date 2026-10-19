import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import type { SessionUser } from './auth.types';

const USER: SessionUser = {
  id: 'user-1',
  name: 'Teacher One',
  email: 'teacher@school.edu',
  role: 'teacher',
};

const CREDENTIALS = { email: 'teacher@school.edu', password: 'secret-pass-1', remember: true };

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts signed out', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.token).toBeNull();
  });

  it('posts credentials, stores the session and sends cookies', async () => {
    const result = firstValueFrom(service.login(CREDENTIALS));

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual(CREDENTIALS);
    request.flush({ accessToken: 'token-1', user: USER });

    await expect(result).resolves.toEqual(USER);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(USER);
    expect(service.token).toBe('token-1');
  });

  it('keeps the session empty when login fails', async () => {
    const outcome = firstValueFrom(service.login(CREDENTIALS)).then(
      () => 'fulfilled',
      () => 'rejected',
    );

    httpMock
      .expectOne('/api/auth/login')
      .flush(
        { message: 'Invalid email or password.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect(outcome).resolves.toBe('rejected');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('shares one refresh request between concurrent callers', async () => {
    const first = firstValueFrom(service.refresh());
    const second = firstValueFrom(service.refresh());

    const request = httpMock.expectOne('/api/auth/refresh');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ accessToken: 'token-2', user: USER });

    await expect(first).resolves.toEqual(USER);
    await expect(second).resolves.toEqual(USER);
    expect(service.token).toBe('token-2');
  });

  it('restores a session from the refresh cookie', async () => {
    const restored = firstValueFrom(service.restore());

    httpMock.expectOne('/api/auth/refresh').flush({ accessToken: 'token-3', user: USER });

    await expect(restored).resolves.toBeUndefined();
    expect(service.isAuthenticated()).toBe(true);
  });

  it('resolves quietly when the session cannot be restored', async () => {
    const restored = firstValueFrom(service.restore());

    httpMock
      .expectOne('/api/auth/refresh')
      .flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    await expect(restored).resolves.toBeUndefined();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the local session on logout even when the API call fails', async () => {
    service.login(CREDENTIALS).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ accessToken: 'token-1', user: USER });

    const done = firstValueFrom(service.logout());
    httpMock.expectOne('/api/auth/logout').flush(null, { status: 500, statusText: 'Server Error' });

    await expect(done).resolves.toBeUndefined();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
  });

  it('posts forgot-password with the email', async () => {
    const result = firstValueFrom(service.forgotPassword('teacher@school.edu'));

    const request = httpMock.expectOne('/api/auth/forgot-password');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'teacher@school.edu' });
    request.flush({ message: 'If that email is registered, a reset link is on its way.' });

    await expect(result).resolves.toEqual({
      message: 'If that email is registered, a reset link is on its way.',
    });
  });

  it('posts reset-password with the token and new password', async () => {
    const payload = { token: 't'.repeat(43), password: 'new-password-1' };
    const result = firstValueFrom(service.resetPassword(payload));

    const request = httpMock.expectOne('/api/auth/reset-password');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(null);

    await expect(result).resolves.toBeNull();
  });
});
