import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { BloomLevelRecord } from '../../core/api/bloom-levels.types';
import type { ChapterRecord } from '../../core/api/chapters.types';
import type { DifficultyLevelRecord } from '../../core/api/difficulty-levels.types';
import type { MediumRecord } from '../../core/api/mediums.types';
import type { QuestionTypeRecord } from '../../core/api/question-types.types';
import type { QuestionRecord } from '../../core/api/questions.types';
import type { StandardRecord } from '../../core/api/standards.types';
import type { SubjectRecord } from '../../core/api/subjects.types';
import type { TopicRecord, TopicsPage } from '../../core/api/topics.types';
import { QuestionForm } from './question-form';

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
  {
    id: 'd2',
    name: 'Medium',
    order: 2,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'd3',
    name: 'Hard',
    order: 3,
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
  {
    id: 'b2',
    name: 'Apply',
    order: 2,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'b3',
    name: 'Evaluate',
    order: 3,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const QUESTION: QuestionRecord = {
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
  optionCount: 2,
  hasAnswer: true,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  deletedAt: null,
  options: [
    { key: 'A', text: '3', isCorrect: false },
    { key: 'B', text: '4', isCorrect: true },
  ],
  answer: '4',
  explanation: 'Two plus two equals four.',
  source: 'Number workbook',
  tags: ['Numbers'],
  createdBy: 'u1',
  updatedBy: 'u1',
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

describe('QuestionForm', () => {
  let fixture: ComponentFixture<QuestionForm>;
  let httpMock: HttpTestingController;
  let router: Router;
  let routeId: string | null;

  beforeEach(async () => {
    routeId = null;

    await TestBed.configureTestingModule({
      imports: [QuestionForm],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? routeId : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  function createForm(): void {
    fixture = TestBed.createComponent(QuestionForm);
    fixture.detectChanges();
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushMasters(): void {
    for (const [url, page] of MASTER_REQUESTS) {
      httpMock.expectOne((request) => request.url === url && request.method === 'GET').flush(page);
    }
  }

  function flushTopics(): void {
    httpMock
      .expectOne((request) => request.url === '/api/topics' && request.method === 'GET')
      .flush(TOPICS_PAGE);
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

  function submit(): void {
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function optionCheckbox(index: number): HTMLInputElement {
    const boxes = element().querySelectorAll<HTMLInputElement>(
      '.option-row input[type="checkbox"]',
    );
    const box = boxes[index];

    if (box === undefined) {
      throw new Error(`Option checkbox ${index} not found`);
    }

    return box;
  }

  it('prefills defaults, adds options and creates a question', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    createForm();

    expect(element().textContent).toContain('Loading question');

    flushMasters();
    flushTopics();

    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="question-medium"]')?.value,
    ).toBe('med1');
    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="question-standard"]')?.value,
    ).toBe('s1');
    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="question-chapter"]')?.value,
    ).toBe('ch1');
    expect(element().querySelector<HTMLInputElement>('[data-testid="question-marks"]')?.value).toBe(
      '1',
    );

    setInput('question-text', 'What is 2 + 2?');
    setInput('question-tags', 'numbers, Numbers, arithmetic');

    element().querySelector<HTMLButtonElement>('[data-testid="add-option"]')?.click();
    fixture.detectChanges();
    element().querySelector<HTMLButtonElement>('[data-testid="add-option"]')?.click();
    fixture.detectChanges();

    setInput('option-text-0', '3');
    setInput('option-text-1', '4');
    optionCheckbox(1).click();
    fixture.detectChanges();

    submit();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/questions' && candidate.method === 'POST',
    );

    expect(request.request.body).toEqual({
      text: 'What is 2 + 2?',
      chapterId: 'ch1',
      topicId: null,
      questionTypeId: 'qt1',
      difficultyLevelId: 'd1',
      bloomLevelId: 'b1',
      options: [
        { key: 'A', text: '3', isCorrect: false },
        { key: 'B', text: '4', isCorrect: true },
      ],
      answer: '',
      explanation: '',
      source: '',
      tags: ['numbers', 'arithmetic'],
      marks: 1,
      status: 'active',
    });

    request.flush({ ...QUESTION, id: 'q9' });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/questions', 'q9'], {
      state: { notice: 'Question created.' },
    });
  });

  it('loads an existing question and saves the changed fields', () => {
    routeId = 'q1';

    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    createForm();

    flushMasters();

    httpMock
      .expectOne((request) => request.url === '/api/questions/q1' && request.method === 'GET')
      .flush(QUESTION);
    fixture.detectChanges();
    flushTopics();

    expect(
      element().querySelector<HTMLTextAreaElement>('[data-testid="question-text"]')?.value,
    ).toBe('What is 2 + 2?');
    expect(element().querySelectorAll('.option-row').length).toBe(2);
    expect(element().querySelector<HTMLInputElement>('[data-testid="question-tags"]')?.value).toBe(
      'Numbers',
    );

    setInput('question-text', 'What is 3 + 3?');

    submit();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/questions/q1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({
      text: 'What is 3 + 3?',
      chapterId: 'ch1',
      topicId: 't1',
      questionTypeId: 'qt1',
      difficultyLevelId: 'd1',
      bloomLevelId: 'b1',
      options: [
        { key: 'A', text: '3', isCorrect: false },
        { key: 'B', text: '4', isCorrect: true },
      ],
      answer: '4',
      explanation: 'Two plus two equals four.',
      source: 'Number workbook',
      tags: ['Numbers'],
      marks: 1,
      status: 'active',
    });

    request.flush({ ...QUESTION, text: 'What is 3 + 3?' });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/questions', 'q1'], {
      state: { notice: 'Question updated.' },
    });
  });

  it('blocks active questions without an answer key', () => {
    createForm();
    flushMasters();
    flushTopics();

    setInput('question-text', 'Explain the water cycle.');

    submit();

    const error = element().querySelector('[data-testid="save-error"]');

    expect(error?.textContent).toContain('Active questions need an answer key');

    httpMock.expectNone((request) => request.url === '/api/questions' && request.method === 'POST');
  });

  it('auto-selects Bloom from Difficulty and renders the live math preview', () => {
    createForm();
    flushMasters();
    flushTopics();

    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="question-bloom"]')?.value,
    ).toBe('b1');

    setSelect('question-difficulty', 'd2');

    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="question-bloom"]')?.value,
    ).toBe('b2');

    setSelect('question-difficulty', 'd3');

    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="question-bloom"]')?.value,
    ).toBe('b3');

    setInput('question-text', 'Solve $x^2 = 4$.');

    const preview = element().querySelector('[data-testid="question-preview"]');

    expect(preview?.textContent).toContain('Solve');
    expect(preview?.querySelector('.katex')).not.toBeNull();
  });

  it('inserts LaTeX from the equation dialog', () => {
    createForm();
    flushMasters();
    flushTopics();

    element().querySelector<HTMLButtonElement>('[data-testid="insert-equation"]')?.click();
    fixture.detectChanges();

    setInput('equation-latex', '\\frac{x}{2}');

    expect(element().querySelector('[data-testid="equation-preview"] .katex')).not.toBeNull();

    element().querySelector<HTMLButtonElement>('[data-testid="insert-equation-confirm"]')?.click();
    fixture.detectChanges();

    expect(
      element().querySelector<HTMLTextAreaElement>('[data-testid="question-text"]')?.value,
    ).toContain('$\\frac{x}{2}$');
  });

  it('inserts equations into a focused option without changing the question', () => {
    createForm();
    flushMasters();
    flushTopics();

    element().querySelector<HTMLButtonElement>('[data-testid="add-option"]')?.click();
    fixture.detectChanges();

    const option = element().querySelector<HTMLInputElement>('[data-testid="option-text-0"]');

    option?.focus();
    element().querySelector<HTMLButtonElement>('[data-testid="option-equation-0"]')?.click();
    fixture.detectChanges();

    setInput('equation-latex', '\\sqrt{3}');
    element().querySelector<HTMLButtonElement>('[data-testid="insert-equation-confirm"]')?.click();
    fixture.detectChanges();

    expect(option?.value).toContain('$\\sqrt{3}$');
    expect(
      element().querySelector<HTMLTextAreaElement>('[data-testid="question-text"]')?.value,
    ).toBe('');
  });

  it('defaults screenshot OCR to English and Gujarati', () => {
    createForm();
    flushMasters();
    flushTopics();

    expect(element().querySelector<HTMLSelectElement>('[data-testid="ocr-language"]')?.value).toBe(
      'eng+guj',
    );
  });
});
