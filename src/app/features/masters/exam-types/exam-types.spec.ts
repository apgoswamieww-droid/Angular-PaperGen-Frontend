import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { ExamTypeRecord, ExamTypesPage } from '../../../core/api/exam-types.types';
import { AuthService } from '../../../core/auth/auth.service';
import { ExamTypes } from './exam-types';

const TYPES: ExamTypeRecord[] = [
  {
    id: 'e1',
    name: 'Unit Test',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'e2',
    name: 'Final Examination',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'e3',
    name: 'Practical Examination',
    order: 3,
    status: 'active',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-04T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: ExamTypesPage = {
  items: [TYPES[0], TYPES[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('ExamTypes', () => {
  let fixture: ComponentFixture<ExamTypes>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamTypes],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(ExamTypes);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function listRequest() {
    return httpMock.expectOne(
      (candidate) => candidate.url === '/api/exam-types' && candidate.method === 'GET',
    );
  }

  function flushList(page: ExamTypesPage = PAGE): void {
    listRequest().flush(page);
    fixture.detectChanges();
  }

  function signIn(id: string, role = 'school_admin'): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id, name: 'Asha Deshmukh', email: 'principal@greenwood.test', role },
    });
    fixture.detectChanges();
  }

  function setInput(testId: string, value: string): void {
    const input = element().querySelector<HTMLInputElement>(`[data-testid="${testId}"]`);

    if (input === null) {
      throw new Error(`Input ${testId} not found`);
    }

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = element().querySelector<HTMLFormElement>('[data-testid="exam-type-form"]');

    if (form === null) {
      throw new Error('Exam type form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading exam types');

    flushList();

    expect(rows().length).toBe(2);
    expect(element().textContent).toContain('Unit Test');
    expect(element().textContent).toContain('inactive');
    expect(rows()[0].textContent).toContain('1');
    expect(rows()[1].textContent).toContain('2');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('creates an exam type with the suggested next order', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-exam-type"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>('[data-testid="exam-type-order"]');

    expect(order?.value).toBe('3');

    setInput('exam-type-name', 'Mid-Term Examination');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/exam-types' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Mid-Term Examination',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'e4',
      name: 'Mid-Term Examination',
      order: 3,
      status: 'active',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="exam-type-form"]')).toBeNull();
    expect(element().textContent).toContain('Exam type added.');

    flushList({ ...PAGE, items: [TYPES[0], TYPES[1]], total: 2 });

    expect(rows().length).toBe(2);
  });

  it('validates the name and order before saving', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-exam-type"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('exam-type-name', 'Mid-Term Examination');
    setInput('exam-type-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/exam-types' && candidate.method === 'POST',
    );
  });

  it('edits an exam type and shows the server conflict', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="exam-type-name"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="exam-type-order"]');

    expect(name?.value).toBe('Unit Test');
    expect(order?.value).toBe('1');

    setInput('exam-type-name', 'Final Examination');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/exam-types/e1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ name: 'Final Examination', order: 1, status: 'active' });
    request.flush(
      { message: 'An exam type with this name already exists.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="form-error"]')?.textContent).toContain(
      'already exists',
    );
  });

  it('saves an edited name and refreshes the list', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    setInput('exam-type-name', 'Advanced Mock Test');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/exam-types/e1' && candidate.method === 'PATCH',
    );

    request.flush({ ...TYPES[0], name: 'Advanced Mock Test' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Exam type updated.');

    flushList({ ...PAGE, items: [{ ...TYPES[0], name: 'Advanced Mock Test' }, TYPES[1]] });

    expect(rows()[0].textContent).toContain('Advanced Mock Test');
  });

  it('keeps the form open for save and new with the next order', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-exam-type"]')?.click();
    fixture.detectChanges();

    setInput('exam-type-name', 'Mid-Term Examination');
    element().querySelector<HTMLButtonElement>('[data-testid="save-and-new-exam-type"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/exam-types' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Mid-Term Examination',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'e4',
      name: 'Mid-Term Examination',
      order: 3,
      status: 'active',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="exam-type-form"]')).not.toBeNull();
    expect(element().textContent).toContain('Exam type added.');

    const name = element().querySelector<HTMLInputElement>('[data-testid="exam-type-name"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="exam-type-order"]');

    expect(name?.value).toBe('');
    expect(order?.value).toBe('4');

    flushList();
  });

  it('deactivates and reactivates an exam type', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/exam-types/e1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...TYPES[0], status: 'inactive' });
    fixture.detectChanges();

    flushList({ ...PAGE, items: [{ ...TYPES[0], status: 'inactive' }, TYPES[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes an exam type after an inline confirmation', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Unit Test?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/exam-types/e1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Exam type deleted.');

    flushList({ ...PAGE, items: [TYPES[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Unit Test?');
  });

  it('shows deleted exam types and restores them', () => {
    signIn('u1');
    flushList();

    const toggle = element().querySelector<HTMLInputElement>('[data-testid="show-deleted"]');

    if (toggle === null) {
      throw new Error('Show deleted toggle not found');
    }

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = listRequest();

    expect(request.request.params.get('includeDeleted')).toBe('true');
    request.flush({ ...PAGE, items: [TYPES[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].className).toContain('is-deleted');

    rows()[0].querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    const restore = httpMock.expectOne('/api/exam-types/e3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...TYPES[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Exam type restored.');

    flushList({ ...PAGE, items: [{ ...TYPES[2], deletedAt: null }], total: 1 });
  });

  it('filters by status and searches after the debounce', async () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-status="inactive"]')?.click();
    fixture.detectChanges();

    const statusRequest = listRequest();

    expect(statusRequest.request.params.get('status')).toBe('inactive');
    statusRequest.flush({ ...PAGE, items: [TYPES[1]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);

    setInput('exam-type-search', 'final');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = listRequest();

    expect(searchRequest.request.params.get('search')).toBe('final');
    searchRequest.flush({ ...PAGE, items: [TYPES[1]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Final Examination');
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

    const sized = listRequest();

    expect(sized.request.params.get('pageSize')).toBe('25');
    sized.flush({ ...PAGE, pageSize: 25, total: 60 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-action="next-page"]')?.click();
    fixture.detectChanges();

    const next = listRequest();

    expect(next.request.params.get('page')).toBe('2');
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [TYPES[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('hides management controls for non-admins', () => {
    signIn('u9', 'teacher');
    flushList();

    expect(element().querySelector('[data-testid="add-exam-type"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="edit"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="delete"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="deactivate"]')).toBeNull();
  });

  it('shows an error state and retries the request', () => {
    listRequest().flush(
      { message: 'Server exploded.' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushList();

    expect(rows().length).toBe(2);
  });
});
