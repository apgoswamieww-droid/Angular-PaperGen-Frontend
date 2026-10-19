import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import type { SessionUser } from '../../core/auth/auth.types';
import { AdminShell } from './admin-shell';

const ADMIN_USER: SessionUser = {
  id: 'admin-1',
  name: 'Platform Owner',
  email: 'root@papergen.app',
  role: 'super_admin',
};

describe('AdminShell', () => {
  let fixture: ComponentFixture<AdminShell>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();

    router = TestBed.inject(Router);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function shell(): HTMLElement {
    const found = element().querySelector<HTMLElement>('.shell');

    if (found === null) {
      throw new Error('Shell element not found');
    }

    return found;
  }

  it('renders the platform header, sidebar navigation and footer', () => {
    expect(element().querySelector('.topbar')).toBeTruthy();
    expect(element().querySelector('.footer')).toBeTruthy();
    expect(element().querySelectorAll('.nav-item').length).toBe(7);
    expect(element().textContent).toContain('Platform console');
    expect(element().textContent).toContain('Schools & Institutes');
  });

  it('opens the profile menu with the super admin role', () => {
    expect(element().querySelector('.user-menu')).toBeNull();

    element().querySelector<HTMLButtonElement>('.user-chip')?.click();
    fixture.detectChanges();

    const menu = element().querySelector('.user-menu');

    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Platform settings');
    expect(menu?.textContent).toContain('Switch to school app');
    expect(menu?.textContent).toContain('Sign out');
    expect(element().textContent).toContain('Super admin');
  });

  it('closes the profile menu when clicking outside or pressing Escape', () => {
    const chip = element().querySelector<HTMLButtonElement>('.user-chip');

    chip?.click();
    fixture.detectChanges();
    element().querySelector<HTMLElement>('.content')?.click();
    fixture.detectChanges();
    expect(element().querySelector('.user-menu')).toBeNull();

    chip?.click();
    fixture.detectChanges();
    expect(element().querySelector('.user-menu')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(element().querySelector('.user-menu')).toBeNull();
  });

  it('collapses the sidebar using the admin storage key', () => {
    expect(shell().classList.contains('shell--collapsed')).toBe(false);

    element().querySelector<HTMLButtonElement>('.topbar__collapse-btn')?.click();
    fixture.detectChanges();

    expect(shell().classList.contains('shell--collapsed')).toBe(true);
    expect(localStorage.getItem('pg.admin.sidebar')).toBe('collapsed');
    expect(localStorage.getItem('pg.sidebar')).toBeNull();
  });

  it('opens and closes the mobile navigation', () => {
    expect(shell().classList.contains('shell--nav-open')).toBe(false);

    element().querySelector<HTMLButtonElement>('.topbar__menu-btn')?.click();
    fixture.detectChanges();

    expect(shell().classList.contains('shell--nav-open')).toBe(true);

    element().querySelector<HTMLButtonElement>('.scrim')?.click();
    fixture.detectChanges();

    expect(shell().classList.contains('shell--nav-open')).toBe(false);
  });

  it('shows the signed-in super admin in the profile chip', () => {
    const auth = TestBed.inject(AdminAuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    auth
      .login({ email: ADMIN_USER.email, password: 'platform-secret-1', remember: false })
      .subscribe();
    httpMock
      .expectOne('/api/admin/auth/login')
      .flush({ accessToken: 'admin-token-1', user: ADMIN_USER });
    fixture.detectChanges();

    expect(element().querySelector('.user-chip__name')?.textContent).toContain('Platform Owner');
    expect(element().querySelector('.user-chip__role')?.textContent).toContain('Super admin');
    expect(element().querySelector('.user-chip__avatar')?.textContent).toContain('PO');
  });

  it('signs out to the platform login', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    element().querySelector<HTMLButtonElement>('.user-chip')?.click();
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('.user-menu__item--danger')?.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith('/admin/login');
    expect(element().querySelector('.user-menu')).toBeNull();
  });
});
