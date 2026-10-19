import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import type { AdminSchoolDetailResult } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { AdminSchoolEdit } from './admin-school-edit';

const DETAIL_URL = '/api/admin/schools/s1';

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
    tenantCount: 0,
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
    tenantCount: 0,
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
    tenantCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

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
    logo: 'data:image/png;base64,AAAA',
    board: 'cbse',
    affiliationNumber: 'CBSE/3300123',
    principalName: 'Dr. Asha Deshmukh',
    academicYear: '2025-26',
    timezone: 'Asia/Kolkata',
    billingCycle: 'monthly',
    subscriptionStatus: 'active',
    renewalAt: '2026-11-01T10:00:00.000Z',
    trialEndsAt: null,
    priceOverride: null,
  },
  stats: {
    totalUsers: 1,
    activeUsers: 1,
    suspendedUsers: 0,
    lockedUsers: 0,
    pendingSetupUsers: 0,
    activeSessions: 0,
    pendingInvites: 0,
    schoolAdmins: 1,
    teachers: 0,
    staff: 0,
    students: 0,
    lastLoginAt: null,
  },
  recentUsers: [],
};

describe('AdminSchoolEdit', () => {
  let fixture: ComponentFixture<AdminSchoolEdit>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSchoolEdit],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 's1' }) } },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function signIn(role: 'super_admin' | 'support'): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/admin/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id: 'a1', name: 'Platform Owner', email: 'owner@papergen.app', role },
    });
  }

  function createPage(role: 'super_admin' | 'support' = 'super_admin'): void {
    signIn(role);
    fixture = TestBed.createComponent(AdminSchoolEdit);
    fixture.detectChanges();
  }

  function flushDetail(result: AdminSchoolDetailResult = DETAIL, plans: AdminPlan[] = PLANS): void {
    httpMock.expectOne(DETAIL_URL).flush(result);
    httpMock.expectOne('/api/admin/plans').flush(plans);
    fixture.detectChanges();
  }

  function input(selector: string): HTMLInputElement {
    const found = element().querySelector<HTMLInputElement>(selector);

    if (found === null) {
      throw new Error(`Input not found: ${selector}`);
    }

    return found;
  }

  function setInput(selector: string, value: string): void {
    const control = input(selector);

    control.value = value;
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    const form = element().querySelector('form');

    if (form === null) {
      throw new Error('Form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('prefills the form with the school configuration', () => {
    createPage();
    flushDetail();

    expect(input('input[formcontrolname="name"]').value).toBe('Greenwood High');
    expect(input('input[formcontrolname="slug"]').value).toBe('greenwood-high');
    expect(input('input[formcontrolname="email"]').value).toBe('office@greenwood.test');
    expect(input('input[formcontrolname="tagline"]').value).toBe('Excellence in every classroom.');
    expect(input('select[formcontrolname="plan"]').value).toBe('growth');
    expect(element().textContent).toContain('#047857');
    expect(element().querySelector('[data-testid="logo-preview"]')).not.toBeNull();
  });

  it('keeps the current plan selectable even when it has been deactivated', () => {
    const deactivated = PLANS.map((plan) =>
      plan.code === 'growth' ? { ...plan, active: false } : plan,
    );

    createPage();
    flushDetail(DETAIL, deactivated);

    const select = input('select[formcontrolname="plan"]');
    const options = Array.from(select.querySelectorAll('option')).map((option) =>
      option.textContent?.trim(),
    );

    expect(options).toEqual(['Starter', 'Growth']);
    expect(select.value).toBe('growth');
  });

  it('shows a notice for non-super admins', () => {
    createPage('support');

    expect(element().textContent).toContain('Only super admins can edit school configuration.');
    expect(element().querySelector('form')).toBeNull();
  });

  it('saves the configuration and returns to the detail page', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    createPage();
    flushDetail();

    setInput('input[formcontrolname="tagline"]', '  Learn. Lead. Inspire.  ');
    setInput('input[formcontrolname="phone"]', '+91 90000 11111');
    submit();

    const request = httpMock.expectOne(DETAIL_URL);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toMatchObject({
      name: 'Greenwood High',
      slug: 'greenwood-high',
      type: 'school',
      plan: 'growth',
      tagline: 'Learn. Lead. Inspire.',
      phone: '+91 90000 11111',
      brandColor: '#047857',
      logo: 'data:image/png;base64,AAAA',
      timezone: 'Asia/Kolkata',
    });
    request.flush({ ...DETAIL.school });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/admin/schools', 's1'], {
      queryParams: { saved: '1' },
    });
  });

  it('blocks the submit and flags the field when the name is empty', () => {
    createPage();
    flushDetail();

    setInput('input[formcontrolname="name"]', '');
    submit();

    expect(element().textContent).toContain('School name is required.');
    httpMock.expectNone(DETAIL_URL);
  });

  it('shows a field error when the login domain conflicts', () => {
    createPage();
    flushDetail();
    submit();

    httpMock
      .expectOne(DETAIL_URL)
      .flush(
        { message: 'Another school already uses this login domain.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(element().textContent).toContain('Another school already uses this login domain.');
  });

  it('rejects unsupported logo files', () => {
    createPage();
    flushDetail();

    const fileInput = element().querySelector<HTMLInputElement>('[data-testid="logo-input"]');
    const file = new File(['gif'], 'logo.gif', { type: 'image/gif' });

    if (fileInput === null) {
      throw new Error('Logo input not found');
    }

    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(element().textContent).toContain('Use a PNG, JPEG, WebP or SVG image.');
  });

  it('previews a valid logo and clears it on remove', async () => {
    createPage();
    flushDetail();

    const fileInput = element().querySelector<HTMLInputElement>('[data-testid="logo-input"]');
    const file = new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' });

    if (fileInput === null) {
      throw new Error('Logo input not found');
    }

    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element().querySelector('[data-testid="logo-preview"]')).not.toBeNull();
    });

    expect(element().querySelector('[data-testid="logo-preview"]')?.getAttribute('src')).toContain(
      'data:image/png;base64,',
    );

    element().querySelector<HTMLButtonElement>('[data-action="remove-logo"]')?.click();
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="logo-preview"]')).toBeNull();
  });
});
