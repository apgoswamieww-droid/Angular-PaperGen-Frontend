import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminSchoolSummary } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { WhiteLabel } from './white-label';

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
    name: 'Meridian Tutorials',
    slug: 'meridian-tutorials',
    type: 'institute',
    city: 'Thane',
    plan: 'starter',
    planName: 'Starter',
    status: 'suspended',
    brandColor: '#1d4ed8',
    userCount: 96,
    createdAt: '2026-10-08T10:00:00.000Z',
    billingCycle: 'monthly',
    subscriptionStatus: 'cancelled',
    renewalAt: null,
    trialEndsAt: null,
    priceOverride: null,
  },
];

describe('WhiteLabel', () => {
  let fixture: ComponentFixture<WhiteLabel>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhiteLabel],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
    fixture = TestBed.createComponent(WhiteLabel);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
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

  it('shows a loading state until schools arrive', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('Loading schools');

    flushList();

    expect(element().textContent).toContain('Greenwood International School');
    expect(element().textContent).toContain('greenwood-international-school.papergen.app');
    expect(element().textContent).toContain('Meridian Tutorials');
  });

  it('shows the empty state when there are no schools', () => {
    flushList([]);

    expect(element().textContent).toContain('No schools yet');
  });

  it('shows an error state and retries', () => {
    httpMock
      .expectOne('/api/admin/schools')
      .flush({ message: 'Boom.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Boom.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    flushList();

    expect(element().textContent).toContain('Greenwood International School');
  });

  it('links super admins to the branding editor for each school', () => {
    flushList();
    signIn('super_admin');

    const links = Array.from(element().querySelectorAll<HTMLAnchorElement>('a[href]'));

    expect(links.some((link) => link.getAttribute('href') === '/admin/schools/s1/edit')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/admin/schools/s2/edit')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/admin/schools/s1')).toBe(true);
  });

  it('hides the branding editor from non-super admins but keeps view links', () => {
    flushList();
    signIn('support');

    const links = Array.from(element().querySelectorAll<HTMLAnchorElement>('a[href]'));

    expect(links.some((link) => link.getAttribute('href') === '/admin/schools/s1/edit')).toBe(
      false,
    );
    expect(links.some((link) => link.getAttribute('href') === '/admin/schools/s1')).toBe(true);
  });
});
