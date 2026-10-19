import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SessionClient } from './session-client';

@Injectable({ providedIn: 'root' })
export class AdminAuthService extends SessionClient {
  constructor() {
    super(inject(HttpClient), '/api/admin/auth');
  }
}
