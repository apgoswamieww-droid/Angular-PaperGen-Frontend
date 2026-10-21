import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type {
  PermissionGroup,
  RoleAuditPage,
  RoleRecord,
  RolesPage,
} from '../../core/api/roles.types';
import { AuthService } from '../../core/auth/auth.service';
import { Roles } from './roles';

const CATALOG: PermissionGroup[] = [
  {
    area: 'users',
    label: 'Users',
    description: 'School accounts and access.',
    permissions: [
      { key: 'users.view', label: 'View users', description: 'Browse the user directory.' },
      {
        key: 'users.manage',
        label: 'Manage users',
        description: 'Create, edit and deactivate users.',
      },
    ],
  },
  {
    area: 'masters',
    label: 'Masters',
    description: 'Academic setup data.',
    permissions: [
      { key: 'masters.view', label: 'View masters', description: 'Browse setup data.' },
      { key: 'masters.manage', label: 'Manage masters', description: 'Edit setup data.' },
    ],
  },
  {
    area: 'questions',
    label: 'Question Bank',
    description: 'Question content.',
    permissions: [
      { key: 'questions.view', label: 'View questions', description: 'Browse questions.' },
      { key: 'questions.manage', label: 'Manage questions', description: 'Edit questions.' },
    ],
  },
];

const ROLES: RoleRecord[] = [
  {
    key: 'school_admin',
    name: 'School admin',
    description: 'Full access to every area.',
    permissions: ['users.view', 'users.manage', 'masters.view', 'masters.manage'],
    isSystem: true,
    userCount: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    key: 'teacher',
    name: 'Teacher',
    description: 'Creates questions and papers.',
    permissions: ['masters.view', 'questions.view', 'questions.manage'],
    isSystem: true,
    userCount: 4,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    key: 'exam_coordinator',
    name: 'Exam coordinator',
    description: 'Coordinates exams.',
    permissions: ['masters.view', 'masters.manage'],
    isSystem: false,
    userCount: 2,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
  },
];

const PAGE: RolesPage = {
  items: ROLES,
  total: 3,
  page: 1,
  pageSize: 10,
  summary: { total: 3, system: 2, custom: 1, assignedUsers: 7 },
  catalog: CATALOG,
};

