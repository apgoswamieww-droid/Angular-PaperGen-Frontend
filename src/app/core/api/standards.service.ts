import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateStandardRequest,
  StandardRecord,
  StandardsPage,
  StandardsQuery,
  UpdateStandardRequest,
} from './standards.types';

@Injectable({ providedIn: 'root' })
export class StandardsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/standards';

  list(query: StandardsQuery = {}): Observable<StandardsPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.mediumId) {
      params = params.set('mediumId', query.mediumId);
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

    return this.http.get<StandardsPage>(this.baseUrl, { params });
  }

  create(payload: CreateStandardRequest): Observable<StandardRecord> {
    return this.http.post<StandardRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateStandardRequest): Observable<StandardRecord> {
    return this.http.patch<StandardRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<StandardRecord> {
    return this.http.post<StandardRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
