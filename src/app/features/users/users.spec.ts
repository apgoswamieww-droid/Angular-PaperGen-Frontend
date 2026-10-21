import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { SchoolUserRecord, SchoolUsersPage } from '../../core/api/school-users.types';
import { AuthService } from '../../core/auth/auth.service';
import { Users } from './users';

const USERS: SchoolUserRecord[] = [
  {
    id: 'u1',
    name: 'Chetan Joshi',
    email: 'teacher@greenwood.test',
    phone: '+91 90000 00001',
    role: 'teacher',
    studentProfile: null,
    status: 'active',
    lastLoginAt: '2026-10-18T10:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'u2',
    name: 'Deepa Rao',
    email: 'staff@greenwood.test',
    phone: '',
    role: 'staff',
    studentProfile: null,
    status: 'suspended',
    lastLoginAt: null,
    createdAt: '2026-10-02T10:00:00.000Z',
  },
  {
    id: 'u3',
    name: 'Esha Kulkarni',
    email: 'student@greenwood.test',
    phone: '',
    role: 'student',
    studentProfile: null,
    status: 'active',
    lastLoginAt: null,
    createdAt: '2026-10-03T10:00:00.000Z',
  },
];

const ROLE_OPTIONS = [
  { key: 'school_admin', name: 'School admin', isSystem: true },
  { key: 'teacher', name: 'Teacher', isSystem: true },
  { key: 'staff', name: 'Staff', isSystem: true },
  { key: 'student', name: 'Student', isSystem: true },
  { key: 'exam_coordinator', name: 'Exam coordinator', isSystem: false },
];

const PAGE: SchoolUsersPage = {
  items: USERS,
  total: 3,
  page: 1,
  pageSize: 10,
  summary: {
    totalUsers: 3,
    activeUsers: 2,
    suspendedUsers: 1,
    schoolAdmins: 0,
    teachers: 1,
    staff: 1,
    students: 1,
  },
};

