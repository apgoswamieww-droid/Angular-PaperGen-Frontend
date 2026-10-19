import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateMediumRequest,
  MediumRecord,
  MediumsPage,
  MediumsQuery,
  UpdateMediumRequest,
} from './mediums.types';

@Injectable({ providedIn: 'root' })
export class MediumsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/mediums';

  list(query: MediumsQuery = {}): Observable<MediumsPage> {
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

    return this.http.get<MediumsPage>(this.baseUrl, { params });
  }

  create(payload: CreateMediumRequest): Observable<MediumRecord> {
    return this.http.post<MediumRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateMediumRequest): Observable<MediumRecord> {
    return this.http.patch<MediumRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<MediumRecord> {
    return this.http.post<MediumRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
