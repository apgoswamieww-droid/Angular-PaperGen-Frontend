import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateDifficultyLevelRequest,
  DifficultyLevelRecord,
  DifficultyLevelsPage,
  DifficultyLevelsQuery,
  UpdateDifficultyLevelRequest,
} from './difficulty-levels.types';

@Injectable({ providedIn: 'root' })
export class DifficultyLevelsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/difficulty-levels';

  list(query: DifficultyLevelsQuery = {}): Observable<DifficultyLevelsPage> {
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

    return this.http.get<DifficultyLevelsPage>(this.baseUrl, { params });
  }

  create(payload: CreateDifficultyLevelRequest): Observable<DifficultyLevelRecord> {
    return this.http.post<DifficultyLevelRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateDifficultyLevelRequest): Observable<DifficultyLevelRecord> {
    return this.http.patch<DifficultyLevelRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<DifficultyLevelRecord> {
    return this.http.post<DifficultyLevelRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
