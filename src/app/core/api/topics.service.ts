import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateTopicRequest,
  TopicRecord,
  TopicsPage,
  TopicsQuery,
  UpdateTopicRequest,
} from './topics.types';

@Injectable({ providedIn: 'root' })
export class TopicsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/topics';

  list(query: TopicsQuery = {}): Observable<TopicsPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.chapterId) {
      params = params.set('chapterId', query.chapterId);
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

    return this.http.get<TopicsPage>(this.baseUrl, { params });
  }

  create(payload: CreateTopicRequest): Observable<TopicRecord> {
    return this.http.post<TopicRecord>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateTopicRequest): Observable<TopicRecord> {
    return this.http.patch<TopicRecord>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: string): Observable<TopicRecord> {
    return this.http.post<TopicRecord>(`${this.baseUrl}/${id}/restore`, {});
  }
}
