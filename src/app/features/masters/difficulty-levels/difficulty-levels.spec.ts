import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type {
  DifficultyLevelRecord,
  DifficultyLevelsPage,
} from '../../../core/api/difficulty-levels.types';
import { AuthService } from '../../../core/auth/auth.service';
import { DifficultyLevels } from './difficulty-levels';

const LEVELS: DifficultyLevelRecord[] = [
  {
    id: 'd1',
    name: 'Easy',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'd2',
    name: 'Medium',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'd3',
    name: 'Hard',
    order: 3,
    status: 'active',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-04T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: DifficultyLevelsPage = {
  items: [LEVELS[0], LEVELS[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('DifficultyLevels', () => {
  let fixture: ComponentFixture<DifficultyLevels>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DifficultyLevels],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(DifficultyLevels);
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
      (candidate) => candidate.url === '/api/difficulty-levels' && candidate.method === 'GET',
    );
  }

  function flushList(page: DifficultyLevelsPage = PAGE): void {
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
    const form = element().querySelector<HTMLFormElement>('[data-testid="difficulty-level-form"]');

    if (form === null) {
      throw new Error('Difficulty level form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading difficulty levels');

    flushList();

    expect(rows().length).toBe(2);
    expect(element().textContent).toContain('Easy');
    expect(element().textContent).toContain('inactive');

    const headers = Array.from(element().querySelectorAll('thead th')).map((node) =>
      node.textContent?.trim(),
    );

    expect(headers.slice(0, 3)).toEqual(['Name', 'Status', 'Order']);

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('creates a difficulty level with the suggested next order', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-difficulty-level"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>(
      '[data-testid="difficulty-level-order"]',
    );

    expect(order?.value).toBe('3');

    setInput('difficulty-level-name', 'Expert');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/difficulty-levels' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Expert',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'd4',
      name: 'Expert',
      order: 3,
      status: 'active',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="difficulty-level-form"]')).toBeNull();
    expect(element().textContent).toContain('Difficulty level added.');

    flushList({ ...PAGE, items: [LEVELS[0], LEVELS[1]], total: 2 });

    expect(rows().length).toBe(2);
  });

  it('validates the name and order before saving', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-difficulty-level"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('difficulty-level-name', 'Expert');
    setInput('difficulty-level-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/difficulty-levels' && candidate.method === 'POST',
    );
  });

  it('edits a difficulty level and shows the server conflict', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="difficulty-level-name"]');

    expect(name?.value).toBe('Easy');

    setInput('difficulty-level-name', 'Medium');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/difficulty-levels/d1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ name: 'Medium', order: 1, status: 'active' });
    request.flush(
      { message: 'A difficulty level with this name already exists.' },
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

    setInput('difficulty-level-name', 'Very Easy');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/difficulty-levels/d1' && candidate.method === 'PATCH',
    );

    request.flush({ ...LEVELS[0], name: 'Very Easy' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Difficulty level updated.');

    flushList({ ...PAGE, items: [{ ...LEVELS[0], name: 'Very Easy' }, LEVELS[1]] });

    expect(rows()[0].textContent).toContain('Very Easy');
  });

  it('keeps the form open for save and new with the next order', () => {
    signIn('u1');
    flushList();

    element().querySelector<HTMLButtonElement>('[data-testid="add-difficulty-level"]')?.click();
    fixture.detectChanges();

    setInput('difficulty-level-name', 'Expert');
    element()
      .querySelector<HTMLButtonElement>('[data-testid="save-and-new-difficulty-level"]')
      ?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/difficulty-levels' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Expert',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'd4',
      name: 'Expert',
      order: 3,
      status: 'active',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="difficulty-level-form"]')).not.toBeNull();
    expect(element().textContent).toContain('Difficulty level added.');

    const name = element().querySelector<HTMLInputElement>('[data-testid="difficulty-level-name"]');
    const order = element().querySelector<HTMLInputElement>(
      '[data-testid="difficulty-level-order"]',
    );

    expect(name?.value).toBe('');
    expect(order?.value).toBe('4');

    flushList();
  });

  it('deactivates and reactivates a difficulty level', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/difficulty-levels/d1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...LEVELS[0], status: 'inactive' });
    fixture.detectChanges();

    flushList({ ...PAGE, items: [{ ...LEVELS[0], status: 'inactive' }, LEVELS[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a difficulty level after an inline confirmation', () => {
    signIn('u1');
    flushList();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Easy?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/difficulty-levels/d1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Difficulty level deleted.');

    flushList({ ...PAGE, items: [LEVELS[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Easy?');
  });

  it('shows deleted difficulty levels and restores them', () => {
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
    request.flush({ ...PAGE, items: [LEVELS[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].className).toContain('is-deleted');

    rows()[0].querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    const restore = httpMock.expectOne('/api/difficulty-levels/d3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...LEVELS[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Difficulty level restored.');

    flushList({ ...PAGE, items: [{ ...LEVELS[2], deletedAt: null }], total: 1 });
  });

  it('filters by status and searches after the debounce', async () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-status="inactive"]')?.click();
    fixture.detectChanges();

    const statusRequest = listRequest();

    expect(statusRequest.request.params.get('status')).toBe('inactive');
    statusRequest.flush({ ...PAGE, items: [LEVELS[1]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);

    setInput('difficulty-level-search', 'med');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = listRequest();

    expect(searchRequest.request.params.get('search')).toBe('med');
    searchRequest.flush({ ...PAGE, items: [LEVELS[1]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Medium');
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
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [LEVELS[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('hides management controls for non-admins', () => {
    signIn('u9', 'teacher');
    flushList();

    expect(element().querySelector('[data-testid="add-difficulty-level"]')).toBeNull();
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
