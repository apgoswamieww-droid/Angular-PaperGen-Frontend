import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { ChapterRecord, ChaptersPage } from '../../../core/api/chapters.types';
import type { TopicRecord, TopicsPage } from '../../../core/api/topics.types';
import { AuthService } from '../../../core/auth/auth.service';
import { Topics } from './topics';

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
    status: 'active',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'ch3',
    name: 'Computer Basics',
    subjectId: 'sub3',
    subjectName: 'Computers',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med2',
    mediumName: 'Hindi',
    referenceType: 'ncert',
    order: 3,
    status: 'inactive',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'ch4',
    name: 'Geometry Basics',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    referenceType: 'ncert',
    order: 4,
    status: 'active',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-04T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const CHAPTER_OPTIONS_PAGE: ChaptersPage = {
  items: CHAPTERS,
  total: 4,
  page: 1,
  pageSize: 50,
  summary: { active: 3, inactive: 1, deleted: 0 },
};

const TOPICS: TopicRecord[] = [
  {
    id: 't1',
    name: 'Whole Numbers',
    chapterId: 'ch1',
    chapterName: 'Number System',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
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
    id: 't2',
    name: 'Integers',
    chapterId: 'ch1',
    chapterName: 'Number System',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    order: 2,
    status: 'inactive',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 't3',
    name: 'Plants',
    chapterId: 'ch2',
    chapterName: 'Living World',
    subjectId: 'sub2',
    subjectName: 'Science',
    standardId: 's2',
    standardName: 'Standard 2',
    mediumId: 'med1',
    mediumName: 'English',
    order: 3,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: '2026-10-05T10:00:00.000Z',
  },
];

const PAGE: TopicsPage = {
  items: [TOPICS[0], TOPICS[1]],
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { active: 1, inactive: 1, deleted: 1 },
};

