import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateQuestionRequest,
  QuestionRecord,
  QuestionsPage,
  QuestionsQuery,
  UpdateQuestionRequest,
} from './questions.types';

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/questions';

  list(query: QuestionsQuery = {}): Observable<QuestionsPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.mediumId) {
      params = params.set('mediumId', query.mediumId);
    }

    if (query.standardId) {
      params = params.set('standardId', query.standardId);
    }

    if (query.subjectId) {
      params = params.set('subjectId', query.subjectId);
    }

    if (query.chapterId) {
      params = params.set('chapterId', query.chapterId);
    }

    if (query.topicId) {
      params = params.set('topicId', query.topicId);
    }

    if (query.questionTypeId) {
      params = params.set('questionTypeId', query.questionTypeId);
    }

    if (query.difficultyLevelId) {
      params = params.set('difficultyLevelId', query.difficultyLevelId);
    }

    if (query.bloomLevelId) {
      params = params.set('bloomLevelId', query.bloomLevelId);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }

    if (query.page !== undefined) {
      params = params.set('page', String(query.page));
    }

    if (query.pageSize !== undefined) {
      params = params.set('pageSize', String(query.pageSize));
    }

    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    if (query.dir) {
      params = params.set('dir', query.dir);
    }

    return this.http.get<QuestionsPage>(this.baseUrl, { params });
  }

  get(id: string): Observable<QuestionRecord> {
    return this.http.get<QuestionRecord>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateQuestionRequest): Observable<QuestionRecord> {
    return this.http.post<QuestionRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateQuestionRequest): Observable<QuestionRecord> {
    return this.http.patch<QuestionRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<QuestionRecord> {
    return this.http.post<QuestionRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
