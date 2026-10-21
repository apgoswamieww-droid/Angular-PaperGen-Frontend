import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { hasPermission, type Permission } from './permissions';
import { SessionClient } from './session-client';

@Injectable({ providedIn: 'root' })
export class AuthService extends SessionClient {
  constructor() {
    super(inject(HttpClient), '/api/auth');
  }

  readonly passwordExpired = computed(() => this.user()?.passwordExpired === true);

  can(permission: Permission): boolean {
    return hasPermission(this.user(), permission);
  }
}
