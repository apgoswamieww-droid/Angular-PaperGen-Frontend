import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CreateRoleRequest,
  RoleAuditPage,
  RoleAuditQuery,
  RoleOption,
  RoleRecord,
  RolesPage,
  RolesQuery,
  UpdateRoleRequest,
} from './roles.types';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/roles';

  list(query: RolesQuery = {}): Observable<RolesPage> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
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

    return this.http.get<RolesPage>(this.baseUrl, { params });
  }

  options(): Observable<RoleOption[]> {
    return this.http.get<RoleOption[]>(`${this.baseUrl}/options`);
  }

  audit(query: RoleAuditQuery = {}): Observable<RoleAuditPage> {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', String(query.page));
    }

    if (query.pageSize !== undefined) {
      params = params.set('pageSize', String(query.pageSize));
    }

    return this.http.get<RoleAuditPage>(`${this.baseUrl}/audit`, { params });
  }

  create(payload: CreateRoleRequest): Observable<RoleRecord> {
    return this.http.post<RoleRecord>(this.baseUrl, payload);
  }

  update(key: string, payload: UpdateRoleRequest): Observable<RoleRecord> {
    return this.http.patch<RoleRecord>(`${this.baseUrl}/${key}`, payload);
  }

  remove(key: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${key}`);
  }
}
