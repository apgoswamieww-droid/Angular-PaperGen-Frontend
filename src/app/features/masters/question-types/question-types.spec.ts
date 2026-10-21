import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { QuestionTypeRecord, QuestionTypesPage } from '../../../core/api/question-types.types';
import { AuthService } from '../../../core/auth/auth.service';
import { QuestionTypes } from './question-types';

const TYPES: QuestionTypeRecord[] = [
  {
    id: 'q1',
    name: 'Multiple Choice Questions',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'q2',
    name: 'Short Answer',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'q3',
    name: 'Long Answer',
    order: 3,
    status: 'active',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-04T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: QuestionTypesPage = {
  items: [TYPES[0], TYPES[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('QuestionTypes', () => {
  let fixture: ComponentFixture<QuestionTypes>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionTypes],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(QuestionTypes);
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
      (candidate) => candidate.url === '/api/question-types' && candidate.method === 'GET',
    );
  }

  function flushList(page: QuestionTypesPage = PAGE): void {
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
    const form = element().querySelector<HTMLFormElement>('[data-testid="question-type-form"]');

    if (form === null) {
      throw new Error('Question type form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading question types');

    flushList();

    expect(rows().length).toBe(2);
    expect(element().textContent).toContain('Multiple Choice Questions');
    expect(element().textContent).toContain('inactive');
    expect(rows()[0].textContent).toContain('1');
    expect(rows()[1].textContent).toContain('2');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('creates a question type with the suggested next order', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-question-type"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>('[data-testid="question-type-order"]');

    expect(order?.value).toBe('3');

    setInput('question-type-name', 'Fill in the Blanks');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/question-types' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Fill in the Blanks',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'q4',
      name: 'Fill in the Blanks',
      order: 3,
      status: 'active',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="question-type-form"]')).toBeNull();
    expect(element().textContent).toContain('Question type added.');

    flushList({ ...PAGE, items: [TYPES[0], TYPES[1]], total: 2 });

    expect(rows().length).toBe(2);
  });

  it('validates the name and order before saving', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-question-type"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('question-type-name', 'Fill in the Blanks');
    setInput('question-type-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/question-types' && candidate.method === 'POST',
    );
  });

  it('edits a question type and shows the server conflict', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="question-type-name"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="question-type-order"]');

    expect(name?.value).toBe('Multiple Choice Questions');
    expect(order?.value).toBe('1');

    setInput('question-type-name', 'Short Answer');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/question-types/q1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ name: 'Short Answer', order: 1, status: 'active' });
    request.flush(
      { message: 'A question type with this name already exists.' },
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

    setInput('question-type-name', 'Advanced MCQs');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/question-types/q1' && candidate.method === 'PATCH',
    );

    request.flush({ ...TYPES[0], name: 'Advanced MCQs' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Question type updated.');

    flushList({ ...PAGE, items: [{ ...TYPES[0], name: 'Advanced MCQs' }, TYPES[1]] });

    expect(rows()[0].textContent).toContain('Advanced MCQs');
  });

  it('keeps the form open for save and new with the next order', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-question-type"]')?.click();
    fixture.detectChanges();

    setInput('question-type-name', 'Fill in the Blanks');
    element()
      .querySelector<HTMLButtonElement>('[data-testid="save-and-new-question-type"]')
      ?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/question-types' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Fill in the Blanks',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'q4',
      name: 'Fill in the Blanks',
      order: 3,
      status: 'active',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="question-type-form"]')).not.toBeNull();
    expect(element().textContent).toContain('Question type added.');

    const name = element().querySelector<HTMLInputElement>('[data-testid="question-type-name"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="question-type-order"]');

    expect(name?.value).toBe('');
    expect(order?.value).toBe('4');

    flushList();
  });

  it('deactivates and reactivates a question type', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/question-types/q1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...TYPES[0], status: 'inactive' });
    fixture.detectChanges();

    flushList({ ...PAGE, items: [{ ...TYPES[0], status: 'inactive' }, TYPES[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a question type after an inline confirmation', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Multiple Choice Questions?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/question-types/q1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Question type deleted.');

    flushList({ ...PAGE, items: [TYPES[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Multiple Choice Questions?');
  });

  it('shows deleted question types and restores them', () => {
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

    const restore = httpMock.expectOne('/api/question-types/q3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...TYPES[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Question type restored.');

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

    setInput('question-type-search', 'short');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = listRequest();

    expect(searchRequest.request.params.get('search')).toBe('short');
    searchRequest.flush({ ...PAGE, items: [TYPES[1]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Short Answer');
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

    expect(element().querySelector('[data-testid="add-question-type"]')).toBeNull();
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
