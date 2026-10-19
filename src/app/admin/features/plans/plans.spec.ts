import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import type { AdminSchoolSummary } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { Plans } from './plans';

const PLANS: AdminPlan[] = [
  {
    code: 'starter',
    name: 'Starter',
    tagline: 'For small schools.',
    monthlyPrice: 3999,
    annualPrice: 39990,
    features: ['Up to 300 students', 'Email support'],
    limits: { maxStudents: 300, maxTeachers: 10, maxTotalUsers: null },
    featured: false,
    active: true,
    sortOrder: 1,
    tenantCount: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    code: 'growth',
    name: 'Growth',
    tagline: 'For growing schools.',
    monthlyPrice: 8999,
    annualPrice: 89990,
    features: ['Up to 1,200 students', 'Priority support'],
    limits: { maxStudents: 1200, maxTeachers: null, maxTotalUsers: null },
    featured: true,
    active: true,
    sortOrder: 2,
    tenantCount: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    code: 'scale',
    name: 'Scale',
    tagline: '',
    monthlyPrice: null,
    annualPrice: null,
    features: [],
    limits: { maxStudents: null, maxTeachers: null, maxTotalUsers: null },
    featured: false,
    active: false,
    sortOrder: 3,
    tenantCount: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

const TRIAL_END = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

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
    billingCycle: 'monthly',
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
    createdAt: '2026-10-05T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'trial',
    renewalAt: null,
    trialEndsAt: TRIAL_END,
    priceOverride: null,
  },
  {
    id: 's3',
    name: 'Meridian Tutorials',
    slug: 'meridian-tutorials',
    type: 'institute',
    city: 'Thane',
    plan: 'scale',
    planName: 'Scale',
    status: 'suspended',
    brandColor: '#0f172a',
    userCount: 96,
    createdAt: '2026-10-08T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'cancelled',
    renewalAt: null,
    trialEndsAt: null,
    priceOverride: null,
  },
];

