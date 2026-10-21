import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { BloomLevelRecord } from '../../core/api/bloom-levels.types';
import type { ChapterRecord } from '../../core/api/chapters.types';
import type { DifficultyLevelRecord } from '../../core/api/difficulty-levels.types';
import type { MediumRecord } from '../../core/api/mediums.types';
import type { QuestionTypeRecord } from '../../core/api/question-types.types';
import type { QuestionListItem, QuestionsPage } from '../../core/api/questions.types';
import type { StandardRecord } from '../../core/api/standards.types';
import type { SubjectRecord } from '../../core/api/subjects.types';
import type { TopicRecord, TopicsPage } from '../../core/api/topics.types';
import { AuthService } from '../../core/auth/auth.service';
import { Questions } from './questions';

const MEDIUMS: MediumRecord[] = [
  {
    id: 'med1',
    name: 'English',
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

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
];

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
];

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
];

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
];

const QUESTION_TYPES: QuestionTypeRecord[] = [
  {
    id: 'qt1',
    name: 'Multiple Choice',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const DIFFICULTIES: DifficultyLevelRecord[] = [
  {
    id: 'd1',
    name: 'Easy',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const BLOOMS: BloomLevelRecord[] = [
  {
    id: 'b1',
    name: 'Remember',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const QUESTIONS: QuestionListItem[] = [
  {
    id: 'q1',
    text: 'What is 2 + 2?',
    marks: 1,
    status: 'active',
    chapterId: 'ch1',
    chapterName: 'Number System',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    topicId: 't1',
    topicName: 'Whole Numbers',
    questionTypeId: 'qt1',
    questionTypeName: 'Multiple Choice',
    difficultyLevelId: 'd1',
    difficultyLevelName: 'Easy',
    bloomLevelId: 'b1',
    bloomLevelName: 'Remember',
    optionCount: 4,
    hasAnswer: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'q2',
    text: 'Explain the water cycle.',
    marks: 5,
    status: 'inactive',
    chapterId: 'ch1',
    chapterName: 'Number System',
    subjectId: 'sub1',
    subjectName: 'Mathematics',
    standardId: 's1',
    standardName: 'Standard 1',
    mediumId: 'med1',
    mediumName: 'English',
    topicId: null,
    topicName: null,
    questionTypeId: 'qt1',
    questionTypeName: 'Multiple Choice',
    difficultyLevelId: 'd1',
    difficultyLevelName: 'Easy',
    bloomLevelId: null,
    bloomLevelName: null,
    optionCount: 0,
    hasAnswer: false,
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
  },
];

const PAGE: QuestionsPage = {
  items: QUESTIONS,
  total: 2,
  page: 1,
  pageSize: 10,
  summary: { total: 2, active: 1, inactive: 1, deleted: 0 },
};

const TOPICS_PAGE: TopicsPage = {
  items: TOPICS,
  total: 1,
  page: 1,
  pageSize: 50,
  summary: { active: 1, inactive: 0, deleted: 0 },
};

function masterPage<T extends { status: string }>(items: T[]) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 50,
    summary: {
      active: items.filter((item) => item.status === 'active').length,
      inactive: items.filter((item) => item.status === 'inactive').length,
      deleted: 0,
    },
  };
}

const MASTER_REQUESTS: Array<[string, object]> = [
  ['/api/mediums', masterPage(MEDIUMS)],
  ['/api/standards', masterPage(STANDARDS)],
  ['/api/subjects', masterPage(SUBJECTS)],
  ['/api/chapters', masterPage(CHAPTERS)],
  ['/api/question-types', masterPage(QUESTION_TYPES)],
  ['/api/difficulty-levels', masterPage(DIFFICULTIES)],
  ['/api/bloom-levels', masterPage(BLOOMS)],
];

describe('Questions', () => {
  let fixture: ComponentFixture<Questions>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Questions],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Questions);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function flushMasters(): void {
    for (const [url, page] of MASTER_REQUESTS) {
      httpMock.expectOne((request) => request.url === url && request.method === 'GET').flush(page);
    }

    fixture.detectChanges();
  }

  function questionsRequest(): ReturnType<HttpTestingController['expectOne']> {
    return httpMock.expectOne(
      (request) => request.url === '/api/questions' && request.method === 'GET',
    );
  }

  function flushQuestions(page: QuestionsPage = PAGE): void {
    questionsRequest().flush(page);
    fixture.detectChanges();
  }

  function signIn(role = 'teacher'): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: {
        id: 'u1',
        name: 'Asha Deshmukh',
        email: 'teacher@greenwood.test',
        role,
      },
    });
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

  it('shows the directory, lineage and summary counts', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading questions');

    flushMasters();
    flushQuestions();

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('What is 2 + 2?');
    expect(rows()[0].textContent).toContain('Whole Numbers');
    expect(rows()[0].textContent).toContain('Answer key ready');
    expect(rows()[1].textContent).toContain('Explain the water cycle.');
    expect(rows()[1].textContent).toContain('No answer key');

    const stats = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(stats).toEqual(['2', '1', '1', '0']);
  });

  it('shows management actions only with the manage permission', () => {
    signIn('staff');
    flushMasters();
    flushQuestions();

    expect(element().querySelector('[data-testid="add-question"]')).toBeNull();
    expect(element().querySelector('[data-action="edit"]')).toBeNull();

    signIn('teacher');
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="add-question"]')).not.toBeNull();
    expect(element().querySelector('[data-action="edit"]')).not.toBeNull();
  });

  it('filters by curriculum and loads topics for the selected chapter', () => {
    signIn();
    flushMasters();
    flushQuestions();

    setSelect('medium-filter', 'med1');

    let request = questionsRequest();

    expect(request.request.params.get('mediumId')).toBe('med1');
    request.flush(PAGE);
    fixture.detectChanges();

    setSelect('standard-filter', 's1');
    request = questionsRequest();
    expect(request.request.params.get('standardId')).toBe('s1');
    request.flush(PAGE);
    fixture.detectChanges();

    setSelect('chapter-filter', 'ch1');

    const topicsRequest = httpMock.expectOne(
      (candidate) =>
        candidate.url === '/api/topics' &&
        candidate.method === 'GET' &&
        candidate.params.get('chapterId') === 'ch1',
    );

    request = questionsRequest();
    expect(request.request.params.get('chapterId')).toBe('ch1');
    request.flush(PAGE);
    topicsRequest.flush(TOPICS_PAGE);
    fixture.detectChanges();

    setSelect('topic-filter', 't1');
    request = questionsRequest();
    expect(request.request.params.get('topicId')).toBe('t1');
    request.flush(PAGE);
    fixture.detectChanges();
  });

  it('deactivates a question and reloads the list', () => {
    signIn();
    flushMasters();
    flushQuestions();

    element().querySelector<HTMLButtonElement>('[data-action="deactivate"]')?.click();
    fixture.detectChanges();

    const update = httpMock.expectOne(
      (request) => request.url === '/api/questions/q1' && request.method === 'PATCH',
    );

    expect(update.request.body).toEqual({ status: 'inactive' });
    update.flush({ ...QUESTIONS[0], status: 'inactive' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Question deactivated.');

    flushQuestions({
      ...PAGE,
      items: [{ ...QUESTIONS[0], status: 'inactive' }, QUESTIONS[1]],
      summary: { total: 2, active: 0, inactive: 2, deleted: 0 },
    });
  });

  it('asks for confirmation before deleting and restores a deleted question', () => {
    signIn();
    flushMasters();
    flushQuestions();

    element().querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete this question?');

    element().querySelector<HTMLButtonElement>('[data-action="confirm-delete"]')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne((request) => request.url === '/api/questions/q1' && request.method === 'DELETE')
      .flush({});

    flushQuestions({
      ...PAGE,
      items: [{ ...QUESTIONS[0], deletedAt: '2026-10-04T10:00:00.000Z' }],
      total: 1,
      summary: { total: 1, active: 0, inactive: 0, deleted: 1 },
    });

    expect(element().textContent).toContain('Question deleted.');
    expect(element().querySelector('[data-action="restore"]')).not.toBeNull();

    element().querySelector<HTMLButtonElement>('[data-action="restore"]')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne(
        (request) => request.url === '/api/questions/q1/restore' && request.method === 'POST',
      )
      .flush({ ...QUESTIONS[0] });

    flushQuestions();

    expect(element().textContent).toContain('Question restored.');
  });
});
