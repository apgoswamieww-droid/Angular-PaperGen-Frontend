import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import type { SessionUser } from '../../../core/auth/auth.types';
import { AuthService } from '../../../core/auth/auth.service';
import { Login } from './login';

const USER: SessionUser = {
  id: 'user-1',
  name: 'Teacher One',
  email: 'teacher@school.edu',
  role: 'teacher',
};

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let auth: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function requireElement<T extends Element>(selector: string): T {
    const found = element().querySelector<T>(selector);

    if (found === null) {
      throw new Error(`Element not found: ${selector}`);
    }

    return found;
  }

  function setInput(selector: string, value: string): void {
    const input = requireElement<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function fillValidCredentials(): void {
    setInput('#login-email', 'teacher@school.edu');
    setInput('#login-password', 'secret-pass-1');
  }

  function submit(): void {
    requireElement<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('creates the login page', () => {
    expect(element().textContent).toContain('Welcome back');
    expect(element().textContent).toContain('Paper Generator');
  });

  it('links to the forgot password page', () => {
    expect(requireElement<HTMLAnchorElement>('.auth-form__link').getAttribute('href')).toBe(
      '/forgot-password',
    );
  });

  it('shows validation messages and does not sign in when the form is empty', () => {
    const loginSpy = vi.spyOn(auth, 'login');

    submit();

    expect(loginSpy).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Email is required.');
    expect(element().textContent).toContain('Password is required.');
  });

  it('rejects passwords shorter than eight characters', () => {
    const loginSpy = vi.spyOn(auth, 'login');

    setInput('#login-email', 'teacher@school.edu');
    setInput('#login-password', 'short');
    submit();

    expect(loginSpy).not.toHaveBeenCalled();
    expect(element().textContent).toContain('at least 8 characters');
  });

  it('toggles password visibility', () => {
    expect(requireElement<HTMLInputElement>('#login-password').type).toBe('password');

    requireElement<HTMLButtonElement>('.field__toggle').click();
    fixture.detectChanges();

    expect(requireElement<HTMLInputElement>('#login-password').type).toBe('text');
  });

  it('signs in and navigates to the dashboard when the form is valid', () => {
    const loginSpy = vi.spyOn(auth, 'login').mockReturnValue(of(USER));
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillValidCredentials();
    submit();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'teacher@school.edu',
      password: 'secret-pass-1',
      remember: false,
    });
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('sends users with an expired password to settings after sign-in', () => {
    vi.spyOn(auth, 'login').mockReturnValue(of({ ...USER, passwordExpired: true }));
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillValidCredentials();
    submit();

    expect(navigateSpy).toHaveBeenCalledWith('/settings');
  });

  it('shows the error message returned by the API', () => {
    vi.spyOn(auth, 'login').mockReturnValue(
      throwError(() => ({
        status: 401,
        statusText: 'Unauthorized',
        message: 'Invalid email or password.',
        errors: [],
      })),
    );
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillValidCredentials();
    submit();

    expect(element().textContent).toContain('Invalid email or password.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('shows a loading state while signing in', () => {
    const pending = new Subject<SessionUser>();
    vi.spyOn(auth, 'login').mockReturnValue(pending.asObservable());
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillValidCredentials();
    submit();

    const button = requireElement<HTMLButtonElement>('.btn-submit');
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Signing in');

    pending.next(USER);
    pending.complete();
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
  });
});