describe('Topics', () => {
  let fixture: ComponentFixture<Topics>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topics],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Topics);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function chapterOptionsRequest() {
    return httpMock.expectOne(
      (candidate) => candidate.url === '/api/chapters' && candidate.method === 'GET',
    );
  }

  function topicsRequest(includeDeleted = false) {
    return httpMock.expectOne(
      (candidate) =>
        candidate.url === '/api/topics' &&
        candidate.method === 'GET' &&
        (candidate.params.get('includeDeleted') === 'true') === includeDeleted,
    );
  }

  function flushChapterOptions(page: ChaptersPage = CHAPTER_OPTIONS_PAGE): void {
    chapterOptionsRequest().flush(page);
    fixture.detectChanges();
  }

  function flushTopics(page: TopicsPage = PAGE, includeDeleted = false): void {
    topicsRequest(includeDeleted).flush(page);
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
    const form = element().querySelector<HTMLFormElement>('[data-testid="topic-form"]');

    if (form === null) {
      throw new Error('Topic form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the directory with chapter lineage and summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading topics');

    flushChapterOptions();
    flushTopics();

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Whole Numbers');
    expect(rows()[0].textContent).toContain('Number System');
    expect(rows()[0].textContent).toContain('Mathematics · Standard 1 · English');
    expect(rows()[1].textContent).toContain('Integers');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['1', '1', '1']);
  });

  it('loads only active, non-deleted chapters into the dropdowns', () => {
    signIn('u1');
    fixture.detectChanges();

    const request = chapterOptionsRequest();

    expect(request.request.params.get('status')).toBe('active');
    expect(request.request.params.get('pageSize')).toBe('50');

    request.flush(CHAPTER_OPTIONS_PAGE);
    flushTopics();

    const filterOptions = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="chapter-filter"] option'),
    ).map((option) => option.textContent?.trim());

    expect(filterOptions).toEqual([
      'All chapters',
      'Number System · Mathematics · Standard 1 · English',
      'Living World · Science · Standard 2 · English',
    ]);

    element().querySelector<HTMLButtonElement>('[data-testid="add-topic"]')?.click();
    fixture.detectChanges();

    const formOptions = Array.from(
      element().querySelectorAll<HTMLOptionElement>('[data-testid="topic-chapter"] option'),
    ).map((option) => option.textContent?.trim());

    expect(formOptions).toEqual([
      'Select chapter',
      'Number System · Mathematics · Standard 1 · English',
      'Living World · Science · Standard 2 · English',
    ]);
  });

  it('creates a topic with the selected chapter and next order', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    element().querySelector<HTMLButtonElement>('[data-testid="add-topic"]')?.click();
    fixture.detectChanges();

    const order = element().querySelector<HTMLInputElement>('[data-testid="topic-order"]');

    expect(order?.value).toBe('3');

    setInput('topic-name', 'Plant Kingdom');
    setSelect('topic-chapter', 'ch2');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/topics' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Plant Kingdom',
      chapterId: 'ch2',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 't4',
      name: 'Plant Kingdom',
      chapterId: 'ch2',
      chapterName: 'Living World',
      subjectId: 'sub2',
      subjectName: 'Science',
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

    expect(element().querySelector('[data-testid="topic-form"]')).toBeNull();
    expect(element().textContent).toContain('Topic added.');

    flushTopics();
  });

  it('keeps the form open with the chapter preserved when saving and starting a new topic', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    element().querySelector<HTMLButtonElement>('[data-testid="add-topic"]')?.click();
    fixture.detectChanges();

    setSelect('topic-chapter', 'ch2');
    setInput('topic-name', 'Plant Kingdom');

    element().querySelector<HTMLButtonElement>('[data-testid="save-and-new-topic"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/topics' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      name: 'Plant Kingdom',
      chapterId: 'ch2',
      order: 3,
      status: 'active',
    });
    request.flush({
      id: 't4',
      name: 'Plant Kingdom',
      chapterId: 'ch2',
      chapterName: 'Living World',
      subjectId: 'sub2',
      subjectName: 'Science',
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

    expect(element().querySelector('[data-testid="topic-form"]')).not.toBeNull();
    expect(element().textContent).toContain('Topic added.');

    const name = element().querySelector<HTMLInputElement>('[data-testid="topic-name"]');
    const chapter = element().querySelector<HTMLSelectElement>('[data-testid="topic-chapter"]');
    const order = element().querySelector<HTMLInputElement>('[data-testid="topic-order"]');

    expect(name?.value).toBe('');
    expect(chapter?.value).toBe('ch2');
    expect(order?.value).toBe('4');

    flushTopics();
  });

  it('validates the name, chapter and order before saving', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    element().querySelector<HTMLButtonElement>('[data-testid="add-topic"]')?.click();
    fixture.detectChanges();

    submitForm();

    expect(element().querySelector('[data-testid="name-error"]')?.textContent).toContain(
      'Name is required.',
    );

    setInput('topic-name', 'Fractions');
    setInput('topic-order', '0');
    submitForm();

    expect(element().querySelector('[data-testid="order-error"]')?.textContent).toContain(
      'between 1 and 100',
    );

    setInput('topic-order', '9');
    setSelect('topic-chapter', '');
    submitForm();

    expect(element().querySelector('[data-testid="chapter-error"]')?.textContent).toContain(
      'Select a chapter.',
    );
    httpMock.expectNone(
      (candidate) => candidate.url === '/api/topics' && candidate.method === 'POST',
    );
  });

  it('edits a topic and shows the server conflict', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    const name = element().querySelector<HTMLInputElement>('[data-testid="topic-name"]');

    expect(name?.value).toBe('Whole Numbers');

    setInput('topic-name', 'Integers');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/topics/t1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({
      name: 'Integers',
      chapterId: 'ch1',
      order: 1,
      status: 'active',
    });
    request.flush(
      { message: 'A topic with this name already exists for this chapter.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="form-error"]')?.textContent).toContain(
      'already exists',
    );
  });

  it('saves an edited topic and refreshes the list', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="edit"]')?.click();
    fixture.detectChanges();

    setInput('topic-name', 'Advanced Numbers');
    setInput('topic-order', '5');
    submitForm();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/topics/t1' && candidate.method === 'PATCH',
    );

    request.flush({ ...TOPICS[0], name: 'Advanced Numbers', order: 5 });
    fixture.detectChanges();

    expect(element().textContent).toContain('Topic updated.');

    flushTopics({
      ...PAGE,
      items: [{ ...TOPICS[0], name: 'Advanced Numbers', order: 5 }, TOPICS[1]],
    });

    expect(rows()[0].textContent).toContain('Advanced Numbers');
  });

  it('deactivates and reactivates a topic', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/topics/t1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...TOPICS[0], status: 'inactive' });
    fixture.detectChanges();

    flushTopics({ ...PAGE, items: [{ ...TOPICS[0], status: 'inactive' }, TOPICS[1]] });

    expect(rows()[0].textContent).toContain('inactive');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a topic after an inline confirmation', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    rows()[0].querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete Whole Numbers?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/topics/t1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().textContent).toContain('Topic deleted.');

    flushTopics({ ...PAGE, items: [TOPICS[1]], total: 1 });

    expect(rows().length).toBe(1);
    expect(element().textContent).not.toContain('Delete Whole Numbers?');
  });

  it('shows deleted topics and restores them', () => {
    signIn('u1');
    flushChapterOptions();
    flushTopics();

    const toggle = element().querySelector<HTMLInputElement>('[data-testid="show-deleted"]');

    if (toggle === null) {
      throw new Error('Show deleted toggle not found');
    }

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = topicsRequest(true);

    expect(request.request.params.get('includeDeleted')).toBe('true');
    request.flush({ ...PAGE, items: [TOPICS[2]], total: 1 });
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].className).toContain('is-deleted');

    rows()[0].querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    const restore = httpMock.expectOne('/api/topics/t3/restore');

    expect(restore.request.method).toBe('POST');
    restore.flush({ ...TOPICS[2], deletedAt: null });
    fixture.detectChanges();

    expect(element().textContent).toContain('Topic restored.');

    flushTopics(PAGE, true);
  });

  it('filters by chapter and status, then searches after the debounce', async () => {
    flushChapterOptions();
    flushTopics();

    setSelect('chapter-filter', 'ch1');

    const chapterRequest = topicsRequest();

    expect(chapterRequest.request.params.get('chapterId')).toBe('ch1');
    chapterRequest.flush({ ...PAGE, items: [TOPICS[0]], total: 1 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-status="inactive"]')?.click();
    fixture.detectChanges();

    const statusRequest = topicsRequest();

    expect(statusRequest.request.params.get('chapterId')).toBe('ch1');
    expect(statusRequest.request.params.get('status')).toBe('inactive');
    statusRequest.flush({ ...PAGE, items: [TOPICS[1]], total: 1 });
    fixture.detectChanges();

    setInput('topic-search', 'whole');

    await new Promise((resolve) => setTimeout(resolve, 350));

    const searchRequest = topicsRequest();

    expect(searchRequest.request.params.get('search')).toBe('whole');
    searchRequest.flush({ ...PAGE, items: [TOPICS[0]], total: 1 });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Whole Numbers');
  });

  it('paginates through the directory', () => {
    flushChapterOptions();
    flushTopics();

    const size = element().querySelector<HTMLSelectElement>('[data-testid="page-size"]');

    if (size === null) {
      throw new Error('Page size select not found');
    }

    size.value = '25';
    size.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const sized = topicsRequest();

    expect(sized.request.params.get('pageSize')).toBe('25');
    sized.flush({ ...PAGE, pageSize: 25, total: 60 });
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-action="next-page"]')?.click();
    fixture.detectChanges();

    const next = topicsRequest();

    expect(next.request.params.get('page')).toBe('2');
    next.flush({ ...PAGE, page: 2, pageSize: 25, total: 60, items: [TOPICS[0]] });
    fixture.detectChanges();

    expect(element().textContent).toContain('Page 2 of 3');
  });

  it('asks for a chapter before creating topics', () => {
    signIn('u1');
    flushChapterOptions({ ...CHAPTER_OPTIONS_PAGE, items: [], total: 0 });
    flushTopics({ ...PAGE, items: [], total: 0 });

    element().querySelector<HTMLButtonElement>('[data-testid="add-topic"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Add at least one chapter');
    expect(element().querySelector('[data-testid="topic-form"]')).toBeNull();
  });

  it('hides management controls for non-admins', () => {
    signIn('u9', 'teacher');
    flushChapterOptions();
    flushTopics();

    expect(element().querySelector('[data-testid="add-topic"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="edit"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="delete"]')).toBeNull();
    expect(rows()[0].querySelector('[data-action="deactivate"]')).toBeNull();
  });

  it('shows an error state and retries the request', () => {
    flushChapterOptions();
    topicsRequest().flush(
      { message: 'Server exploded.' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushTopics();

    expect(rows().length).toBe(2);
  });
});
