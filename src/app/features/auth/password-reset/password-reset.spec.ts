import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PasswordReset } from './password-reset';

const TOKEN = 'a'.repeat(43);

function routeStub(data: Record<string, unknown>, token?: string) {
  return {
    snapshot: {
      data,
      queryParamMap: convertToParamMap(token ? { token } : {}),
    },
  };
}

async function setup(data: Record<string, unknown>, token?: string) {
  TestBed.resetTestingModule();

  await TestBed.configureTestingModule({
    imports: [PasswordReset],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: routeStub(data, token) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PasswordReset);
  fixture.detectChanges();

  return fixture;
}

function requireElement<T extends Element>(
  fixture: ComponentFixture<PasswordReset>,
  selector: string,
): T {
  const found = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  if (found === null) {
    throw new Error(`Element not found: ${selector}`);
  }

  return found;
}

function setInput(fixture: ComponentFixture<PasswordReset>, selector: string, value: string): void {
  const input = requireElement<HTMLInputElement>(fixture, selector);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(fixture: ComponentFixture<PasswordReset>): void {
  requireElement<HTMLFormElement>(fixture, 'form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

function text(fixture: ComponentFixture<PasswordReset>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('PasswordReset (forgot mode)', () => {
  it('shows the email form without password fields', async () => {
    const fixture = await setup({ mode: 'forgot' });

    expect(text(fixture)).toContain('Forgot your password?');
    expect(requireElement(fixture, '#pr-email')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('#pr-password')).toBeNull();
  });

  it('validates the email before calling the API', async () => {
    const fixture = await setup({ mode: 'forgot' });
    const auth = TestBed.inject(AuthService);
    const forgotSpy = vi.spyOn(auth, 'forgotPassword');

    submit(fixture);

    expect(forgotSpy).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('Email is required.');
  });

  it('sends the reset email and shows the confirmation state', async () => {
    const fixture = await setup({ mode: 'forgot' });
    const auth = TestBed.inject(AuthService);
    const forgotSpy = vi
      .spyOn(auth, 'forgotPassword')
      .mockReturnValue(of({ message: 'If that email is registered, a reset link is on its way.' }));

    setInput(fixture, '#pr-email', 'teacher@school.edu');
    submit(fixture);

    expect(forgotSpy).toHaveBeenCalledWith('teacher@school.edu');
    expect(text(fixture)).toContain('Check your inbox');
    expect(text(fixture)).toContain('teacher@school.edu');
  });

  it('shows the API error message when sending fails', async () => {
    const fixture = await setup({ mode: 'forgot' });
    const auth = TestBed.inject(AuthService);
    vi.spyOn(auth, 'forgotPassword').mockReturnValue(
      throwError(() => ({
        status: 429,
        statusText: 'Too Many Requests',
        message: 'Too many requests. Please try again later.',
        errors: [],
      })),
    );

    setInput(fixture, '#pr-email', 'teacher@school.edu');
    submit(fixture);

    expect(text(fixture)).toContain('Too many requests. Please try again later.');
  });
});

describe('PasswordReset (reset mode)', () => {
  it('shows a broken-link state when the token is missing', async () => {
    const fixture = await setup({ mode: 'reset' });

    expect(text(fixture)).toContain('This reset link is broken');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
    expect(
      requireElement<HTMLAnchorElement>(fixture, '.pr__state .btn-submit').getAttribute('href'),
    ).toBe('/forgot-password');
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const fixture = await setup({ mode: 'reset' }, TOKEN);
    const auth = TestBed.inject(AuthService);
    const resetSpy = vi.spyOn(auth, 'resetPassword');

    setInput(fixture, '#pr-password', 'new-password-1');
    setInput(fixture, '#pr-confirm', 'new-password-2');
    submit(fixture);

    expect(resetSpy).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('Passwords do not match.');
  });

  it('rejects passwords shorter than eight characters', async () => {
    const fixture = await setup({ mode: 'reset' }, TOKEN);
    const auth = TestBed.inject(AuthService);
    const resetSpy = vi.spyOn(auth, 'resetPassword');

    setInput(fixture, '#pr-password', 'short');
    setInput(fixture, '#pr-confirm', 'short');
    submit(fixture);

    expect(resetSpy).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('at least 8 characters');
  });

  it('resets the password with the token and shows the success state', async () => {
    const fixture = await setup({ mode: 'reset' }, TOKEN);
    const auth = TestBed.inject(AuthService);
    const resetSpy = vi.spyOn(auth, 'resetPassword').mockReturnValue(of(undefined));

    setInput(fixture, '#pr-password', 'new-password-1');
    setInput(fixture, '#pr-confirm', 'new-password-1');
    submit(fixture);

    expect(resetSpy).toHaveBeenCalledWith({ token: TOKEN, password: 'new-password-1' });
    expect(text(fixture)).toContain('Password updated');
    expect(
      requireElement<HTMLAnchorElement>(fixture, '.pr__state .btn-submit').getAttribute('href'),
    ).toBe('/login');
  });

  it('shows the API error message when the token has expired', async () => {
    const fixture = await setup({ mode: 'reset' }, TOKEN);
    const auth = TestBed.inject(AuthService);
    vi.spyOn(auth, 'resetPassword').mockReturnValue(
      throwError(() => ({
        status: 400,
        statusText: 'Bad Request',
        message: 'This reset link is invalid or has expired. Please request a new one.',
        errors: [],
      })),
    );

    setInput(fixture, '#pr-password', 'new-password-1');
    setInput(fixture, '#pr-confirm', 'new-password-1');
    submit(fixture);

    expect(text(fixture)).toContain('This reset link is invalid or has expired.');
  });
});
