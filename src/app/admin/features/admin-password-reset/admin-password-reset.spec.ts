import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { AdminPasswordReset } from './admin-password-reset';

const TOKEN = 'b'.repeat(43);

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
    imports: [AdminPasswordReset],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: routeStub(data, token) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminPasswordReset);
  fixture.detectChanges();

  return fixture;
}

function requireElement<T extends Element>(
  fixture: ComponentFixture<AdminPasswordReset>,
  selector: string,
): T {
  const found = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  if (found === null) {
    throw new Error(`Element not found: ${selector}`);
  }

  return found;
}

function text(fixture: ComponentFixture<AdminPasswordReset>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('AdminPasswordReset', () => {
  it('sends the reset email through the admin scope', async () => {
    const fixture = await setup({ mode: 'forgot' });
    const auth = TestBed.inject(AdminAuthService);
    const forgotSpy = vi.spyOn(auth, 'forgotPassword').mockReturnValue(of({ message: 'ok' }));

    const input = requireElement<HTMLInputElement>(fixture, '#apr-email');
    input.value = 'root@papergen.app';
    input.dispatchEvent(new Event('input'));
    requireElement<HTMLFormElement>(fixture, 'form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(forgotSpy).toHaveBeenCalledWith('root@papergen.app');
    expect(text(fixture)).toContain('Check your inbox');
  });

  it('shows the admin broken-link state without a token', async () => {
    const fixture = await setup({ mode: 'reset' });

    expect(text(fixture)).toContain('This reset link is broken');
    expect(
      requireElement<HTMLAnchorElement>(fixture, '.apr__state .btn-submit').getAttribute('href'),
    ).toBe('/admin/forgot-password');
  });

  it('resets the admin password and links back to the admin sign in', async () => {
    const fixture = await setup({ mode: 'reset' }, TOKEN);
    const auth = TestBed.inject(AdminAuthService);
    const resetSpy = vi.spyOn(auth, 'resetPassword').mockReturnValue(of(undefined));

    const password = requireElement<HTMLInputElement>(fixture, '#apr-password');
    password.value = 'new-admin-pass-1';
    password.dispatchEvent(new Event('input'));
    const confirm = requireElement<HTMLInputElement>(fixture, '#apr-confirm');
    confirm.value = 'new-admin-pass-1';
    confirm.dispatchEvent(new Event('input'));
    requireElement<HTMLFormElement>(fixture, 'form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(resetSpy).toHaveBeenCalledWith({ token: TOKEN, password: 'new-admin-pass-1' });
    expect(text(fixture)).toContain('Password updated');
    expect(
      requireElement<HTMLAnchorElement>(fixture, '.apr__state .btn-submit').getAttribute('href'),
    ).toBe('/admin/login');
  });
});
