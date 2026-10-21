import { HttpClient } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { catchError, finalize, map, of, shareReplay, tap, type Observable } from 'rxjs';
import type {
  ChangePasswordRequest,
  Credentials,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  SessionResponse,
  SessionUser,
} from './auth.types';

/**
 * Handles one authentication scope (school users or platform admins). The
 * access token lives in memory only; the refresh token stays in an httpOnly
 * cookie managed by the API.
 */
export class SessionClient {
  private readonly accessToken = signal<string | null>(null);
  private readonly currentUser = signal<SessionUser | null>(null);
  private refreshInFlight: Observable<SessionUser> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly basePath: string,
  ) {}

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  get token(): string | null {
    return this.accessToken();
  }

  login(credentials: Credentials): Observable<SessionUser> {
    return this.http
      .post<SessionResponse>(`${this.basePath}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
      );
  }

  /** Single-flight: concurrent callers share one refresh request. */
  refresh(): Observable<SessionUser> {
    this.refreshInFlight ??= this.http
      .post<SessionResponse>(`${this.basePath}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshInFlight;
  }

  /** Restores a session from the refresh cookie; resolves quietly on failure. */
  restore(): Observable<void> {
    return this.refresh().pipe(
      map(() => undefined),
      catchError(() => {
        this.clear();
        return of(undefined);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.basePath}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.clear()),
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.basePath}/forgot-password`, { email });
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.basePath}/reset-password`, payload);
  }

  /**
   * Rotates the signed-in user's password. The API revokes every other
   * session and returns a fresh one for the current browser.
   */
  changePassword(payload: ChangePasswordRequest): Observable<SessionUser> {
    return this.http
      .post<SessionResponse>(`${this.basePath}/change-password`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
      );
  }

  clear(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  private applySession(response: SessionResponse): void {
    this.accessToken.set(response.accessToken);
    this.currentUser.set(response.user);
  }
}
