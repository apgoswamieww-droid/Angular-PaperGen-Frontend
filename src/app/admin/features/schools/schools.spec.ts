import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminSchoolSummary } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { Schools } from './schools';

const SCHOOLS: AdminSchoolSummary[] = [
  {
    id: 's1',
    name: 'Greenwood International School',
    slug: 'greenwood-international-school',
    type: 'school',
    city: 'Pune',
    plan: 'scale',
    planName: 'Scale',
    status: 'active',
    brandColor: '#047857',
    userCount: 1240,
    createdAt: '2026-10-01T10:00:00.000Z',
    billingCycle: 'annual',
    subscriptionStatus: 'active',
    renewalAt: '2026-11-01T10:00:00.000Z',
    trialEndsAt: null,
    priceOverride: null,
  },
  {
    id: 's2',
    name: 'Sunrise Public School',
    slug: 'sunrise-public-school',
    type: 'school',
    city: 'Nagpur',
    plan: 'growth',
    planName: 'Growth',
    status: 'active',
    brandColor: '#73113a',
    userCount: 512,
    createdAt: '2026-10-05T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'trial',
    renewalAt: null,
    trialEndsAt: '2026-10-25T10:00:00.000Z',
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
    status: 'suspended',
    brandColor: '#0f172a',
    userCount: 96,
    createdAt: '2026-10-08T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'cancelled',
    renewalAt: null,
    trialEndsAt: null,
    priceOverride: 1999,
  },
];

describe('Schools', () => {
  let fixture: ComponentFixture<Schools>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Schools],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
    fixture = TestBed.createComponent(Schools);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLElement[] {
    return Array.from(element().querySelectorAll<HTMLElement>('tbody tr'));
  }

  function flushList(schools: AdminSchoolSummary[] = SCHOOLS): void {
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

  function search(value: string): void {
    const input = element().querySelector<HTMLInputElement>('[data-testid="school-search"]');

    if (input === null) {
      throw new Error('Search input not found');
    }

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('shows a loading state until the list arrives', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading schools');

    flushList();

    expect(rows().length).toBe(3);
    expect(element().textContent).toContain('Greenwood International School');
    expect(element().textContent).toContain('Meridian Tutorials');
    expect(element().textContent).toContain('Scale');
    expect(element().textContent).toContain('Growth');
  });

  it('filters schools by search query', () => {
    flushList();

    search('nagpur');

    expect(rows().length).toBe(1);
    expect(element().textContent).toContain('Sunrise Public School');
  });

  it('filters schools by status', () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-status="suspended"]')?.click();
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(element().textContent).toContain('Meridian Tutorials');
  });

  it('combines the search query with the status filter', () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-status="active"]')?.click();
    fixture.detectChanges();
    search('meridian');

    expect(rows().length).toBe(0);
    expect(element().textContent).toContain('No schools match your filters.');
  });

  it('shows the onboarding empty state when there are no schools', () => {
    flushList([]);

    expect(rows().length).toBe(0);
    expect(element().textContent).toContain('No schools yet');
  });

  it('shows an error state and retries the request', () => {
    httpMock
      .expectOne('/api/admin/schools')
      .flush({ message: 'Server exploded.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Server exploded.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushList();

    expect(rows().length).toBe(3);
  });

  it('suspends a school and updates the row in place', () => {
    flushList();

    element().querySelector<HTMLButtonElement>('[data-action="suspend"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/admin/schools/s1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'suspended' });
    request.flush({ ...SCHOOLS[0], status: 'suspended' });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('suspended');
    expect(rows()[0].querySelector('[data-action="activate"]')).not.toBeNull();
  });

  it('shows an action error when the status change fails', () => {
    flushList();

    const activate = Array.from(
      element().querySelectorAll<HTMLButtonElement>('[data-action="activate"]'),
    )[0];
    activate.click();
    fixture.detectChanges();

    httpMock
      .expectOne('/api/admin/schools/s3/status')
      .flush({ message: 'Nope.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const alert = element().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Nope.');
  });

  it('sends a password reset link and shows a notice', () => {
    flushList();

    const reset = rows()[0].querySelector<HTMLButtonElement>('[data-action="reset-password"]');
    reset?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/admin/schools/s1/reset-password');
    expect(request.request.method).toBe('POST');
    request.flush({
      kind: 'reset',
      email: 'admin@greenwood.test',
      sent: true,
      expiresInMinutes: 30,
    });
    fixture.detectChanges();

    const notice = element().querySelector('[data-testid="reset-notice"]');
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain('admin@greenwood.test');
    expect(notice?.textContent).toContain('30 minutes');
  });

  it('reports the setup-link fallback when the admin has not set a password', () => {
    flushList();

    const reset = rows()[1].querySelector<HTMLButtonElement>('[data-action="reset-password"]');
    reset?.click();
    fixture.detectChanges();

    httpMock.expectOne('/api/admin/schools/s2/reset-password').flush({
      kind: 'invite',
      email: 'principal@sunrise.test',
      sent: true,
      expiresInHours: 72,
    });
    fixture.detectChanges();

    const notice = element().querySelector('[data-testid="reset-notice"]');
    expect(notice?.textContent).toContain('setup link');
    expect(notice?.textContent).toContain('principal@sunrise.test');
  });

  it('shows an action error when sending the reset link fails', () => {
    flushList();

    const reset = rows()[0].querySelector<HTMLButtonElement>('[data-action="reset-password"]');
    reset?.click();
    fixture.detectChanges();

    httpMock
      .expectOne('/api/admin/schools/s1/reset-password')
      .flush(
        { message: 'No active school admin account to reset.' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    const alert = element().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('No active school admin account to reset.');
    expect(element().querySelector('[data-testid="reset-notice"]')).toBeNull();
  });

  it('hides the Add school action for non-super admins', () => {
    flushList();
    signIn('support');

    expect(element().querySelector('a[href="/admin/schools/new"]')).toBeNull();
  });

  it('links to the registration page for super admins', () => {
    flushList();
    signIn('super_admin');

    const link = element().querySelector<HTMLAnchorElement>('a[href="/admin/schools/new"]');
    expect(link?.textContent).toContain('Add school');
  });

  it('links each row to the school detail and edit pages', () => {
    flushList();

    const view = element().querySelector<HTMLAnchorElement>('a[href="/admin/schools/s1"]');
    const edit = element().querySelector<HTMLAnchorElement>('a[href="/admin/schools/s2/edit"]');

    expect(view?.textContent).toContain('View');
    expect(edit?.textContent).toContain('Edit');
  });
});