const AUDIT: RoleAuditPage = {
  items: [
    {
      id: 'a1',
      roleKey: 'exam_coordinator',
      roleName: 'Exam coordinator',
      action: 'created',
      actorName: 'Asha Deshmukh',
      actorEmail: 'principal@greenwood.test',
      before: null,
      after: { name: 'Exam coordinator', description: 'Coordinates exams.', permissions: [] },
      createdAt: '2026-10-02T10:00:00.000Z',
    },
    {
      id: 'a2',
      roleKey: 'teacher',
      roleName: 'Teacher',
      action: 'updated',
      actorName: 'Asha Deshmukh',
      actorEmail: 'principal@greenwood.test',
      before: {
        name: 'Teacher',
        description: 'Teaches.',
        permissions: ['masters.view'],
      },
      after: {
        name: 'Teacher',
        description: 'Teaches.',
        permissions: ['masters.view', 'questions.view'],
      },
      createdAt: '2026-10-03T10:00:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
};

describe('Roles', () => {
  let fixture: ComponentFixture<Roles>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Roles],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('[data-testid="role-row"]'));
  }

  function signIn(permissions: string[] = ['roles.view', 'roles.manage']): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: {
        id: 'u1',
        name: 'Asha Deshmukh',
        email: 'principal@greenwood.test',
        role: 'role_manager',
        permissions,
      },
    });
  }

  function createPage(permissions?: string[]): void {
    signIn(permissions);
    fixture = TestBed.createComponent(Roles);
    httpMock
      .expectOne((request) => request.url === '/api/roles' && request.method === 'GET')
      .flush(PAGE);
    httpMock
      .expectOne((request) => request.url === '/api/roles/audit' && request.method === 'GET')
      .flush(AUDIT);
    fixture.detectChanges();
  }

  function flushReload(page: RolesPage = PAGE, audit: RoleAuditPage = AUDIT): void {
    httpMock
      .expectOne((request) => request.url === '/api/roles' && request.method === 'GET')
      .flush(page);
    httpMock
      .expectOne((request) => request.url === '/api/roles/audit' && request.method === 'GET')
      .flush(audit);
    fixture.detectChanges();
  }

  function setInput(selector: string, value: string): void {
    const input = element().querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);

    if (input === null) {
      throw new Error(`Input not found: ${selector}`);
    }

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function toggle(selector: string, checked: boolean): void {
    const checkbox = element().querySelector<HTMLInputElement>(selector);

    if (checkbox === null) {
      throw new Error(`Checkbox not found: ${selector}`);
    }

    checkbox.checked = checked;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submit(): void {
    const form = element().querySelector('form');

    if (form === null) {
      throw new Error('Role form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('renders role summaries, permissions and recent activity', () => {
    createPage();

    expect(rows().length).toBe(3);
    expect(element().textContent).toContain('Exam coordinator');
    expect(element().textContent).toContain('Protected');
    expect(element().textContent).toContain('Manage masters');
    expect(element().querySelectorAll('[data-testid="audit-entry"]').length).toBe(2);
    expect(element().textContent).toContain('Asha Deshmukh');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['3', '2', '1', '7']);
  });

  it('hides management controls without roles.manage', () => {
    createPage(['roles.view']);

    expect(element().querySelector('[data-testid="add-role"]')).toBeNull();
    expect(element().querySelector('[data-testid="edit-role"]')).toBeNull();
    expect(element().querySelector('[data-testid="delete-role"]')).toBeNull();
  });

  it('creates a custom role and makes manage imply view', () => {
    createPage();

    element().querySelector<HTMLButtonElement>('[data-testid="add-role"]')?.click();
    fixture.detectChanges();

    setInput('[data-testid="role-name"]', 'Exam coordinator');
    setInput('[data-testid="role-description"]', 'Coordinates exams.');
    toggle('[data-testid="permission-masters.manage"]', true);
    submit();

    const request = httpMock.expectOne((candidate) => candidate.url === '/api/roles');
    const body = request.request.body as { permissions: string[] };

    expect(request.request.method).toBe('POST');
    expect(body.permissions).toEqual(['masters.manage', 'masters.view']);
    expect(body).toMatchObject({
      name: 'Exam coordinator',
      description: 'Coordinates exams.',
    });
    request.flush(ROLES[2]);
    flushReload();

    expect(element().querySelector('[data-testid="roles-notice"]')?.textContent).toContain(
      'Role created.',
    );
    expect(element().querySelector('[data-testid="role-form"]')).toBeNull();
  });

  it('edits a built-in role while keeping its name fixed', () => {
    createPage();

    element()
      .querySelector<HTMLButtonElement>('[data-testid="edit-role"][data-role="teacher"]')
      ?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="role-name"]');

    expect(name?.value).toBe('Teacher');
    expect(name?.readOnly).toBe(true);
    expect(
      element().querySelector<HTMLInputElement>('[data-testid="permission-questions.manage"]')
        ?.checked,
    ).toBe(true);

    toggle('[data-testid="permission-questions.manage"]', false);
    submit();

    const request = httpMock.expectOne('/api/roles/teacher');
    const body = request.request.body as { name: string; permissions: string[] };

    expect(request.request.method).toBe('PATCH');
    expect(body.name).toBe('Teacher');
    expect(body.permissions).toEqual(['masters.view', 'questions.view']);
    request.flush({ ...ROLES[1], permissions: body.permissions });
    flushReload();

    expect(element().querySelector('[data-testid="roles-notice"]')?.textContent).toContain(
      'Role updated.',
    );
  });

  it('shows school admin access as read-only', () => {
    createPage();

    element()
      .querySelector<HTMLButtonElement>('[data-testid="edit-role"][data-role="school_admin"]')
      ?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Full access');
    expect(element().textContent).toContain('cannot be changed');
    expect(element().querySelector('[data-testid="save-role"]')).toBeNull();
    expect(
      element().querySelector<HTMLInputElement>('[data-testid="permission-users.manage"]')
        ?.disabled,
    ).toBe(true);
  });

  it('deletes a custom role after inline confirmation', () => {
    createPage();

    element()
      .querySelector<HTMLButtonElement>('[data-testid="delete-role"][data-role="exam_coordinator"]')
      ?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete?');

    element()
      .querySelector<HTMLButtonElement>(
        '[data-testid="confirm-delete-role"][data-role="exam_coordinator"]',
      )
      ?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/roles/exam_coordinator');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    flushReload({ ...PAGE, items: ROLES.slice(0, 2), total: 2 }, AUDIT);

    expect(element().querySelector('[data-testid="roles-notice"]')?.textContent).toContain(
      'Role deleted.',
    );
    expect(rows().length).toBe(2);
  });

  it('searches roles after the debounce', async () => {
    createPage();

    const input = element().querySelector<HTMLInputElement>('[data-testid="role-search"]');

    if (input === null) {
      throw new Error('Search input not found');
    }

    input.value = 'exam';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 350));

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/roles' && candidate.method === 'GET',
    );

    expect(request.request.params.get('search')).toBe('exam');
    request.flush({ ...PAGE, items: [ROLES[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
  });

  it('shows an error state and retries the list request', () => {
    signIn();
    fixture = TestBed.createComponent(Roles);

    httpMock
      .expectOne((candidate) => candidate.url === '/api/roles' && candidate.method === 'GET')
      .flush({ message: 'Server exploded.' }, { status: 500, statusText: 'Server Error' });
    httpMock
      .expectOne((candidate) => candidate.url === '/api/roles/audit' && candidate.method === 'GET')
      .flush(AUDIT);
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne((candidate) => candidate.url === '/api/roles' && candidate.method === 'GET')
      .flush(PAGE);
    fixture.detectChanges();

    expect(rows().length).toBe(3);
  });
});
