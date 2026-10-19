import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AdminPlan, CreatePlanRequest, UpdatePlanRequest } from './admin-plans.types';

@Injectable({ providedIn: 'root' })
export class AdminPlansService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/plans';

  list(): Observable<AdminPlan[]> {
    return this.http.get<AdminPlan[]>(this.baseUrl);
  }

  get(code: string): Observable<AdminPlan> {
    return this.http.get<AdminPlan>(`${this.baseUrl}/${code}`);
  }

  create(payload: CreatePlanRequest): Observable<AdminPlan> {
    return this.http.post<AdminPlan>(this.baseUrl, payload);
  }

  update(code: string, payload: UpdatePlanRequest): Observable<AdminPlan> {
    return this.http.patch<AdminPlan>(`${this.baseUrl}/${code}`, payload);
  }

  remove(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${code}`);
  }
}
