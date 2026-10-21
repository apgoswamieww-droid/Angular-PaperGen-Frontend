import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { SessionUser } from '../core/auth/auth.types';
import { AuthService } from '../core/auth/auth.service';
import { Shell } from './shell';

const USER: SessionUser = {
  id: 'user-1',
  name: 'Teacher One',
  email: 'teacher@school.edu',
  role: 'teacher',
};

@Component({ selector: 'app-test-report-page', template: '' })
class TestReportPage {}

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([
          { path: 'reports', component: TestReportPage },
          { path: 'reports/class-students', component: TestReportPage },
          { path: 'masters', component: TestReportPage },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const auth = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-default',
      user: USER,
    });

    fixture = TestBed.createComponent(Shell);
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

  it('renders the header, sidebar navigation and footer', () => {
    expect(element().querySelector('.topbar')).toBeTruthy();
    expect(element().querySelector('.footer')).toBeTruthy();
    expect(element().querySelectorAll('.nav-item').length).toBe(7);
    expect(element().textContent).toContain('Paper Generator');
    expect(element().textContent).toContain('Question Bank');
    expect(element().textContent).toContain('Reports');
    expect(element().textContent).toContain('Masters');
  });

  it('opens the profile menu with account details', () => {
    expect(element().querySelector('.user-menu')).toBeNull();

    element().querySelector<HTMLButtonElement>('.user-chip')?.click();
    fixture.detectChanges();

    const menu = element().querySelector('.user-menu');

    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Sign out');
    expect(menu?.textContent).toContain('Profile & settings');
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

  it('collapses and expands the sidebar', () => {
    expect(shell().classList.contains('shell--collapsed')).toBe(false);

    element().querySelector<HTMLButtonElement>('.topbar__collapse-btn')?.click();
    fixture.detectChanges();

    expect(shell().classList.contains('shell--collapsed')).toBe(true);
    expect(localStorage.getItem('pg.sidebar')).toBe('collapsed');

    element().querySelector<HTMLButtonElement>('.topbar__collapse-btn')?.click();
    fixture.detectChanges();

    expect(shell().classList.contains('shell--collapsed')).toBe(false);
    expect(localStorage.getItem('pg.sidebar')).toBe('expanded');
  });

  it('opens the reports submenu with a single click without navigating', async () => {
    const group = element().querySelector('.nav-group');
    const head = element().querySelector<HTMLButtonElement>('[data-testid="nav-group-head"]');

    expect(group).toBeTruthy();
    expect(group?.querySelector('.nav-group__children')).toBeNull();
    expect(head?.getAttribute('aria-expanded')).toBe('false');

    head?.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(group?.querySelector('.nav-group__children')?.textContent).toContain('Class & Student');
    expect(head?.getAttribute('aria-expanded')).toBe('true');
    expect(localStorage.getItem('pg.sidebar.groups')).toContain('/reports');
    expect(router.url).not.toBe('/reports');

    head?.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(group?.querySelector('.nav-group__children')).toBeNull();
    expect(head?.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem('pg.sidebar.groups')).not.toContain('/reports');
  });

  it('auto-expands the reports submenu when a report is open', async () => {
    await router.navigateByUrl('/reports/class-students');
    fixture.detectChanges();

    expect(element().querySelector('.nav-group__children')?.textContent).toContain(
      'Class & Student',
    );
  });

  it('keeps the submenu open when toggling the group from a child report', async () => {
    await router.navigateByUrl('/reports/class-students');
    fixture.detectChanges();

    const head = element().querySelector<HTMLButtonElement>('[data-testid="nav-group-head"]');

    expect(head?.classList.contains('is-active')).toBe(true);

    head?.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(element().querySelector('.nav-group__children')).toBeNull();
    expect(router.url).toBe('/reports/class-students');
  });

  it('shows every master page in the masters submenu on click', async () => {
    const heads = Array.from(
      element().querySelectorAll<HTMLButtonElement>('[data-testid="nav-group-head"]'),
    );
    const mastersHead = heads.find((head) => head.textContent?.includes('Masters'));

    mastersHead?.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    const groups = Array.from(element().querySelectorAll('.nav-group'));
    const mastersGroup = groups.find((group) => group.textContent?.includes('Masters'));
    const labels = Array.from(mastersGroup?.querySelectorAll('.nav-item--child') ?? []).map(
      (item) => item.textContent?.trim(),
    );

    expect(labels).toEqual([
      'Mediums',
      'Standards',
      'Subjects',
      'Chapters',
      'Topics',
      'Question Types',
      'Difficulty Levels',
      'Bloom Levels',
      'Exam Types',
    ]);
    expect(router.url).not.toBe('/masters');
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

  it('shows the signed-in user in the profile chip and menu', () => {
    const auth = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    auth.login({ email: USER.email, password: 'secret-pass-1', remember: false }).subscribe();
    httpMock.expectOne('/api/auth/login').flush({ accessToken: 'token-1', user: USER });
    fixture.detectChanges();

    expect(element().querySelector('.user-chip__name')?.textContent).toContain('Teacher One');
    expect(element().querySelector('.user-chip__role')?.textContent).toContain('Teacher');
    expect(element().querySelector('.user-chip__avatar')?.textContent).toContain('TO');

    element().querySelector<HTMLButtonElement>('.user-chip')?.click();
    fixture.detectChanges();

    expect(element().querySelector('.user-menu__email')?.textContent).toContain(
      'teacher@school.edu',
    );
  });

  it('shows the Users and Roles links only for permitted roles', () => {
    const auth = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    expect(element().querySelector('.nav-item[href="/users"]')).toBeNull();
    expect(element().querySelector('.nav-item[href="/roles"]')).toBeNull();
    expect(element().querySelectorAll('.nav-item').length).toBe(7);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-2',
      user: {
        id: 'admin-1',
        name: 'Asha Deshmukh',
        email: 'principal@school.edu',
        role: 'school_admin',
      },
    });
    fixture.detectChanges();

    const usersHead = Array.from(
      element().querySelectorAll<HTMLButtonElement>('[data-testid="nav-group-head"]'),
    ).find((head) => head.textContent?.includes('Users'));
    const rolesLink = element().querySelector<HTMLAnchorElement>('.nav-item[href="/roles"]');

    expect(usersHead?.textContent).toContain('Users');
    expect(rolesLink?.textContent).toContain('Roles');
    expect(element().querySelectorAll('.nav-item').length).toBe(9);
  });

  it('opens the Users submenu with the role pages', () => {
    const auth = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-4',
      user: {
        id: 'admin-2',
        name: 'Asha Deshmukh',
        email: 'principal@school.edu',
        role: 'school_admin',
      },
    });
    fixture.detectChanges();

    const usersHead = Array.from(
      element().querySelectorAll<HTMLButtonElement>('[data-testid="nav-group-head"]'),
    ).find((head) => head.textContent?.includes('Users'));

    usersHead?.click();
    fixture.detectChanges();

    const groups = Array.from(element().querySelectorAll('.nav-group'));
    const usersGroup = groups.find((group) => group.textContent?.includes('Users'));
    const links = Array.from(
      usersGroup?.querySelectorAll<HTMLAnchorElement>('.nav-item--child') ?? [],
    );

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'All Users',
      'Teachers',
      'Students',
      'Staff',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/users',
      '/users/teachers',
      '/users/students',
      '/users/staff',
    ]);
  });

  it('filters navigation using permissions returned by the server', () => {
    const auth = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-3',
      user: {
        id: 'user-2',
        name: 'Paper Reviewer',
        email: 'reviewer@school.edu',
        role: 'reviewer',
        permissions: ['papers.view'],
      },
    });
    fixture.detectChanges();

    const labels = Array.from(element().querySelectorAll('.nav-item')).map((item) =>
      item.textContent?.trim(),
    );

    expect(labels).toEqual(['Dashboard', 'My Papers']);
    expect(element().querySelector('.nav-item[href="/users"]')).toBeNull();
    expect(element().querySelector('.nav-item[href="/roles"]')).toBeNull();
  });

  it('signs out from the profile menu', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    element().querySelector<HTMLButtonElement>('.user-chip')?.click();
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('.user-menu__item--danger')?.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith('/login');
    expect(element().querySelector('.user-menu')).toBeNull();
  });
});
