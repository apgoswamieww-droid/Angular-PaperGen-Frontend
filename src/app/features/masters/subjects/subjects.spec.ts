import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { StandardRecord, StandardsPage } from '../../../core/api/standards.types';
import type { SubjectRecord, SubjectsPage } from '../../../core/api/subjects.types';
import { AuthService } from '../../../core/auth/auth.service';
import { Subjects } from './subjects';

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
    mediumId: 'med1',
    mediumName: 'English',
    order: 2,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 's3',
    name: 'Standard 1',
    mediumId: 'med2',
    mediumName: 'Hindi',
    order: 1,
    status: 'inactive',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 's4',
    name: 'Standard 3',
    mediumId: 'med1',
    mediumName: 'English',
    order: 3,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const STANDARDS_PAGE: StandardsPage = {
  items: STANDARDS,
  total: 4,
  page: 1,
  pageSize: 50,
  summary: { active: 3, inactive: 1, deleted: 0 },
};

const SUBJECTS: SubjectRecord[] = [
  {
    id: 'sub1',
    name: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'sub2',
    name: 'Science',
    standardId: 's2',
    standardName: 'Standard 2',
    mediumId: 'med1',
    mediumName: 'English',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'sub3',
    name: 'History',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    order: 3,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: SubjectsPage = {
  items: [SUBJECTS[0], SUBJECTS[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('Subjects', () => {
  let fixture: ComponentFixture<Subjects>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subjects],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Subjects);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function standardOptions() {
    return httpMock.expectOne(
      (candidate) => candidate.url === '/api/standards' && candidate.method === 'GET',
    );
  }

  function subjectsRequest(includeDeleted = false) {
    return httpMock.expectOne(
      (candidate) =>
        candidate.url === '/api/subjects' &&
        candidate.method === 'GET' &&
        (candidate.params.get('includeDeleted') === 'true') === includeDeleted,
    );
  }

  function flushStandardOptions(page: StandardsPage = STANDARDS_PAGE): void {
    standardOptions().flush(page);
    fixture.detectChanges();
  }

  function flushSubjects(page: SubjectsPage = PAGE, includeDeleted = false): void {
    subjectsRequest(includeDeleted).flush(page);
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
    const form = element().querySelector<HTMLFormElement>('[data-testid="subject-form"]');

    if (form === null) {
      throw new Error('Subject form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with standard names and summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading subjects');

    flushStandardOptions();
    flushSubjects();

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Mathematics');
    expect(rows()[0].textContent).toContain('Standard 1');
    expect(rows()[0].textContent).toContain('English');
    expect(rows()[1].textContent).toContain('2');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('loads only active, non-deleted standards into the dropdowns', () => {
    signIn('u1');
    fixture.detectChanges();

    const request = standardOptions();

    expect(request.request.params.get('status')).toBe('active');
    expect(request.request.params.get('pageSize')).toBe('50');

    request.flush(STANDARDS_PAGE);
    flushSubjects();

    const options = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="standard-filter"] option'),
    ).map((option) => option.textContent?.trim());

    expect(options).toEqual(['All standards', 'Standard 1 · English', 'Standard 2 · English']);

    element().querySelector<HTMLButtonElement>('[data-testid="add-subject"]')?.click();
    fixture.detectChanges();

    const formOptions = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="subject-standard"] option'),
    ).map((option) => option.textContent?.trim());

    expect(formOptions).toEqual([
      'Select standard',
      'Standard 1 · English',
      'Standard 2 · English',
    ]);
  });

  it('creates a subject with the selected standard and the next order', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    element().querySelector<HTMLButtonElement>('[data-testid="add-subject"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>('[data-testid="subject-order"]');

    expect(order?.value).toBe('3');

    setInput('subject-name', 'Social Studies');
    setSelect('subject-standard', 's2');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/subjects' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Social Studies',
      standardId: 's2',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'sub4',
      name: 'Social Studies',
      standardId: 's2',
      standardName: 'Standard 2',
      mediumId: 'med1',
      mediumName: 'English',
      order: 3,
      status: 'active',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="subject-form"]')).toBeNull();
    expect(element().textContent).toContain('Subject added.');

    flushSubjects();
  });

  it('keeps the form open with the standard preserved when saving and starting a new subject', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    element().querySelector<HTMLButtonElement>('[data-testid="add-subject"]')?.click();
    fixture.detectChanges();

    setInput('subject-name', 'Social Studies');
    setSelect('subject-standard', 's2');

    element().querySelector<HTMLButtonElement>('[data-testid="save-and-new-subject"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/subjects' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Social Studies',
      standardId: 's2',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'sub4',
      name: 'Social Studies',
      standardId: 's2',
      standardName: 'Standard 2',
      mediumId: 'med1',
      mediumName: 'English',
      order: 3,
      status: 'active',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="subject-form"]')).not.toBeNull();
    expect(element().textContent).toContain('Subject added.');

    const name = element().querySelector<HTMLInputElement>('[data-testid="subject-name"]');
    const standard = element().querySelector<HTMLSelectElement>('[data-testid="subject-standard"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="subject-order"]');

    expect(name?.value).toBe('');
    expect(standard?.value).toBe('s2');
    expect(order?.value).toBe('4');

    flushSubjects();
  });

  it('validates the name, standard and order before saving', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    element().querySelector<HTMLButtonElement>('[data-testid="add-subject"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('subject-name', 'Marathi');
    setInput('subject-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );

    setInput('subject-order', '9');
    setSelect('subject-standard', '');
    submitForm();

    expect(element().querySelector('[data-testid="standard-error"]')?.textContent).toContain(
      'Select a standard.',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/subjects' && candidate.method === 'POST',
    );
  });

  it('edits a subject and shows the server conflict', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="subject-name"]');

    expect(name?.value).toBe('Mathematics');

    setInput('subject-name', 'Science');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/subjects/sub1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({
      name: 'Science',
      standardId: 's1',
      order: 1,
      status: 'active',
    });
    request.flush(
      { message: 'A subject with this name already exists for this standard.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="form-error"]')?.textContent).toContain(
      'already exists',
    );
  });

  it('saves an edited subject and refreshes the list', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    setInput('subject-name', 'Mathematics Advanced');
    setInput('subject-order', '5');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/subjects/sub1' && candidate.method === 'PATCH',
    );

    request.flush({ ...SUBJECTS[0], name: 'Mathematics Advanced', order: 5 });
    fixture.detectChanges();

    expect(element().textContent).toContain('Subject updated.');

    flushSubjects({
      ...PAGE,
      items: [{ ...SUBJECTS[0], name: 'Mathematics Advanced', order: 5 }, SUBJECTS[1]],
    });

    expect(rows()[0].textContent).toContain('Mathematics Advanced');
  });

  it('deactivates and reactivates a subject', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/subjects/sub1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...SUBJECTS[0], status: 'inactive' });
    fixture.detectChanges();

    flushSubjects({ ...PAGE, items: [{ ...SUBJECTS[0], status: 'inactive' }, SUBJECTS[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a subject after an inline confirmation', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Mathematics?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/subjects/sub1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Subject deleted.');

    flushSubjects({ ...PAGE, items: [SUBJECTS[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Mathematics?');
  });

  it('shows deleted subjects and restores them', () => {
    signIn('u1');
    flushStandardOptions();
    flushSubjects();

    const toggle = element().querySelector<HTMLInputElement>('[data-testid="show-deleted"]');

    if (toggle === null) {
      throw new Error('Show deleted toggle not found');
    }

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = subjectsRequest(true);

    expect(request.request.params.get('includeDeleted')).toBe('true');
    request.flush({ ...PAGE, items: [SUBJECTS[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].className).toContain('is-deleted');

    rows()[0].querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    const restore = httpMock.expectOne('/api/subjects/sub3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...SUBJECTS[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Subject restored.');

    flushSubjects(PAGE, true);
  });

  it('filters by standard and status, then searches after the debounce', async () => {
    flushStandardOptions();
    flushSubjects();

    setSelect('standard-filter', 's1');

    const standardRequest = subjectsRequest();

    expect(standardRequest.request.params.get('standardId')).toBe('s1');
    standardRequest.flush({ ...PAGE, items: [SUBJECTS[0]], total: 1 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-status="inactive"]')?.click();
    fixture.detectChanges();

    const statusRequest = subjectsRequest();

    expect(statusRequest.request.params.get('status')).toBe('inactive');
    expect(statusRequest.request.params.get('standardId')).toBe('s1');
    statusRequest.flush({ ...PAGE, items: [SUBJECTS[1]], total: 1 });
    fixture.detectChanges();

    setInput('subject-search', 'math');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = subjectsRequest();

    expect(searchRequest.request.params.get('search')).toBe('math');
    searchRequest.flush({ ...PAGE, items: [SUBJECTS[0]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Mathematics');
  });

  it('paginates through the directory', () => {
    flushStandardOptions();
    flushSubjects();

    const size = element().querySelector<HTMLSelectElement>('[data-testid="page-size"]');

    if (size === null) {
      throw new Error('Page size select not found');
    }

    size.value = '25';
    size.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const sized = subjectsRequest();

    expect(sized.request.params.get('pageSize')).toBe('25');
    sized.flush({ ...PAGE, pageSize: 25, total: 60 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-action="next-page"]')?.click();
    fixture.detectChanges();

    const next = subjectsRequest();

    expect(next.request.params.get('page')).toBe('2');
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [SUBJECTS[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('asks for a standard before creating subjects', () => {
    signIn('u1');
    flushStandardOptions({ ...STANDARDS_PAGE, items: [], total: 0 });
    flushSubjects({ ...PAGE, items: [], total: 0 });

    element().querySelector<HTMLButtonElement>('[data-testid="add-subject"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Add at least one standard');
    expect(element().querySelector('[data-testid="subject-form"]')).toBeNull();
  });

  it('hides management controls for non-admins', () => {
    signIn('u9', 'teacher');
    flushStandardOptions();
    flushSubjects();

    expect(element().querySelector('[data-testid="add-subject"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="edit"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="delete"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="deactivate"]')).toBeNull();
  });

  it('shows an error state and retries the request', () => {
    flushStandardOptions();
    subjectsRequest().flush(
      { message: 'Server exploded.' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushSubjects();

    expect(rows().length).toBe(2);
  });
});
