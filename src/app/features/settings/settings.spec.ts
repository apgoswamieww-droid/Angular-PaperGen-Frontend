import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { SessionUser } from '../../core/auth/auth.types';
import { AuthService } from '../../core/auth/auth.service';
import { Settings } from './settings';

const EXPIRED_USER: SessionUser = {
  id: 'user-1',
  name: 'Teacher One',
  email: 'teacher@school.edu',
  role: 'teacher',
  tenantId: 'tenant-1',
  tenantName: 'Demo Public School',
  permissions: ['settings.view', 'papers.view'],
  passwordExpired: true,
};

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: EXPIRED_USER,
    });

    fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();

    router = TestBed.inject(Router);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function setInput(selector: string, value: string): void {
    const input = element().querySelector<HTMLInputElement>(selector);

    if (input === null) {
      throw new Error(`Input not found: ${selector}`);
    }

    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function fillPasswords(current: string, next: string, confirm = next): void {
    setInput('[data-testid="current-password"]', current);
    setInput('[data-testid="new-password"]', next);
    setInput('[data-testid="confirm-password"]', confirm);
  }

  function submit(): void {
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows the expiry warning, account details and school profile', () => {
    expect(element().querySelector('[data-testid="password-expired"]')).toBeTruthy();
    expect(element().querySelector('[data-testid="school-name"]')?.textContent).toContain(
      'Demo Public School',
    );
    expect(element().querySelector('[data-testid="account-name"]')?.textContent).toContain(
      'Teacher One',
    );
    expect(element().querySelector('[data-testid="account-email"]')?.textContent).toContain(
      'teacher@school.edu',
    );
    expect(element().querySelector('[data-testid="account-role"]')?.textContent).toContain(
      'Teacher',
    );
  });

  it('hides the school profile and warning for users without settings.view', () => {
    const auth = TestBed.inject(AuthService);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-2',
      user: { ...EXPIRED_USER, passwordExpired: false, permissions: ['papers.view'] },
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="school-name"]')).toBeNull();
    expect(element().querySelector('[data-testid="password-expired"]')).toBeNull();
  });

  it('rejects reusing the current password before calling the API', () => {
    fillPasswords('SamePassword1', 'SamePassword1');
    submit();

    expect(element().querySelector('[data-testid="password-error"]')?.textContent).toContain(
      'different',
    );
    httpMock.expectNone('/api/auth/change-password');
  });

  it('rejects a mismatched confirmation before calling the API', () => {
    fillPasswords('OldPassword1', 'NewPassword2', 'OtherPassword3');
    submit();

    expect(element().querySelector('[data-testid="password-error"]')?.textContent).toContain(
      'do not match',
    );
    httpMock.expectNone('/api/auth/change-password');
  });

  it('changes the password and returns to the dashboard', () => {
    const auth = TestBed.inject(AuthService);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillPasswords('OldPassword1', 'NewPassword2');
    submit();

    const request = httpMock.expectOne('/api/auth/change-password');

    expect(request.request.body).toEqual({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword2',
    });

    request.flush({
      accessToken: 'token-3',
      user: { ...EXPIRED_USER, passwordExpired: false },
    });
    fixture.detectChanges();

    expect(auth.passwordExpired()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the error returned by the API', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillPasswords('WrongPassword1', 'NewPassword2');
    submit();

    httpMock
      .expectOne('/api/auth/change-password')
      .flush(
        { message: 'Your current password is incorrect.' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="password-error"]')?.textContent).toContain(
      'incorrect',
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
