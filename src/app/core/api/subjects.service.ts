import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateSubjectRequest,
  SubjectRecord,
  SubjectsPage,
  SubjectsQuery,
  UpdateSubjectRequest,
} from './subjects.types';

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/subjects';

  list(query: SubjectsQuery = {}): Observable<SubjectsPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.standardId) {
      params = params.set('standardId', query.standardId);
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

    return this.http.get<SubjectsPage>(this.baseUrl, { params });
  }

  create(payload: CreateSubjectRequest): Observable<SubjectRecord> {
    return this.http.post<SubjectRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateSubjectRequest): Observable<SubjectRecord> {
    return this.http.patch<SubjectRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<SubjectRecord> {
    return this.http.post<SubjectRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
