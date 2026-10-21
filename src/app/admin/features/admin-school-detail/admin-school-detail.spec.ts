import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminSchoolDetailResult } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { AdminSchoolDetail } from './admin-school-detail';

const DETAIL_URL = '/api/admin/schools/s1';

const DETAIL: AdminSchoolDetailResult = {
  school: {
    id: 's1',
    name: 'Greenwood High',
    slug: 'greenwood-high',
    type: 'school',
    plan: 'growth',
    planName: 'Growth',
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
    phone: '+91 98765 43210',
    email: 'office@greenwood.test',
    website: 'https://greenwood.test',
    addressLine1: '12 Vidya Marg',
    addressLine2: 'Civil Lines',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    country: 'India',
    tagline: 'Excellence in every classroom.',
    brandColor: '#047857',
    logo: '',
    board: 'cbse',
    affiliationNumber: 'CBSE/3300123',
    principalName: 'Dr. Asha Deshmukh',
    academicYear: '2025-26',
    timezone: 'Asia/Kolkata',
    billingCycle: 'annual',
    subscriptionStatus: 'active',
    renewalAt: '2027-03-01T10:00:00.000Z',
    trialEndsAt: null,
    priceOverride: null,
  },
  stats: {
    totalUsers: 4,
    activeUsers: 3,
    suspendedUsers: 1,
    lockedUsers: 1,
    pendingSetupUsers: 1,
    activeSessions: 2,
    pendingInvites: 1,
    schoolAdmins: 1,
    teachers: 2,
    staff: 1,
    students: 0,
    lastLoginAt: '2026-10-16T09:30:00.000Z',
  },
  recentUsers: [
    {
      id: 'u1',
      name: 'Greenwood Teacher',
      email: 'teacher@greenwood.test',
      role: 'teacher',
      status: 'active',
      setupPending: false,
      lastLoginAt: '2026-10-16T09:30:00.000Z',
      createdAt: '2026-10-02T10:00:00.000Z',
    },
    {
      id: 'u2',
      name: 'Greenwood Principal',
      email: 'principal@greenwood.test',
      role: 'school_admin',
      status: 'active',
      setupPending: true,
      lastLoginAt: null,
      createdAt: '2026-10-01T10:00:00.000Z',
    },
  ],
};

