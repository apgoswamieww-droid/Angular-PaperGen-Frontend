import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SchoolUsersService } from './school-users.service';
import type { CreateUserRequest, SchoolUserRecord, SchoolUsersPage } from './school-users.types';

const USER: SchoolUserRecord = {
  id: 'u1',
  name: 'Chetan Joshi',
  email: 'teacher@greenwood.test',
  phone: '+91 90000 00000',
  role: 'teacher',
  status: 'active',
  lastLoginAt: null,
  createdAt: '2026-10-18T10:00:00.000Z',
};

const PAGE: SchoolUsersPage = {
  items: [USER],
  total: 1,
  page: 1,
  pageSize: 10,
  summary: {
    totalUsers: 1,
    activeUsers: 1,
    suspendedUsers: 0,
    schoolAdmins: 0,
    teachers: 1,
    staff: 0,
    students: 0,
  },
};

describe('SchoolUsersService', () => {
  let service: SchoolUsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SchoolUsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists users with pagination defaults and no filters', async () => {
    const result = firstValueFrom(service.list());

    const request = httpMock.expectOne(
      (candidate) => candidate.url === '/api/users' && candidate.method === 'GET',
    );

    request.flush(PAGE);

    await expect(result).resolves.toEqual(PAGE);
  });

  it('sends search, filter, sort and pagination parameters', async () => {
    const result = firstValueFrom(
      service.list({
        search: 'chet',
        role: 'teacher',
        status: 'active',
        page: 2,
        pageSize: 25,
        sort: 'name',
        dir: 'asc',
      }),
    );

    const request = httpMock.expectOne((candidate) => candidate.url === '/api/users');

    expect(request.request.params.get('search')).toBe('chet');
    expect(request.request.params.get('role')).toBe('teacher');
    expect(request.request.params.get('status')).toBe('active');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('25');
    expect(request.request.params.get('sort')).toBe('name');
    expect(request.request.params.get('dir')).toBe('asc');
    request.flush(PAGE);

    await expect(result).resolves.toEqual(PAGE);
  });

  it('fetches a single user', async () => {
    const result = firstValueFrom(service.get('u1'));

    const request = httpMock.expectOne('/api/users/u1');
    expect(request.request.method).toBe('GET');
    request.flush(USER);

    await expect(result).resolves.toEqual(USER);
  });

  it('creates a user', async () => {
    const payload: CreateUserRequest = {
      name: 'Esha Kulkarni',
      email: 'esha@greenwood.test',
      phone: '',
      role: 'student',
    };
    const result = firstValueFrom(service.create(payload));

    const request = httpMock.expectOne('/api/users');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      user: { ...USER, role: 'student', email: payload.email },
      credentials: {
        email: payload.email,
        password: 'Abcd@1234wxyz',
        sent: true,
      },
    });

    await expect(result).resolves.toEqual({
      user: { ...USER, role: 'student', email: payload.email },
      credentials: {
        email: payload.email,
        password: 'Abcd@1234wxyz',
        sent: true,
      },
    });
  });

  it('updates a user', async () => {
    const result = firstValueFrom(service.update('u1', { name: 'Chetan J. Joshi' }));

    const request = httpMock.expectOne('/api/users/u1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ name: 'Chetan J. Joshi' });
    request.flush({ ...USER, name: 'Chetan J. Joshi' });

    await expect(result).resolves.toEqual({ ...USER, name: 'Chetan J. Joshi' });
  });

  it('updates a user status', async () => {
    const result = firstValueFrom(service.updateStatus('u1', 'suspended'));

    const request = httpMock.expectOne('/api/users/u1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'suspended' });
    request.flush({ ...USER, status: 'suspended' });

    await expect(result).resolves.toEqual({ ...USER, status: 'suspended' });
  });

  it('resets a user password', async () => {
    const result = firstValueFrom(service.resetPassword('u1'));

    const request = httpMock.expectOne('/api/users/u1/reset-password');
    expect(request.request.method).toBe('POST');
    request.flush({ email: USER.email, password: 'Zyxw@4321abcd', sent: false });

    await expect(result).resolves.toEqual({
      email: USER.email,
      password: 'Zyxw@4321abcd',
      sent: false,
    });
  });

  it('deletes a user', async () => {
    const result = firstValueFrom(service.remove('u1'));

    const request = httpMock.expectOne('/api/users/u1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(result).resolves.toBeNull();
  });
});