describe('Plans', () => {
  let fixture: ComponentFixture<Plans>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  const routeStub = {
    snapshot: {
      queryParamMap: convertToParamMap({}),
    },
  };

  beforeEach(async () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({});

    await TestBed.configureTestingModule({
      imports: [Plans],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
    fixture = TestBed.createComponent(Plans);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushData(plans: AdminPlan[] = PLANS, schools: AdminSchoolSummary[] = SCHOOLS): void {
    httpMock.expectOne('/api/admin/plans').flush(plans);
    httpMock.expectOne('/api/admin/schools').flush(schools);
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

  function summaryValues(): string[] {
    return Array.from(element().querySelectorAll('.summary__value')).map(
      (node) => node.textContent?.trim() ?? '',
    );
  }

  it('shows a loading state until plans and schools arrive', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading plans');

    flushData();

    expect(element().querySelectorAll('.plan').length).toBe(3);
    expect(element().textContent).toContain('Starter');
    expect(element().textContent).toContain('Growth');
    expect(element().textContent).toContain('Scale');
  });

  it('shows the summary strip from live data', () => {
    flushData();

    expect(summaryValues()).toEqual(['3', '1', '1', '₹8,999']);
    expect(element().textContent).toContain('Monthly recurring revenue');
  });

  it('marks featured, inactive and custom-priced plans', () => {
    flushData();

    const featured = element().querySelector('[data-plan="growth"]');
    const inactive = element().querySelector('[data-plan="scale"]');

    expect(featured?.classList.contains('plan--featured')).toBe(true);
    expect(featured?.textContent).toContain('Most popular');
    expect(inactive?.classList.contains('plan--inactive')).toBe(true);
    expect(inactive?.textContent).toContain('Inactive');
    expect(inactive?.textContent).toContain('Custom');
  });

  it('lists pricing, tenant counts and features from the API', () => {
    flushData();

    expect(element().textContent).toContain('₹8,999');
    expect(element().textContent).toContain('1 school on this plan');
    expect(element().textContent).toContain('Priority support');
    expect(element().textContent).toContain('Up to 1,200 students');
  });

  it('shows the saved banner after creating or editing a plan', () => {
    httpMock.expectOne('/api/admin/plans').flush(PLANS);
    httpMock.expectOne('/api/admin/schools').flush(SCHOOLS);

    routeStub.snapshot.queryParamMap = convertToParamMap({ saved: '1' });

    const second = TestBed.createComponent(Plans);
    httpMock.expectOne('/api/admin/plans').flush(PLANS);
    httpMock.expectOne('/api/admin/schools').flush(SCHOOLS);
    second.detectChanges();

    expect(
      (second.nativeElement as HTMLElement).querySelector('[data-testid="saved-banner"]'),
    ).not.toBeNull();
  });

  it('shows an error state and retries both requests', () => {
    httpMock.expectOne('/api/admin/schools').flush(SCHOOLS);
    httpMock
      .expectOne('/api/admin/plans')
      .flush({ message: 'Server exploded.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushData();

    expect(element().querySelectorAll('.plan').length).toBe(3);
  });

  it('deactivates a plan and updates the card in place', () => {
    flushData();
    signIn('super_admin');

    element()
      .querySelector<HTMLButtonElement>('[data-plan="growth"] [data-action="deactivate"]')
      ?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/admin/plans/growth');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ active: false });
    request.flush({ ...PLANS[1], active: false });
    fixture.detectChanges();

    const card = element().querySelector('[data-plan="growth"]');

    expect(card?.classList.contains('plan--inactive')).toBe(true);
    expect(card?.querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('deletes a plan after a two-step confirmation', () => {
    flushData();
    signIn('super_admin');

    element()
      .querySelector<HTMLButtonElement>('[data-plan="scale"] [data-action="delete"]')
      ?.click();
    fixture.detectChanges();

    expect(
      element().querySelector('[data-plan="scale"] [data-action="delete-confirm"]'),
    ).not.toBeNull();

    element()
      .querySelector<HTMLButtonElement>('[data-plan="scale"] [data-action="delete-confirm"]')
      ?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/admin/plans/scale');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(element().querySelectorAll('.plan').length).toBe(2);
    expect(element().querySelector('[data-plan="scale"]')).toBeNull();
  });

  it('cancels the delete confirmation without removing the plan', () => {
    flushData();
    signIn('super_admin');

    element()
      .querySelector<HTMLButtonElement>('[data-plan="scale"] [data-action="delete"]')
      ?.click();
    fixture.detectChanges();

    const cancel = Array.from(
      element().querySelectorAll<HTMLButtonElement>('[data-plan="scale"] .confirm button'),
    ).at(-1);

    cancel?.click();
    fixture.detectChanges();

    expect(
      element().querySelector('[data-plan="scale"] [data-action="delete-confirm"]'),
    ).toBeNull();
    httpMock.expectNone('/api/admin/plans/scale');
  });

  it('shows the conflict message when deleting a plan that is in use', () => {
    flushData();
    signIn('super_admin');

    element()
      .querySelector<HTMLButtonElement>('[data-plan="growth"] [data-action="delete"]')
      ?.click();
    fixture.detectChanges();

    element()
      .querySelector<HTMLButtonElement>('[data-plan="growth"] [data-action="delete-confirm"]')
      ?.click();
    fixture.detectChanges();

    httpMock
      .expectOne('/api/admin/plans/growth')
      .flush(
        { message: '1 school is on this plan. Move it to another plan first.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    const alert = element().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Move it to another plan first');
    expect(element().querySelectorAll('.plan').length).toBe(3);
  });

  it('hides management actions from non-super admins', () => {
    flushData();
    signIn('support');

    expect(element().querySelector('[data-testid="new-plan"]')).toBeNull();
    expect(element().querySelector('[data-action="edit"]')).toBeNull();
    expect(element().querySelector('[data-action="delete"]')).toBeNull();
  });

  it('links super admins to the new and edit screens', () => {
    flushData();
    signIn('super_admin');

    const newLink = element().querySelector<HTMLAnchorElement>('[data-testid="new-plan"]');
    const editLink = element().querySelector<HTMLAnchorElement>(
      '[data-plan="growth"] [data-action="edit"]',
    );

    expect(newLink?.getAttribute('href')).toBe('/admin/plans/new');
    expect(editLink?.getAttribute('href')).toBe('/admin/plans/growth/edit');
  });
});
