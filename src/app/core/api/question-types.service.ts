import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateQuestionTypeRequest,
  QuestionTypeRecord,
  QuestionTypesPage,
  QuestionTypesQuery,
  UpdateQuestionTypeRequest,
} from './question-types.types';

@Injectable({ providedIn: 'root' })
export class QuestionTypesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/question-types';

  list(query: QuestionTypesQuery = {}): Observable<QuestionTypesPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
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

    return this.http.get<QuestionTypesPage>(this.baseUrl, { params });
  }

  create(payload: CreateQuestionTypeRequest): Observable<QuestionTypeRecord> {
    return this.http.post<QuestionTypeRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateQuestionTypeRequest): Observable<QuestionTypeRecord> {
    return this.http.patch<QuestionTypeRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<QuestionTypeRecord> {
    return this.http.post<QuestionTypeRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