describe('AdminSchoolDetail', () => {
  let fixture: ComponentFixture<AdminSchoolDetail>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  const routeStub = {
    snapshot: {
      paramMap: convertToParamMap({ id: 's1' }),
      queryParamMap: convertToParamMap({}),
    },
  };

  beforeEach(async () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({});
    routeStub.snapshot.paramMap = convertToParamMap({ id: 's1' });

    await TestBed.configureTestingModule({
      imports: [AdminSchoolDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
    fixture = TestBed.createComponent(AdminSchoolDetail);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushDetail(result: AdminSchoolDetailResult = DETAIL): void {
    httpMock.expectOne(DETAIL_URL).flush(result);
    fixture.detectChanges();
  }

  function signIn(role: 'super_admin' | 'support'): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/admin/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id: 'a1', name: 'Platform Owner', email: 'owner@papergen.app', role },
    });
    fixture.detectChanges();
  }

  function setBillingValue(name: string, value: string): void {
    const control = element().querySelector<HTMLInputElement | HTMLSelectElement>(
      `.billing-form [formcontrolname="${name}"]`,
    );

    if (control === null) {
      throw new Error(`Billing control ${name} not found`);
    }

    control.value = value;
    control.dispatchEvent(new Event(control.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  it('shows a loading state, then the configuration, stats and recent users', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading school details');

    flushDetail();

    expect(element().textContent).toContain('Greenwood High');
    expect(element().textContent).toContain('greenwood-high.papergen.app');
    expect(element().textContent).toContain('Excellence in every classroom.');
    expect(element().textContent).toContain('office@greenwood.test');
    expect(element().textContent).toContain('Maharashtra');
    expect(element().textContent).toContain('CBSE');
    expect(element().textContent).toContain('Dr. Asha Deshmukh');

    const statValues = Array.from(element().querySelectorAll('.stat__value')).map((node) =>
      node.textContent?.trim(),
    );

    expect(statValues).toEqual(['4', '3', '1', '2']);

    expect(element().textContent).toContain('teacher@greenwood.test');
    expect(element().textContent).toContain('Pending');
  });

  it('shows the saved banner when returning from the editor', () => {
    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    fixture.detectChanges();

    routeStub.snapshot.queryParamMap = convertToParamMap({ saved: '1' });

    const second = TestBed.createComponent(AdminSchoolDetail);
    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    second.detectChanges();

    expect(
      (second.nativeElement as HTMLElement).querySelector('[data-testid="saved-banner"]'),
    ).not.toBeNull();
  });

  it('shows an error state and retries the request', () => {
    httpMock
      .expectOne(DETAIL_URL)
      .flush({ message: 'Not found.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Not found.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushDetail();

    expect(element().textContent).toContain('Greenwood High');
  });

  it('suspends the school and refreshes the status in place', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="toggle-status"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(`${DETAIL_URL}/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'suspended' });
    request.flush({ ...DETAIL.school, status: 'suspended' });
    fixture.detectChanges();

    httpMock
      .expectOne(DETAIL_URL)
      .flush({ ...DETAIL, school: { ...DETAIL.school, status: 'suspended' } });
    fixture.detectChanges();

    expect(element().textContent).toContain('suspended');
    expect(element().textContent).toContain('Activate school');
  });

  it('resends the setup link and reports the result', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="resend-invite"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(`${DETAIL_URL}/resend-invite`);
    expect(request.request.method).toBe('POST');
    request.flush({ email: 'principal@greenwood.test', expiresInHours: 72, sent: true });
    fixture.detectChanges();

    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    fixture.detectChanges();

    const banner = element().querySelector('[data-testid="resent-banner"]');
    expect(banner?.textContent).toContain('principal@greenwood.test');
  });

  it('resets the admin password and reports the result', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="reset-password"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(`${DETAIL_URL}/reset-password`);
    expect(request.request.method).toBe('POST');
    request.flush({
      kind: 'reset',
      email: 'principal@greenwood.test',
      sent: true,
      expiresInMinutes: 30,
    });
    fixture.detectChanges();

    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    fixture.detectChanges();

    const banner = element().querySelector('[data-testid="reset-banner"]');
    expect(banner?.textContent).toContain('principal@greenwood.test');
    expect(banner?.textContent).toContain('30 minutes');
  });

  it('reports the setup-link fallback for admins without a password', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="reset-password"]')?.click();
    fixture.detectChanges();

    httpMock.expectOne(`${DETAIL_URL}/reset-password`).flush({
      kind: 'invite',
      email: 'principal@greenwood.test',
      sent: true,
      expiresInHours: 72,
    });
    fixture.detectChanges();

    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    fixture.detectChanges();

    const banner = element().querySelector('[data-testid="reset-banner"]');
    expect(banner?.textContent).toContain('has not set a password yet');
    expect(banner?.textContent).toContain('72 hours');
  });

  it('seeds the master data and reports the created counts', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="seed-master-data"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(`${DETAIL_URL}/seed-master-data`);
    expect(request.request.method).toBe('POST');
    request.flush({
      schoolId: 's1',
      mediums: { created: 2, reused: 0 },
      standards: { created: 4, reused: 0 },
      subjects: { created: 28, reused: 0 },
      chapters: { created: 350, reused: 0 },
      topics: { created: 1693, reused: 0 },
      durationMs: 1200,
    });
    fixture.detectChanges();

    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    fixture.detectChanges();

    const banner = element().querySelector('[data-testid="seed-banner"]');
    expect(banner?.textContent).toContain('350 chapters');
    expect(banner?.textContent).toContain('1693 topics created');
  });

  it('reports when the master data is already up to date', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="seed-master-data"]')?.click();
    fixture.detectChanges();

    httpMock.expectOne(`${DETAIL_URL}/seed-master-data`).flush({
      schoolId: 's1',
      mediums: { created: 0, reused: 2 },
      standards: { created: 0, reused: 4 },
      subjects: { created: 0, reused: 28 },
      chapters: { created: 0, reused: 350 },
      topics: { created: 0, reused: 1693 },
      durationMs: 900,
    });
    fixture.detectChanges();

    httpMock.expectOne(DETAIL_URL).flush(DETAIL);
    fixture.detectChanges();

    const banner = element().querySelector('[data-testid="seed-banner"]');
    expect(banner?.textContent).toContain('already up to date');
    expect(banner?.textContent).toContain('2077 records reused');
  });

  it('reports a seeding error', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="seed-master-data"]')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne(`${DETAIL_URL}/seed-master-data`)
      .flush(
        { message: 'Master data seeding is already running for this school.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    const error = element().querySelector('[role="alert"]');
    expect(error?.textContent).toContain('already running');
    expect(element().querySelector('[data-testid="seed-banner"]')).toBeNull();
  });

  it('shows the plan and billing summary', () => {
    flushDetail();

    expect(element().textContent).toContain('Plan & billing');
    expect(element().textContent).toContain('Growth');
    expect(element().textContent).toContain('Active');
    expect(element().textContent).toContain('Annual');
    expect(element().textContent).toContain('01 Mar 2027');
    expect(element().textContent).toContain('Plan price');
  });

  it('saves the billing profile and refreshes the summary', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="edit-billing"]')?.click();
    fixture.detectChanges();

    setBillingValue('subscriptionStatus', 'past_due');
    setBillingValue('trialEndsAt', '2026-10-25');
    setBillingValue('priceOverride', '7500');

    element().querySelector<HTMLFormElement>('.billing-form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const request = httpMock.expectOne(`${DETAIL_URL}/billing`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      plan: 'growth',
      billingCycle: 'annual',
      subscriptionStatus: 'past_due',
      renewalAt: '2027-03-01',
      trialEndsAt: '2026-10-25',
      priceOverride: 7500,
    });
    request.flush({
      ...DETAIL.school,
      subscriptionStatus: 'past_due',
      trialEndsAt: '2026-10-25T00:00:00.000Z',
      priceOverride: 7500,
    });
    fixture.detectChanges();

    httpMock.expectOne(DETAIL_URL).flush({
      ...DETAIL,
      school: {
        ...DETAIL.school,
        subscriptionStatus: 'past_due',
        trialEndsAt: '2026-10-25T00:00:00.000Z',
        priceOverride: 7500,
      },
    });
    fixture.detectChanges();

    const notice = element().querySelector('[data-testid="billing-notice"]');
    expect(notice?.textContent).toContain('Billing updated.');
    expect(element().textContent).toContain('Past due');
    expect(element().textContent).toContain('₹7,500 / month');
    expect(element().querySelector('.billing-form')).toBeNull();
  });

  it('renews the subscription by a month and moves the renewal date', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="renew-month"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(`${DETAIL_URL}/billing`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      renewalAt: '2027-04-01T10:00:00.000Z',
      subscriptionStatus: 'active',
    });
    request.flush({ ...DETAIL.school, renewalAt: '2027-04-01T10:00:00.000Z' });
    fixture.detectChanges();

    httpMock
      .expectOne(DETAIL_URL)
      .flush({ ...DETAIL, school: { ...DETAIL.school, renewalAt: '2027-04-01T10:00:00.000Z' } });
    fixture.detectChanges();

    const notice = element().querySelector('[data-testid="billing-notice"]');
    expect(notice?.textContent).toContain('Renewal date updated.');
    expect(element().textContent).toContain('01 Apr 2027');
  });

  it('reports a billing error without closing the form', () => {
    flushDetail();
    signIn('super_admin');

    element().querySelector<HTMLButtonElement>('[data-action="edit-billing"]')?.click();
    fixture.detectChanges();

    element().querySelector<HTMLFormElement>('.billing-form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    httpMock
      .expectOne(`${DETAIL_URL}/billing`)
      .flush({ message: 'Unknown plan.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    const error = element().querySelector('[data-testid="billing-error"]');
    expect(error?.textContent).toContain('Unknown plan.');
    expect(element().querySelector('.billing-form')).not.toBeNull();
  });

  it('hides management actions from non-super admins', () => {
    flushDetail();
    signIn('support');

    expect(element().querySelector('[data-action="toggle-status"]')).toBeNull();
    expect(element().querySelector('[data-action="resend-invite"]')).toBeNull();
    expect(element().querySelector('[data-action="reset-password"]')).toBeNull();
    expect(element().querySelector('[data-action="seed-master-data"]')).toBeNull();
    expect(element().querySelector('[data-action="edit-billing"]')).toBeNull();
    expect(element().querySelector('[data-action="renew-month"]')).toBeNull();
    expect(element().querySelector('a[href="/admin/schools/s1/edit"]')).toBeNull();
  });

  it('links super admins to the editor', () => {
    flushDetail();
    signIn('super_admin');

    expect(element().querySelector('a[href="/admin/schools/s1/edit"]')).not.toBeNull();
  });
});
