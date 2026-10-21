import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { QuestionsService } from './questions.service';
import type { CreateQuestionRequest, QuestionRecord, QuestionsPage } from './questions.types';

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
  answer: '',
  explanation: '',
  source: '',
  tags: ['Numbers'],
  createdBy: 'u1',
  updatedBy: 'u1',
};

const PAGE: QuestionsPage = {
  items: [QUESTION],
  total: 1,
  page: 1,
  pageSize: 10,
  summary: { total: 1, active: 1, inactive: 0, deleted: 0 },
};

describe('QuestionsService', () => {
  let service: QuestionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(QuestionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists questions with filters, sort and pagination', async () => {
    const result = firstValueFrom(
      service.list({
        search: 'fraction',
        mediumId: 'med1',
        standardId: 's1',
        subjectId: 'sub1',
        chapterId: 'ch1',
        topicId: 't1',
        questionTypeId: 'qt1',
        difficultyLevelId: 'd1',
        bloomLevelId: 'b1',
        status: 'inactive',
        includeDeleted: true,
        page: 2,
        pageSize: 25,
        sort: 'marks',
        dir: 'desc',
      }),
    );

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/questions' && candidate.method === 'GET',
    );

    expect(request.request.params.get('search')).toBe('fraction');
    expect(request.request.params.get('mediumId')).toBe('med1');
    expect(request.request.params.get('standardId')).toBe('s1');
    expect(request.request.params.get('subjectId')).toBe('sub1');
    expect(request.request.params.get('chapterId')).toBe('ch1');
    expect(request.request.params.get('topicId')).toBe('t1');
    expect(request.request.params.get('questionTypeId')).toBe('qt1');
    expect(request.request.params.get('difficultyLevelId')).toBe('d1');
    expect(request.request.params.get('bloomLevelId')).toBe('b1');
    expect(request.request.params.get('status')).toBe('inactive');
    expect(request.request.params.get('includeDeleted')).toBe('true');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('25');
    expect(request.request.params.get('sort')).toBe('marks');
    expect(request.request.params.get('dir')).toBe('desc');
    request.flush(PAGE);

    await expect(result).resolves.toEqual(PAGE);
  });

  it('omits blank filters', async () => {
    const result = firstValueFrom(service.list({ chapterId: '', status: '' }));

    const request = httpMock.expectOne('/api/questions');

    expect(request.request.params.keys()).toEqual([]);
    request.flush(PAGE);

    await expect(result).resolves.toEqual(PAGE);
  });

  it('fetches a question', async () => {
    const result = firstValueFrom(service.get('q1'));

    const request = httpMock.expectOne('/api/questions/q1');

    expect(request.request.method).toBe('GET');
    request.flush(QUESTION);

    await expect(result).resolves.toEqual(QUESTION);
  });

  it('creates a question', async () => {
    const payload: CreateQuestionRequest = {
      text: 'What is 2 + 2?',
      chapterId: 'ch1',
      topicId: null,
      questionTypeId: 'qt1',
      difficultyLevelId: 'd1',
      bloomLevelId: null,
      options: [
        { key: 'A', text: '3', isCorrect: false },
        { key: 'B', text: '4', isCorrect: true },
      ],
      answer: '',
      explanation: '',
      source: '',
      tags: ['Numbers'],
      marks: 1,
      status: 'active',
    };
    const result = firstValueFrom(service.create(payload));

    const request = httpMock.expectOne('/api/questions');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(QUESTION);

    await expect(result).resolves.toEqual(QUESTION);
  });

  it('updates a question', async () => {
    const result = firstValueFrom(service.update('q1', { marks: 2 }));

    const request = httpMock.expectOne('/api/questions/q1');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ marks: 2 });
    request.flush({ ...QUESTION, marks: 2 });

    await expect(result).resolves.toEqual({ ...QUESTION, marks: 2 });
  });

  it('deletes and restores a question', async () => {
    const removed = firstValueFrom(service.remove('q1'));

    const removeRequest = httpMock.expectOne('/api/questions/q1');

    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush(null);
    await expect(removed).resolves.toBeNull();

    const restored = firstValueFrom(service.restore('q1'));

    const restoreRequest = httpMock.expectOne('/api/questions/q1/restore');

    expect(restoreRequest.request.method).toBe('POST');
    restoreRequest.flush(QUESTION);
    await expect(restored).resolves.toEqual(QUESTION);
  });
});
