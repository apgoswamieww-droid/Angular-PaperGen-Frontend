import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { MediumRecord, MediumsPage } from '../../../core/api/mediums.types';
import type { StandardRecord, StandardsPage } from '../../../core/api/standards.types';
import { AuthService } from '../../../core/auth/auth.service';
import { Standards } from './standards';

const MEDIUMS: MediumRecord[] = [
  {
    id: 'med1',
    name: 'English',
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'med2',
    name: 'Hindi',
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const MEDIUMS_PAGE: MediumsPage = {
  items: MEDIUMS,
  total: 2,
  page: 1,
  pageSize: 50,
  summary: { active: 2, inactive: 0, deleted: 0 },
};

const STANDARDS: StandardRecord[] = [
  {
    id: 's1',
    name: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 's2',
    name: 'Standard 2',
    mediumId: 'med2',
    mediumName: 'Hindi',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 's3',
    name: 'Standard 3',
    mediumId: 'med1',
    mediumName: 'English',
    order: 3,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: StandardsPage = {
  items: [STANDARDS[0], STANDARDS[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('Standards', () => {
  let fixture: ComponentFixture<Standards>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Standards],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Standards);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function standardsRequest() {
    return httpMock.expectOne(
      (candidate) => candidate.url === '/api/standards' && candidate.method === 'GET',
    );
  }

  function flushMediums(page: MediumsPage = MEDIUMS_PAGE): void {
    httpMock
      .expectOne((candidate) => candidate.url === '/api/mediums' && candidate.method === 'GET')
      .flush(page);
    fixture.detectChanges();
  }

  function flushStandards(page: StandardsPage = PAGE): void {
    standardsRequest().flush(page);
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

  function setSelect(testId: string, value: string): void {
    const select = element().querySelector<HTMLSelectElement>(`[data-testid="${testId}"]`);

    if (select === null) {
      throw new Error(`Select ${testId} not found`);
    }

    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = element().querySelector<HTMLFormElement>('[data-testid="standard-form"]');

    if (form === null) {
      throw new Error('Standard form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with medium names and summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading standards');

    flushMediums();
    flushStandards();

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Standard 1');
    expect(rows()[0].textContent).toContain('English');
    expect(rows()[1].textContent).toContain('2');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('creates a standard with the selected medium and the next order', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    element().querySelector<HTMLButtonElement>('[data-testid="add-standard"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>('[data-testid="standard-order"]');

    expect(order?.value).toBe('3');

    setInput('standard-name', 'Standard 3');
    setSelect('standard-medium', 'med2');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/standards' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Standard 3',
      mediumId: 'med2',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 's4',
      name: 'Standard 3',
      mediumId: 'med2',
      mediumName: 'Hindi',
      order: 3,
      status: 'active',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="standard-form"]')).toBeNull();
    expect(element().textContent).toContain('Standard added.');

    flushStandards({ ...PAGE, items: [STANDARDS[0], STANDARDS[1]], total: 2 });
  });

  it('validates the name, medium and order before saving', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    element().querySelector<HTMLButtonElement>('[data-testid="add-standard"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('standard-name', 'Standard 9');
    setInput('standard-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );

    setInput('standard-order', '9');
    setSelect('standard-medium', '');
    submitForm();

    expect(element().querySelector('[data-testid="medium-error"]')?.textContent).toContain(
      'Select a medium.',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/standards' && candidate.method === 'POST',
    );
  });

  it('edits a standard and shows the server conflict', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="standard-name"]');

    expect(name?.value).toBe('Standard 1');

    setInput('standard-name', 'Standard 2');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/standards/s1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({
      name: 'Standard 2',
      mediumId: 'med1',
      order: 1,
      status: 'active',
    });
    request.flush(
      { message: 'A standard with this name already exists for this medium.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="form-error"]')?.textContent).toContain(
      'already exists',
    );
  });

  it('saves an edited standard and refreshes the list', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    setInput('standard-name', 'Standard 1A');
    setInput('standard-order', '5');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/standards/s1' && candidate.method === 'PATCH',
    );

    request.flush({ ...STANDARDS[0], name: 'Standard 1A', order: 5 });
    fixture.detectChanges();

    expect(element().textContent).toContain('Standard updated.');

    flushStandards({
      ...PAGE,
      items: [{ ...STANDARDS[0], name: 'Standard 1A', order: 5 }, STANDARDS[1]],
    });

    expect(rows()[0].textContent).toContain('Standard 1A');
  });

  it('deactivates and reactivates a standard', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/standards/s1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...STANDARDS[0], status: 'inactive' });
    fixture.detectChanges();

    flushStandards({ ...PAGE, items: [{ ...STANDARDS[0], status: 'inactive' }, STANDARDS[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a standard after an inline confirmation', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Standard 1?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/standards/s1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Standard deleted.');

    flushStandards({ ...PAGE, items: [STANDARDS[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Standard 1?');
  });

  it('shows deleted standards and restores them', () => {
    signIn('u1');
    flushMediums();
    flushStandards();

    const toggle = element().querySelector<HTMLInputElement>('[data-testid="show-deleted"]');

    if (toggle === null) {
      throw new Error('Show deleted toggle not found');
    }

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = standardsRequest();

    expect(request.request.params.get('includeDeleted')).toBe('true');
    request.flush({ ...PAGE, items: [STANDARDS[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].className).toContain('is-deleted');

    rows()[0].querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    const restore = httpMock.expectOne('/api/standards/s3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...STANDARDS[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Standard restored.');

    flushStandards({ ...PAGE, items: [{ ...STANDARDS[2], deletedAt: null }], total: 1 });
  });

  it('filters by medium and status, then searches after the debounce', async () => {
    flushMediums();
    flushStandards();

    setSelect('medium-filter', 'med2');

    const mediumRequest = standardsRequest();

    expect(mediumRequest.request.params.get('mediumId')).toBe('med2');
    mediumRequest.flush({ ...PAGE, items: [STANDARDS[1]], total: 1 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-status="inactive"]')?.click();
    fixture.detectChanges();

    const statusRequest = standardsRequest();

    expect(statusRequest.request.params.get('status')).toBe('inactive');
    expect(statusRequest.request.params.get('mediumId')).toBe('med2');
    statusRequest.flush({ ...PAGE, items: [STANDARDS[1]], total: 1 });
    fixture.detectChanges();

    setInput('standard-search', 'stand');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = standardsRequest();

    expect(searchRequest.request.params.get('search')).toBe('stand');
    searchRequest.flush({ ...PAGE, items: [STANDARDS[1]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Standard 2');
  });

  it('paginates through the directory', () => {
    flushMediums();
    flushStandards();

    const size = element().querySelector<HTMLSelectElement>('[data-testid="page-size"]');

    if (size === null) {
      throw new Error('Page size select not found');
    }

    size.value = '25';
    size.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const sized = standardsRequest();

    expect(sized.request.params.get('pageSize')).toBe('25');
    sized.flush({ ...PAGE, pageSize: 25, total: 60 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-action="next-page"]')?.click();
    fixture.detectChanges();

    const next = standardsRequest();

    expect(next.request.params.get('page')).toBe('2');
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [STANDARDS[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('asks for a medium before creating standards', () => {
    signIn('u1');
    flushMediums({ ...MEDIUMS_PAGE, items: [], total: 0 });
    flushStandards({ ...PAGE, items: [], total: 0 });

    element().querySelector<HTMLButtonElement>('[data-testid="add-standard"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Add at least one medium');
    expect(element().querySelector('[data-testid="standard-form"]')).toBeNull();
  });

  it('hides management controls for non-admins', () => {
    signIn('u9', 'teacher');
    flushMediums();
    flushStandards();

    expect(element().querySelector('[data-testid="add-standard"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="edit"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="delete"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="deactivate"]')).toBeNull();
  });

  it('shows an error state and retries the request', () => {
    flushMediums();
    standardsRequest().flush(
      { message: 'Server exploded.' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushStandards();

    expect(rows().length).toBe(2);
  });
});
