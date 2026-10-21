import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateExamTypeRequest,
  ExamTypeRecord,
  ExamTypesPage,
  ExamTypesQuery,
  UpdateExamTypeRequest,
} from './exam-types.types';

@Injectable({ providedIn: 'root' })
export class ExamTypesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/exam-types';

  list(query: ExamTypesQuery = {}): Observable<ExamTypesPage> {
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

    return this.http.get<ExamTypesPage>(this.baseUrl, { params });
  }

  create(payload: CreateExamTypeRequest): Observable<ExamTypeRecord> {
    return this.http.post<ExamTypeRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateExamTypeRequest): Observable<ExamTypeRecord> {
    return this.http.patch<ExamTypeRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<ExamTypeRecord> {
    return this.http.post<ExamTypeRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
