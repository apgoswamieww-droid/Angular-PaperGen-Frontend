import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import type { AdminSchoolSummary } from '../../../core/api/admin-schools.types';
import type { HealthResponse } from '../../../core/api/health.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { AdminDashboard } from './admin-dashboard';

const PLANS: AdminPlan[] = [
  {
    code: 'starter',
    name: 'Starter',
    tagline: '',
    monthlyPrice: 3999,
    annualPrice: 39990,
    features: [],
    limits: { maxStudents: 300, maxTeachers: 10, maxTotalUsers: null },
    featured: false,
    active: true,
    sortOrder: 1,
    tenantCount: 2,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    code: 'growth',
    name: 'Growth',
    tagline: '',
    monthlyPrice: 8999,
    annualPrice: 89990,
    features: [],
    limits: { maxStudents: 1200, maxTeachers: null, maxTotalUsers: null },
    featured: false,
    active: true,
    sortOrder: 2,
    tenantCount: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

const SCHOOLS: AdminSchoolSummary[] = [
  {
    id: 's1',
    name: 'Greenwood High',
    slug: 'greenwood-high',
    type: 'school',
    city: 'Pune',
    plan: 'growth',
    planName: 'Growth',
    status: 'active',
    brandColor: '#047857',
    userCount: 1240,
    createdAt: '2026-10-01T10:00:00.000Z',
    billingCycle: 'annual',
    subscriptionStatus: 'active',
    renewalAt: '2027-03-01T10:00:00.000Z',
    trialEndsAt: null,
    priceOverride: null,
  },
  {
    id: 's2',
    name: 'Sunrise Public School',
    slug: 'sunrise-public-school',
    type: 'school',
    city: 'Nagpur',
    plan: 'starter',
    planName: 'Starter',
    status: 'active',
    brandColor: '#73113a',
    userCount: 512,
    createdAt: '2026-08-01T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'active',
    renewalAt: '2026-11-01T10:00:00.000Z',
    trialEndsAt: null,
    priceOverride: null,
  },
  {
    id: 's3',
    name: 'Meridian Tutorials',
    slug: 'meridian-tutorials',
    type: 'institute',
    city: 'Thane',
    plan: 'starter',
    planName: 'Starter',
    status: 'active',
    brandColor: '#0f172a',
    userCount: 96,
    createdAt: '2026-10-08T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'trial',
    renewalAt: null,
    trialEndsAt: '2026-10-25T10:00:00.000Z',
    priceOverride: null,
  },
  {
    id: 's4',
    name: 'Blue Bells Academy',
    slug: 'blue-bells-academy',
    type: 'school',
    city: 'Nashik',
    plan: 'starter',
    planName: 'Starter',
    status: 'suspended',
    brandColor: '#1d4ed8',
    userCount: 210,
    createdAt: '2026-10-12T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'cancelled',
    renewalAt: null,
    trialEndsAt: null,
    priceOverride: null,
  },
];

describe('AdminDashboard', () => {
  let http: HttpTestingController;
  let auth: AdminAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
  });

  afterEach(() => {
    http.verify();
  });

  function signIn(role: 'super_admin' | 'support' = 'super_admin'): void {
    auth.restore().subscribe();
    http.expectOne('/api/admin/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id: 'a1', name: 'Platform Owner', email: 'owner@papergen.app', role },
    });
  }

  function createDashboard(): ComponentFixture<AdminDashboard> {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    return fixture;
  }

  function element(fixture: ComponentFixture<AdminDashboard>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function statusOf(fixture: ComponentFixture<AdminDashboard>): string {
    return (element(fixture).querySelector('[data-testid="api-status"]')?.textContent ?? '').trim();
  }

  function statValues(fixture: ComponentFixture<AdminDashboard>): string[] {
    return Array.from(element(fixture).querySelectorAll('.stat-card__value')).map(
      (node) => node.textContent?.trim() ?? '',
    );
  }

  function flushData(
    fixture: ComponentFixture<AdminDashboard>,
    schools: AdminSchoolSummary[] = SCHOOLS,
    plans: AdminPlan[] = PLANS,
  ): void {
    http.expectOne('/api/admin/schools').flush(schools);
    http.expectOne('/api/admin/plans').flush(plans);
    fixture.detectChanges();
  }

  function flushHealth(fixture: ComponentFixture<AdminDashboard>, body: HealthResponse): void {
    http.expectOne('/api/health').flush(body);
    fixture.detectChanges();
  }

  function boot(): ComponentFixture<AdminDashboard> {
    signIn();
    const fixture = createDashboard();
    flushData(fixture);
    flushHealth(fixture, UP);
    return fixture;
  }

  const UP: HealthResponse = { status: 'ok', database: 'up', uptime: 42 };
  const DOWN: HealthResponse = { status: 'degraded', database: 'down', uptime: 42 };

  it('creates the platform overview', () => {
    const fixture = boot();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('computes live stats from schools and plans', () => {
    const fixture = boot();

    expect(statValues(fixture)).toEqual(['4', '2,058', '2', '₹11,498']);
    expect(element(fixture).textContent).toContain('+3 in last 30 days');
    expect(element(fixture).textContent).toContain('1 on trial');
    expect(element(fixture).textContent).toContain('1 billed yearly');
    expect(element(fixture).textContent).not.toContain('Papers this month');
  });

  it('lists the most recent tenants first', () => {
    const fixture = boot();

    const rows = Array.from(element(fixture).querySelectorAll<HTMLElement>('tbody tr'));

    expect(rows.length).toBe(4);
    expect(rows[0].textContent).toContain('Blue Bells Academy');
    expect(rows[0].textContent).toContain('Cancelled');
    expect(rows[0].textContent).toContain('—');
    expect(rows[1].textContent).toContain('Meridian Tutorials');
    expect(rows[2].textContent).toContain('Greenwood High');
    expect(rows[2].textContent).toContain('01 Mar 2027');
    expect(rows[0].textContent).toContain('Starter');
    expect(element(fixture).textContent).toContain('Cancelled');
  });

  it('shows a loading state for tenants until schools arrive', () => {
    signIn();
    const fixture = createDashboard();

    expect(element(fixture).textContent).toContain('Loading tenants');

    flushData(fixture);
    flushHealth(fixture, UP);

    expect(element(fixture).querySelectorAll('tbody tr').length).toBe(4);
  });

  it('shows an empty state when there are no schools', () => {
    signIn();
    const fixture = createDashboard();

    flushData(fixture, []);
    flushHealth(fixture, UP);

    expect(element(fixture).textContent).toContain('No schools yet.');
  });

  it('falls back to overrides-only revenue for non-super admins', () => {
    signIn('support');
    const fixture = createDashboard();

    http.expectOne('/api/admin/schools').flush([{ ...SCHOOLS[0], priceOverride: 5000 }]);
    fixture.detectChanges();
    flushHealth(fixture, UP);

    expect(statValues(fixture)).toContain('₹5,000');
  });

  it('surfaces a data error and retries', () => {
    signIn();
    const fixture = createDashboard();

    http.expectOne('/api/admin/plans').flush(PLANS);
    http
      .expectOne('/api/admin/schools')
      .flush({ message: 'Server exploded.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    flushHealth(fixture, UP);

    const alert = element(fixture).querySelector('[data-testid="data-error"]');
    expect(alert?.textContent).toContain('Server exploded.');

    element(fixture).querySelector<HTMLButtonElement>('[data-testid="data-error"] button')?.click();
    fixture.detectChanges();

    flushData(fixture);

    expect(element(fixture).querySelectorAll('tbody tr').length).toBe(4);
  });

  it('starts in the checking state', () => {
    signIn();
    const fixture = createDashboard();

    flushData(fixture);

    expect(statusOf(fixture)).toBe('checking');

    flushHealth(fixture, UP);

    expect(statusOf(fixture)).toBe('ok');
  });

  it('reports ok when the backend database is up', () => {
    const fixture = boot();

    expect(statusOf(fixture)).toBe('ok');
    expect(element(fixture).textContent).toContain('42 s');
  });

  it('reports degraded when the backend database is down', () => {
    signIn();
    const fixture = createDashboard();

    flushData(fixture);
    flushHealth(fixture, DOWN);

    expect(statusOf(fixture)).toBe('degraded');
  });

  it('reports unreachable and surfaces the error message when the request fails', () => {
    signIn();
    const fixture = createDashboard();

    flushData(fixture);

    http
      .expectOne('/api/health')
      .flush('boom', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(statusOf(fixture)).toBe('unreachable');
    expect(element(fixture).querySelector('[data-testid="api-error"]')).toBeTruthy();
  });

  it('re-runs the check when the re-check button is clicked', () => {
    const fixture = boot();

    element(fixture).querySelector<HTMLButtonElement>('[data-testid="recheck"]')?.click();
    fixture.detectChanges();

    expect(statusOf(fixture)).toBe('checking');

    flushHealth(fixture, DOWN);

    expect(statusOf(fixture)).toBe('degraded');
  });
});
