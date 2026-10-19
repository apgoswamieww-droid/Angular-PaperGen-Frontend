import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AdminSchoolsService } from './admin-schools.service';
import type {
  AdminSchoolSummary,
  CreateSchoolRequest,
  UpdateSchoolBillingRequest,
} from './admin-schools.types';

const SCHOOL: AdminSchoolSummary = {
  id: 's1',
  name: 'Sunrise Public School',
  slug: 'sunrise-public-school',
  type: 'school',
  city: 'Nagpur',
  plan: 'growth',
  planName: 'Growth',
  status: 'active',
  brandColor: '#73113a',
  userCount: 1,
  createdAt: '2026-10-17T10:00:00.000Z',
  billingCycle: 'monthly',
  subscriptionStatus: 'active',
  renewalAt: '2026-11-16T10:00:00.000Z',
  trialEndsAt: null,
  priceOverride: null,
};

describe('AdminSchoolsService', () => {
  let service: AdminSchoolsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminSchoolsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists schools', async () => {
    const result = firstValueFrom(service.list());

    const request = httpMock.expectOne('/api/admin/schools');
    expect(request.request.method).toBe('GET');
    request.flush([SCHOOL]);

    await expect(result).resolves.toEqual([SCHOOL]);
  });

  it('creates a school', async () => {
    const payload: CreateSchoolRequest = {
      name: 'Sunrise Public School',
      type: 'school',
      city: 'Nagpur',
      plan: 'growth',
      adminName: 'Sunrise Principal',
      adminEmail: 'principal@sunrise.test',
    };
    const result = firstValueFrom(service.create(payload));

    const request = httpMock.expectOne('/api/admin/schools');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      school: SCHOOL,
      invite: { email: payload.adminEmail, expiresInHours: 72, sent: true },
    });

    await expect(result).resolves.toEqual({
      school: SCHOOL,
      invite: { email: payload.adminEmail, expiresInHours: 72, sent: true },
    });
  });

  it('updates a school status', async () => {
    const result = firstValueFrom(service.updateStatus('s1', 'suspended'));

    const request = httpMock.expectOne('/api/admin/schools/s1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'suspended' });
    request.flush({ ...SCHOOL, status: 'suspended' });

    await expect(result).resolves.toEqual({ ...SCHOOL, status: 'suspended' });
  });

  it('fetches a school detail', async () => {
    const result = firstValueFrom(service.get('s1'));

    const request = httpMock.expectOne('/api/admin/schools/s1');
    expect(request.request.method).toBe('GET');
    request.flush({
      school: {
        ...SCHOOL,
        createdAt: '2026-10-17T10:00:00.000Z',
        updatedAt: '2026-10-17T10:00:00.000Z',
        phone: '',
        email: '',
        website: '',
        addressLine1: '',
        addressLine2: '',
        state: '',
        pincode: '',
        country: '',
        tagline: '',
        logo: '',
        board: '',
        affiliationNumber: '',
        principalName: '',
        academicYear: '',
        timezone: 'Asia/Kolkata',
      },
      stats: {
        totalUsers: 1,
        activeUsers: 1,
        suspendedUsers: 0,
        lockedUsers: 0,
        pendingSetupUsers: 1,
        activeSessions: 0,
        pendingInvites: 1,
        schoolAdmins: 1,
        teachers: 0,
        staff: 0,
        students: 0,
        lastLoginAt: null,
      },
      recentUsers: [],
    });

    const response = await result;

    expect(response.school.id).toBe('s1');
    expect(response.stats.pendingInvites).toBe(1);
  });

  it('updates a school configuration', async () => {
    const payload = { tagline: 'Learn. Lead.', brandColor: '#1d4ed8' };
    const result = firstValueFrom(service.update('s1', payload));

    const request = httpMock.expectOne('/api/admin/schools/s1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(payload);
    request.flush({ ...SCHOOL, brandColor: '#1d4ed8' });

    await expect(result).resolves.toEqual({ ...SCHOOL, brandColor: '#1d4ed8' });
  });

  it('updates a school billing profile', async () => {
    const payload: UpdateSchoolBillingRequest = {
      plan: 'scale',
      billingCycle: 'annual',
      subscriptionStatus: 'trial',
      renewalAt: null,
      trialEndsAt: '2026-11-01T00:00:00.000Z',
      priceOverride: 5000,
    };
    const result = firstValueFrom(service.updateBilling('s1', payload));

    const request = httpMock.expectOne('/api/admin/schools/s1/billing');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(payload);
    request.flush({
      ...SCHOOL,
      plan: 'scale',
      planName: 'Scale',
      billingCycle: 'annual',
      subscriptionStatus: 'trial',
      renewalAt: null,
      trialEndsAt: '2026-11-01T00:00:00.000Z',
      priceOverride: 5000,
    });

    await expect(result).resolves.toMatchObject({
      plan: 'scale',
      planName: 'Scale',
      subscriptionStatus: 'trial',
      priceOverride: 5000,
    });
  });

  it('resends the admin setup link', async () => {
    const result = firstValueFrom(service.resendInvite('s1'));

    const request = httpMock.expectOne('/api/admin/schools/s1/resend-invite');
    expect(request.request.method).toBe('POST');
    request.flush({ email: 'principal@sunrise.test', expiresInHours: 72, sent: true });

    await expect(result).resolves.toEqual({
      email: 'principal@sunrise.test',
      expiresInHours: 72,
      sent: true,
    });
  });

  it('sends a password reset link to the school admin', async () => {
    const result = firstValueFrom(service.resetPassword('s1'));

    const request = httpMock.expectOne('/api/admin/schools/s1/reset-password');
    expect(request.request.method).toBe('POST');
    request.flush({
      kind: 'reset',
      email: 'principal@sunrise.test',
      sent: true,
      expiresInMinutes: 30,
    });

    await expect(result).resolves.toEqual({
      kind: 'reset',
      email: 'principal@sunrise.test',
      sent: true,
      expiresInMinutes: 30,
    });
  });
});
