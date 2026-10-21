import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ChapterRecord,
  ChaptersPage,
  ChaptersQuery,
  CreateChapterRequest,
  UpdateChapterRequest,
} from './chapters.types';

@Injectable({ providedIn: 'root' })
export class ChaptersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/chapters';

  list(query: ChaptersQuery = {}): Observable<ChaptersPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.subjectId) {
      params = params.set('subjectId', query.subjectId);
    }

    if (query.referenceType) {
      params = params.set('referenceType', query.referenceType);
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

    return this.http.get<ChaptersPage>(this.baseUrl, { params });
  }

  create(payload: CreateChapterRequest): Observable<ChapterRecord> {
    return this.http.post<ChapterRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateChapterRequest): Observable<ChapterRecord> {
    return this.http.patch<ChapterRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<ChapterRecord> {
    return this.http.post<ChapterRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