describe('Users', () => {
  let fixture: ComponentFixture<Users>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Users);
    fixture.detectChanges();
    httpMock.expectOne('/api/roles/options').flush(ROLE_OPTIONS);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function flushList(page: SchoolUsersPage = PAGE): void {
    httpMock
      .expectOne((request) => request.url === '/api/users' && request.method === 'GET')
      .flush(page);
    fixture.detectChanges();
  }

  function signIn(id: string): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id, name: 'Asha Deshmukh', email: 'principal@greenwood.test', role: 'school_admin' },
    });
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading users');

    flushList();

    expect(rows().length).toBe(3);
    expect(element().textContent).toContain('Chetan Joshi');
    expect(element().textContent).toContain('Student');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['3', '2', '1', '0', '1', '1', '1']);
  });

  it('filters by role through the API', () => {
    flushList();

    const select = element().querySelector<HTMLSelectElement>('[data-testid="role-filter"]');

    if (select === null) {
      throw new Error('Role filter not found');
    }

    select.value = 'student';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(request.request.params.get('role')).toBe('student');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({
      ...PAGE,
      items: [USERS[2]],
      total: 1,
    });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Esha Kulkarni');
  });

  it('uses tenant roles in the filter and labels custom roles', () => {
    flushList({
      ...PAGE,
      items: [{ ...USERS[0], role: 'exam_coordinator' }],
      total: 1,
    });

    const select = element().querySelector<HTMLSelectElement>('[data-testid="role-filter"]');
    const option = select?.querySelector<HTMLOptionElement>('option[value="exam_coordinator"]');

    expect(option?.textContent).toContain('Exam coordinator');
    expect(rows()[0].textContent).toContain('Exam coordinator');
  });

  it('filters by status and searches after the debounce', async () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-status="suspended"]')?.click();
    fixture.detectChanges();

    const statusRequest = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(statusRequest.request.params.get('status')).toBe('suspended');
    statusRequest.flush({ ...PAGE, items: [USERS[1]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);

    const input = element().querySelector<HTMLInputElement>('[data-testid="user-search"]');

    if (input === null) {
      throw new Error('Search input not found');
    }

    input.value = 'chet';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(searchRequest.request.params.get('search')).toBe('chet');
    searchRequest.flush({ ...PAGE, items: [USERS[0]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Chetan Joshi');
  });

  it('sorts by name and toggles the direction', () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-sort="name"]')?.click();
    fixture.detectChanges();

    const first = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(first.request.params.get('sort')).toBe('name');
    expect(first.request.params.get('dir')).toBe('asc');
    first.flush(PAGE);
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-sort="name"]')?.click();
    fixture.detectChanges();

    const second = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(second.request.params.get('dir')).toBe('desc');
    second.flush(PAGE);
    fixture.detectChanges();
  });

  it('paginates through the directory', () => {
    flushList();

    const size = element().querySelector<HTMLSelectElement>('[data-testid="page-size"]');

    if (size === null) {
      throw new Error('Page size select not found');
    }

    size.value = '25';
    size.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const sized = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(sized.request.params.get('pageSize')).toBe('25');
    sized.flush({ ...PAGE, pageSize: 25, total: 60 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-action="next-page"]')?.click();
    fixture.detectChanges();

    const next = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(next.request.params.get('page')).toBe('2');
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [USERS[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('suspends a user and refreshes the directory', () => {
    signIn('admin-1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="suspend"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/users/u1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'suspended' });
    request.flush({ ...USERS[0], status: 'suspended' });
    fixture.detectChanges();

    flushList({
      ...PAGE,
      items: [{ ...USERS[0], status: 'suspended' }, USERS[1], USERS[2]],
    });

    expect(rows()[0].textContent).toContain('suspended');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('resets a password and reveals the generated value once', () => {
    signIn('admin-1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="reset-password"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/users/u1/reset-password');
    expect(request.request.method).toBe('POST');
    request.flush({
      email: 'teacher@greenwood.test',
      password: 'Abcd@1234wxyz',
      sent: true,
    });
    fixture.detectChanges();

    const notice = element().querySelector('[data-testid="reset-notice"]');

    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain('teacher@greenwood.test');
    expect(notice?.querySelector('[data-testid="reset-password-value"]')?.textContent?.trim()).toBe(
      'Abcd@1234wxyz',
    );

    notice?.querySelector<HTMLButtonElement>('.notice-copy')?.click();
    fixture.detectChanges();

    expect(notice?.textContent).toContain('Copied');
  });

  it('deletes a user after an inline confirmation', () => {
    signIn('admin-1');
    flushList();

    rows()[1].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Deepa Rao?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/users/u2');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    flushList({ ...PAGE, items: [USERS[0], USERS[2]], total: 2 });

    expect(rows().length).toBe(2);
    expect(element().textContent).not.toContain('Deepa Rao');
  });

  it('protects the signed-in admin from self actions', () => {
    signIn('u1');

    flushList();

    const ownRow = rows()[0];

    expect(ownRow.textContent).toContain('You');
    expect(ownRow.querySelector('[data-action="delete"]')).toBeNull();
    expect(ownRow.querySelector('[data-action="suspend"]')).toBeNull();
  });

  it('shows an error state and retries the request', () => {
    httpMock
      .expectOne((request) => request.url === '/api/users')
      .flush({ message: 'Server exploded.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushList();

    expect(rows().length).toBe(3);
  });
});

describe('Users on a role page', () => {
  let fixture: ComponentFixture<Users>;
  let httpMock: HttpTestingController;

  const SCOPED_PAGE: SchoolUsersPage = { ...PAGE, items: [USERS[0]], total: 1 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function signIn(id: string): void {
    const auth = TestBed.inject(AuthService);

    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id, name: 'Asha Deshmukh', email: 'principal@greenwood.test', role: 'school_admin' },
    });
  }

  function createScoped(role: string, pageTitle: string, pagePath: string): void {
    fixture = TestBed.createComponent(Users);
    fixture.componentRef.setInput('role', role);
    fixture.componentRef.setInput('pageTitle', pageTitle);
    fixture.componentRef.setInput('pagePath', pagePath);
    fixture.detectChanges();
    httpMock.expectOne('/api/roles/options').flush(ROLE_OPTIONS);
    fixture.detectChanges();
  }

  function flushList(page: SchoolUsersPage = PAGE): void {
    httpMock
      .expectOne((request) => request.url === '/api/users' && request.method === 'GET')
      .flush(page);
    fixture.detectChanges();
  }

  it('locks the directory to the page role', () => {
    signIn('u9');
    createScoped('teacher', 'Teachers', '/users/teachers');

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    expect(request.request.params.get('role')).toBe('teacher');
    request.flush(SCOPED_PAGE);
    fixture.detectChanges();

    expect(element().querySelector('h1')?.textContent).toContain('Teachers');
    expect(element().textContent).toContain('Review and manage teacher accounts');
    expect(element().querySelector('[data-testid="role-filter"]')).toBeNull();
    expect(element().querySelector('.stats')).toBeNull();

    const add = element().querySelector<HTMLAnchorElement>('[data-testid="add-user"]');
    const href = decodeURIComponent(add?.getAttribute('href') ?? '');

    expect(add?.textContent).toContain('Add teacher');
    expect(href.startsWith('/users/new?')).toBe(true);
    expect(href).toContain('role=teacher');
    expect(href).toContain('from=/users/teachers');
  });

  it('shows a bulk import shortcut only on the students page', () => {
    signIn('u9');
    createScoped('student', 'Students', '/users/students');
    flushList(SCOPED_PAGE);

    const importLink = element().querySelector<HTMLAnchorElement>(
      '[data-testid="import-students"]',
    );

    expect(importLink?.textContent).toContain('Bulk import');
    expect(importLink?.getAttribute('href')).toBe('/users/students/import');

    fixture.destroy();
    createScoped('teacher', 'Teachers', '/users/teachers');
    flushList(SCOPED_PAGE);

    expect(element().querySelector('[data-testid="import-students"]')).toBeNull();
  });

  it('sends edits back to the role page', () => {
    signIn('u9');
    createScoped('student', 'Students', '/users/students');
    flushList(SCOPED_PAGE);

    const edit = element().querySelector<HTMLAnchorElement>('[data-link="edit"]');
    const href = decodeURIComponent(edit?.getAttribute('href') ?? '');

    expect(href).toContain('/users/u1/edit');
    expect(href).toContain('from=/users/students');
  });
});
