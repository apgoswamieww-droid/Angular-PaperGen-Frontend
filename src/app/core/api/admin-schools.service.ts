import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  AdminSchoolDetailResult,
  AdminSchoolSummary,
  CreateSchoolRequest,
  CreateSchoolResult,
  ResendInviteResult,
  ResetPasswordSendResult,
  TenantStatus,
  UpdateSchoolBillingRequest,
  UpdateSchoolRequest,
} from './admin-schools.types';

@Injectable({ providedIn: 'root' })
export class AdminSchoolsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/schools';

  list(): Observable<AdminSchoolSummary[]> {
    return this.http.get<AdminSchoolSummary[]>(this.baseUrl);
  }

  get(id: string): Observable<AdminSchoolDetailResult> {
    return this.http.get<AdminSchoolDetailResult>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateSchoolRequest): Observable<CreateSchoolResult> {
    return this.http.post<CreateSchoolResult>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateSchoolRequest): Observable<AdminSchoolSummary> {
    return this.http.patch<AdminSchoolSummary>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: TenantStatus): Observable<AdminSchoolSummary> {
    return this.http.patch<AdminSchoolSummary>(`${this.baseUrl}/${id}/status`, { status });
  }

  updateBilling(id: string, payload: UpdateSchoolBillingRequest): Observable<AdminSchoolSummary> {
    return this.http.patch<AdminSchoolSummary>(`${this.baseUrl}/${id}/billing`, payload);
  }

  resendInvite(id: string): Observable<ResendInviteResult> {
    return this.http.post<ResendInviteResult>(`${this.baseUrl}/${id}/resend-invite`, {});
  }

  resetPassword(id: string): Observable<ResetPasswordSendResult> {
    return this.http.post<ResetPasswordSendResult>(`${this.baseUrl}/${id}/reset-password`, {});
  }
}
