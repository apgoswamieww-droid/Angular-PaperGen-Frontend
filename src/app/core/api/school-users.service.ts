import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateUserRequest,
  CreateUserResult,
  GeneratedCredentials,
  SchoolUserRecord,
  SchoolUsersPage,
  SchoolUsersQuery,
  SchoolUserStatus,
  UpdateUserRequest,
} from './school-users.types';

@Injectable({ providedIn: 'root' })
export class SchoolUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  list(query: SchoolUsersQuery = {}): Observable<SchoolUsersPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.role) {
      params = params.set('role', query.role);
    }

    if (query.status) {
      params = params.set('status', query.status);
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

    return this.http.get<SchoolUsersPage>(this.baseUrl, { params });
  }

  get(id: string): Observable<SchoolUserRecord> {
    return this.http.get<SchoolUserRecord>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateUserRequest): Observable<CreateUserResult> {
    return this.http.post<CreateUserResult>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateUserRequest): Observable<SchoolUserRecord> {
    return this.http.patch<SchoolUserRecord>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: SchoolUserStatus): Observable<SchoolUserRecord> {
    return this.http.patch<SchoolUserRecord>(`${this.baseUrl}/${id}/status`, { status });
  }

  resetPassword(id: string): Observable<GeneratedCredentials> {
    return this.http.post<GeneratedCredentials>(`${this.baseUrl}/${id}/reset-password`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
