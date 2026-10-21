import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateBloomLevelRequest,
  BloomLevelRecord,
  BloomLevelsPage,
  BloomLevelsQuery,
  UpdateBloomLevelRequest,
} from './bloom-levels.types';

@Injectable({ providedIn: 'root' })
export class BloomLevelsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/bloom-levels';

  list(query: BloomLevelsQuery = {}): Observable<BloomLevelsPage> {
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

    return this.http.get<BloomLevelsPage>(this.baseUrl, { params });
  }

  create(payload: CreateBloomLevelRequest): Observable<BloomLevelRecord> {
    return this.http.post<BloomLevelRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateBloomLevelRequest): Observable<BloomLevelRecord> {
    return this.http.patch<BloomLevelRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<BloomLevelRecord> {
    return this.http.post<BloomLevelRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
