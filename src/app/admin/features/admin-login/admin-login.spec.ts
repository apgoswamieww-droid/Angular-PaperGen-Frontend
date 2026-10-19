import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import type { SessionUser } from '../../../core/auth/auth.types';
import { AdminLogin } from './admin-login';

const ADMIN_USER: SessionUser = {
  id: 'admin-1',
  name: 'Platform Owner',
  email: 'root@papergen.app',
  role: 'super_admin',
};

describe('AdminLogin', () => {
  let fixture: ComponentFixture<AdminLogin>;
  let auth: AdminAuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLogin);
    fixture.detectChanges();

    auth = TestBed.inject(AdminAuthService);
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
    setInput('#admin-email', 'root@papergen.app');
    setInput('#admin-password', 'platform-secret-1');
  }

  function submit(): void {
    requireElement<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('creates the super admin login page', () => {
    expect(element().textContent).toContain('Super admin console');
    expect(element().textContent).toContain('Restricted area');
    expect(requireElement<HTMLAnchorElement>('.admin-auth__link').getAttribute('href')).toBe(
      '/login',
    );
  });

  it('links to the admin forgot password page', () => {
    expect(requireElement<HTMLAnchorElement>('.admin-auth__forgot').getAttribute('href')).toBe(
      '/admin/forgot-password',
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

    setInput('#admin-email', 'root@papergen.app');
    setInput('#admin-password', 'short');
    submit();

    expect(loginSpy).not.toHaveBeenCalled();
    expect(element().textContent).toContain('at least 8 characters');
  });

  it('toggles password visibility', () => {
    expect(requireElement<HTMLInputElement>('#admin-password').type).toBe('password');

    requireElement<HTMLButtonElement>('.field__toggle').click();
    fixture.detectChanges();

    expect(requireElement<HTMLInputElement>('#admin-password').type).toBe('text');
  });

  it('signs in and navigates to the platform overview when the form is valid', () => {
    const loginSpy = vi.spyOn(auth, 'login').mockReturnValue(of(ADMIN_USER));
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillValidCredentials();
    submit();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'root@papergen.app',
      password: 'platform-secret-1',
      remember: false,
    });
    expect(navigateSpy).toHaveBeenCalledWith('/admin/dashboard');
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

    pending.next(ADMIN_USER);
    pending.complete();
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
  });
});
