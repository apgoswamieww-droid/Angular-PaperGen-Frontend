import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { QuestionRecord } from '../../core/api/questions.types';
import { AuthService } from '../../core/auth/auth.service';
import { QuestionDetail } from './question-detail';

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
  updatedAt: '2026-10-02T10:00:00.000Z',
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

describe('QuestionDetail', () => {
  let fixture: ComponentFixture<QuestionDetail>;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'q1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
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
  }

  function createDetail(): void {
    fixture = TestBed.createComponent(QuestionDetail);
    fixture.detectChanges();
  }

  function flushQuestion(question: QuestionRecord = QUESTION): void {
    httpMock
      .expectOne((request) => request.url === '/api/questions/q1' && request.method === 'GET')
      .flush(question);
    fixture.detectChanges();
  }

  it('renders the prompt, placement, options and answer key', () => {
    signIn();
    createDetail();

    expect(element().textContent).toContain('Loading question');

    flushQuestion();

    expect(element().textContent).toContain('What is 2 + 2?');
    expect(element().textContent).toContain('Number System / Whole Numbers');
    expect(element().textContent).toContain('English');
    expect(element().textContent).toContain('Standard 1');
    expect(element().textContent).toContain('Two plus two equals four.');
    expect(element().textContent).toContain('1 correct');
    expect(element().querySelector('[data-testid="edit-question"]')).not.toBeNull();
  });

  it('hides management actions for read-only roles', () => {
    signIn('staff');
    createDetail();
    flushQuestion();

    expect(element().querySelector('[data-testid="edit-question"]')).toBeNull();
    expect(element().querySelector('[data-testid="delete-question"]')).toBeNull();
  });

  it('deactivates the question', () => {
    signIn();
    createDetail();
    flushQuestion();

    element().querySelector<HTMLButtonElement>('[data-testid="toggle-status"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/questions/q1' && candidate.method === 'PATCH',
    );

    expect(request.request.body).toEqual({ status: 'inactive' });
    request.flush({ ...QUESTION, status: 'inactive' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Question deactivated.');
  });

  it('deletes after confirmation and returns to the list', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    signIn();
    createDetail();
    flushQuestion();

    element().querySelector<HTMLButtonElement>('[data-testid="delete-question"]')?.click();
    fixture.detectChanges();

    expect(element().textContent).toContain('Delete this question?');

    element().querySelector<HTMLButtonElement>('[data-testid="confirm-delete-question"]')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne((request) => request.url === '/api/questions/q1' && request.method === 'DELETE')
      .flush({});

    expect(navigate).toHaveBeenCalledWith(['/questions'], {
      state: { notice: 'Question deleted.' },
    });
  });

  it('restores a deleted question', () => {
    signIn();
    createDetail();
    flushQuestion({ ...QUESTION, deletedAt: '2026-10-04T10:00:00.000Z' });

    expect(element().textContent).toContain('This question is in the recycle bin.');

    element().querySelector<HTMLButtonElement>('[data-testid="restore-question"]')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne(
        (request) => request.url === '/api/questions/q1/restore' && request.method === 'POST',
      )
      .flush({ ...QUESTION });
    fixture.detectChanges();

    expect(element().textContent).toContain('Question restored.');
  });
});
