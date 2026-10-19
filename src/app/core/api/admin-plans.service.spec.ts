import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AdminPlansService } from './admin-plans.service';
import type { AdminPlan, CreatePlanRequest } from './admin-plans.types';

const PLAN: AdminPlan = {
  code: 'growth',
  name: 'Growth',
  tagline: 'For growing schools.',
  monthlyPrice: 8999,
  annualPrice: 89990,
  features: ['Up to 1,200 students'],
  limits: { maxStudents: 1200, maxTeachers: null, maxTotalUsers: null },
  featured: true,
  active: true,
  sortOrder: 2,
  tenantCount: 1,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describe('AdminPlansService', () => {
  let service: AdminPlansService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminPlansService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists plans', async () => {
    const result = firstValueFrom(service.list());

    const request = httpMock.expectOne('/api/admin/plans');
    expect(request.request.method).toBe('GET');
    request.flush([PLAN]);

    await expect(result).resolves.toEqual([PLAN]);
  });

  it('fetches a single plan', async () => {
    const result = firstValueFrom(service.get('growth'));

    const request = httpMock.expectOne('/api/admin/plans/growth');
    expect(request.request.method).toBe('GET');
    request.flush(PLAN);

    await expect(result).resolves.toEqual(PLAN);
  });

  it('creates a plan', async () => {
    const payload: CreatePlanRequest = {
      name: 'Campus Pro',
      tagline: 'For large campuses.',
      monthlyPrice: 6499,
      annualPrice: null,
      features: ['Unlimited students'],
      maxStudents: null,
      maxTeachers: null,
      maxTotalUsers: null,
      featured: false,
      active: true,
      sortOrder: 4,
    };
    const result = firstValueFrom(service.create(payload));

    const request = httpMock.expectOne('/api/admin/plans');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ ...PLAN, code: 'campus-pro', name: 'Campus Pro' });

    await expect(result).resolves.toMatchObject({ code: 'campus-pro', name: 'Campus Pro' });
  });

  it('updates a plan', async () => {
    const result = firstValueFrom(service.update('growth', { active: false }));

    const request = httpMock.expectOne('/api/admin/plans/growth');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ active: false });
    request.flush({ ...PLAN, active: false });

    await expect(result).resolves.toMatchObject({ active: false });
  });

  it('removes a plan', async () => {
    const result = firstValueFrom(service.remove('scale'));

    const request = httpMock.expectOne('/api/admin/plans/scale');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeNull();
  });
});
