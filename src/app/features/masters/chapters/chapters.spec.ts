import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { ChapterRecord, ChaptersPage } from '../../../core/api/chapters.types';
import type { SubjectRecord, SubjectsPage } from '../../../core/api/subjects.types';
import { AuthService } from '../../../core/auth/auth.service';
import { Chapters } from './chapters';

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
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'sub3',
    name: 'History',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med2',
    mediumName: 'Hindi',
    order: 3,
    status: 'inactive',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'sub4',
    name: 'Geography',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    order: 4,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const SUBJECTS_PAGE: SubjectsPage = {
  items: SUBJECTS,
  total: 4,
  page: 1,
  pageSize: 50,
  summary: { active: 3, inactive: 1, deleted: 0 },
};

const CHAPTERS: ChapterRecord[] = [
  {
    id: 'ch1',
    name: 'Number System',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    referenceType: 'ncert',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'ch2',
    name: 'Living World',
    subjectId: 'sub2',
    subjectName: 'Science',
    standardId: 's2',
    standardName: 'Standard 2',
    mediumId: 'med1',
    mediumName: 'English',
    referenceType: 'other',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'ch3',
    name: 'Geometry Basics',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    referenceType: 'ncert',
    order: 3,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: ChaptersPage = {
  items: [CHAPTERS[0], CHAPTERS[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('Chapters', () => {
  let fixture: ComponentFixture<Chapters>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chapters],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Chapters);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function subjectOptionsRequest() {
    return httpMock.expectOne(
      (candidate) => candidate.url === '/api/subjects' && candidate.method === 'GET',
    );
  }

  function chaptersRequest(includeDeleted = false) {
    return httpMock.expectOne(
      (candidate) =>
        candidate.url === '/api/chapters' &&
        candidate.method === 'GET' &&
        (candidate.params.get('includeDeleted') === 'true') === includeDeleted,
    );
  }

  function flushSubjectOptions(page: SubjectsPage = SUBJECTS_PAGE): void {
    subjectOptionsRequest().flush(page);
    fixture.detectChanges();
  }

  function flushChapters(page: ChaptersPage = PAGE, includeDeleted = false): void {
    chaptersRequest(includeDeleted).flush(page);
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
    const form = element().querySelector<HTMLFormElement>('[data-testid="chapter-form"]');

    if (form === null) {
      throw new Error('Chapter form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with subject lineage and summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading chapters');

    flushSubjectOptions();
    flushChapters();

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Number System');
    expect(rows()[0].textContent).toContain('Mathematics');
    expect(rows()[0].textContent).toContain('Standard 1 · English');
    expect(rows()[0].textContent).toContain('NCERT');
    expect(rows()[1].textContent).toContain('Other');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('loads only active, non-deleted subjects into the dropdowns', () => {
    signIn('u1');
    fixture.detectChanges();

    const request = subjectOptionsRequest();

    expect(request.request.params.get('status')).toBe('active');
    expect(request.request.params.get('pageSize')).toBe('50');

    request.flush(SUBJECTS_PAGE);
    flushChapters();

    const filterOptions = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="subject-filter"] option'),
    ).map((option) => option.textContent?.trim());

    expect(filterOptions).toEqual([
      'All subjects',
      'Mathematics · Standard 1 · English',
      'Science · Standard 2 · English',
    ]);

    element().querySelector<HTMLButtonElement>('[data-testid="add-chapter"]')?.click();
    fixture.detectChanges();

    const formOptions = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="chapter-subject"] option'),
    ).map((option) => option.textContent?.trim());

    expect(formOptions).toEqual([
      'Select subject',
      'Mathematics · Standard 1 · English',
      'Science · Standard 2 · English',
    ]);

    const referenceOptions = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="chapter-reference"] option'),
    ).map((option) => option.textContent?.trim());

    expect(referenceOptions).toEqual(['NCERT', 'Other']);
  });

  it('creates a chapter with the selected subject, reference type and next order', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    element().querySelector<HTMLButtonElement>('[data-testid="add-chapter"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>('[data-testid="chapter-order"]');

    expect(order?.value).toBe('3');

    setInput('chapter-name', 'World History');
    setSelect('chapter-subject', 'sub2');
    setSelect('chapter-reference', 'other');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/chapters' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'World History',
      subjectId: 'sub2',
      referenceType: 'other',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'ch4',
      name: 'World History',
      subjectId: 'sub2',
      subjectName: 'Science',
      standardId: 's2',
      standardName: 'Standard 2',
      mediumId: 'med1',
      mediumName: 'English',
      referenceType: 'other',
      order: 3,
      status: 'active',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="chapter-form"]')).toBeNull();
    expect(element().textContent).toContain('Chapter added.');

    flushChapters();
  });

  it('keeps the form open with the subject preserved when saving and starting a new chapter', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    element().querySelector<HTMLButtonElement>('[data-testid="add-chapter"]')?.click();
    fixture.detectChanges();

    setSelect('chapter-subject', 'sub2');
    setInput('chapter-name', 'World History');

    element().querySelector<HTMLButtonElement>('[data-testid="save-and-new-chapter"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/chapters' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'World History',
      subjectId: 'sub2',
      referenceType: 'ncert',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 'ch4',
      name: 'World History',
      subjectId: 'sub2',
      subjectName: 'Science',
      standardId: 's2',
      standardName: 'Standard 2',
      mediumId: 'med1',
      mediumName: 'English',
      referenceType: 'ncert',
      order: 3,
      status: 'active',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
      deletedAt: null,
    });
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="chapter-form"]')).not.toBeNull();
    expect(element().textContent).toContain('Chapter added.');

    const name = element().querySelector<HTMLInputElement>('[data-testid="chapter-name"]');
    const subject = element().querySelector<HTMLSelectElement>('[data-testid="chapter-subject"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="chapter-order"]');

    expect(name?.value).toBe('');
    expect(subject?.value).toBe('sub2');
    expect(order?.value).toBe('4');

    flushChapters();
  });

  it('validates the name, subject and order before saving', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    element().querySelector<HTMLButtonElement>('[data-testid="add-chapter"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('chapter-name', 'Grammar');
    setInput('chapter-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );

    setInput('chapter-order', '9');
    setSelect('chapter-subject', '');
    submitForm();

    expect(element().querySelector('[data-testid="subject-error"]')?.textContent).toContain(
      'Select a subject.',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/chapters' && candidate.method === 'POST',
    );
  });

  it('edits a chapter and shows the server conflict', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="chapter-name"]');

    expect(name?.value).toBe('Number System');

    setInput('chapter-name', 'Living World');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/chapters/ch1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({
      name: 'Living World',
      subjectId: 'sub1',
      referenceType: 'ncert',
      order: 1,
      status: 'active',
    });
    request.flush(
      { message: 'A chapter with this name already exists for this subject.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="form-error"]')?.textContent).toContain(
      'already exists',
    );
  });

  it('saves an edited chapter and refreshes the list', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    setInput('chapter-name', 'Advanced Number Theory');
    setInput('chapter-order', '5');
    setSelect('chapter-reference', 'other');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/chapters/ch1' && candidate.method === 'PATCH',
    );

    request.flush({
      ...CHAPTERS[0],
      name: 'Advanced Number Theory',
      order: 5,
      referenceType: 'other',
    });
    fixture.detectChanges();

    expect(element().textContent).toContain('Chapter updated.');

    flushChapters({
      ...PAGE,
      items: [
        { ...CHAPTERS[0], name: 'Advanced Number Theory', order: 5, referenceType: 'other' },
        CHAPTERS[1],
      ],
    });

    expect(rows()[0].textContent).toContain('Advanced Number Theory');
  });

  it('deactivates and reactivates a chapter', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/chapters/ch1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...CHAPTERS[0], status: 'inactive' });
    fixture.detectChanges();

    flushChapters({ ...PAGE, items: [{ ...CHAPTERS[0], status: 'inactive' }, CHAPTERS[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a chapter after an inline confirmation', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Number System?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/chapters/ch1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Chapter deleted.');

    flushChapters({ ...PAGE, items: [CHAPTERS[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Number System?');
  });

  it('shows deleted chapters and restores them', () => {
    signIn('u1');
    flushSubjectOptions();
    flushChapters();

    const toggle = element().querySelector<HTMLInputElement>('[data-testid="show-deleted"]');

    if (toggle === null) {
      throw new Error('Show deleted toggle not found');
    }

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = chaptersRequest(true);

    expect(request.request.params.get('includeDeleted')).toBe('true');
    request.flush({ ...PAGE, items: [CHAPTERS[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].className).toContain('is-deleted');

    rows()[0].querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    const restore = httpMock.expectOne('/api/chapters/ch3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...CHAPTERS[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Chapter restored.');

    flushChapters(PAGE, true);
  });

  it('filters by subject, reference type and status, then searches after the debounce', async () => {
    flushSubjectOptions();
    flushChapters();

    setSelect('subject-filter', 'sub1');

    const subjectRequest = chaptersRequest();

    expect(subjectRequest.request.params.get('subjectId')).toBe('sub1');
    subjectRequest.flush({ ...PAGE, items: [CHAPTERS[0]], total: 1 });
    fixture.detectChanges();

    setSelect('reference-filter', 'other');

    const referenceRequest = chaptersRequest();

    expect(referenceRequest.request.params.get('subjectId')).toBe('sub1');
    expect(referenceRequest.request.params.get('referenceType')).toBe('other');
    referenceRequest.flush({ ...PAGE, items: [CHAPTERS[1]], total: 1 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-status="inactive"]')?.click();
    fixture.detectChanges();

    const statusRequest = chaptersRequest();

    expect(statusRequest.request.params.get('status')).toBe('inactive');
    expect(statusRequest.request.params.get('referenceType')).toBe('other');
    statusRequest.flush({ ...PAGE, items: [CHAPTERS[1]], total: 1 });
    fixture.detectChanges();

    setInput('chapter-search', 'living');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = chaptersRequest();

    expect(searchRequest.request.params.get('search')).toBe('living');
    searchRequest.flush({ ...PAGE, items: [CHAPTERS[1]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Living World');
  });

  it('paginates through the directory', () => {
    flushSubjectOptions();
    flushChapters();

    const size = element().querySelector<HTMLSelectElement>('[data-testid="page-size"]');

    if (size === null) {
      throw new Error('Page size select not found');
    }

    size.value = '25';
    size.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const sized = chaptersRequest();

    expect(sized.request.params.get('pageSize')).toBe('25');
    sized.flush({ ...PAGE, pageSize: 25, total: 60 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-action="next-page"]')?.click();
    fixture.detectChanges();

    const next = chaptersRequest();

    expect(next.request.params.get('page')).toBe('2');
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [CHAPTERS[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('asks for a subject before creating chapters', () => {
    signIn('u1');
    flushSubjectOptions({ ...SUBJECTS_PAGE, items: [], total: 0 });
    flushChapters({ ...PAGE, items: [], total: 0 });

    element().querySelector<HTMLButtonElement>('[data-testid="add-chapter"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Add at least one subject');
    expect(element().querySelector('[data-testid="chapter-form"]')).toBeNull();
  });

  it('hides management controls for non-admins', () => {
    signIn('u9', 'teacher');
    flushSubjectOptions();
    flushChapters();

    expect(element().querySelector('[data-testid="add-chapter"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="edit"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="delete"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="deactivate"]')).toBeNull();
  });

  it('shows an error state and retries the request', () => {
    flushSubjectOptions();
    chaptersRequest().flush(
      { message: 'Server exploded.' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushChapters();

    expect(rows().length).toBe(2);
  });
});
