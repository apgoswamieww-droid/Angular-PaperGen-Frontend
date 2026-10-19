import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import type { CreateSchoolResult } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { AdminSchoolRegister } from './admin-school-register';

const PLANS: AdminPlan[] = [
  {
    code: 'starter',
    name: 'Starter',
    tagline: 'For small schools.',
    monthlyPrice: 3999,
    annualPrice: 39990,
    features: [],
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
    features: [],
    limits: { maxStudents: 1200, maxTeachers: null, maxTotalUsers: null },
    featured: true,
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

const RESULT: CreateSchoolResult = {
  school: {
    id: 's9',
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
  },
  invite: { email: 'principal@sunrise.test', expiresInHours: 72, sent: true },
};

describe('AdminSchoolRegister', () => {
  let fixture: ComponentFixture<AdminSchoolRegister>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSchoolRegister],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
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

    fixture = TestBed.createComponent(AdminSchoolRegister);
    fixture.detectChanges();

    if (role === 'super_admin') {
      httpMock.expectOne('/api/admin/plans').flush(PLANS);
      fixture.detectChanges();
    }
  }

  function setValue(name: string, value: string): void {
    const control = element().querySelector<HTMLInputElement | HTMLSelectElement>(
      `[formcontrolname="${name}"]`,
    );

    if (control === null) {
      throw new Error(`Control ${name} not found`);
    }

    control.value = value;
    control.dispatchEvent(new Event(control.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  function submit(): void {
    const form = element().querySelector<HTMLFormElement>('form');

    if (form === null) {
      throw new Error('Form not found');
    }

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function fillForm(): void {
    setValue('name', 'Sunrise Public School');
    setValue('type', 'school');
    setValue('city', 'Nagpur');
    setValue('plan', 'growth');
    setValue('adminName', 'Sunrise Principal');
    setValue('adminEmail', 'principal@sunrise.test');
  }

  it('shows the registration form for super admins', () => {
    signIn('super_admin');

    expect(element().querySelector('form')).not.toBeNull();
    expect(element().textContent).toContain('Register a school');
  });

  it('hides the form for support admins', () => {
    signIn('support');

    expect(element().querySelector('form')).toBeNull();
    expect(element().textContent).toContain('Only super admins can register schools.');
  });

  it('offers only active plans and defaults to the first one', () => {
    signIn('super_admin');

    const select = element().querySelector<HTMLSelectElement>('[formcontrolname="plan"]');
    const options = Array.from(select?.options ?? []).map((option) => option.textContent?.trim());

    expect(options).toEqual(['Starter', 'Growth']);
    expect(select?.value).toBe('starter');
  });

  it('validates required fields before submitting', () => {
    signIn('super_admin');
    submit();

    expect(element().textContent).toContain('School name is required.');
    expect(element().textContent).toContain("The admin's name is required.");
    expect(element().textContent).toContain('Admin email is required.');
  });

  it('rejects an invalid admin email', () => {
    signIn('super_admin');
    fillForm();
    setValue('adminEmail', 'not-an-email');
    submit();

    expect(element().textContent).toContain('Enter a valid email address.');
  });

  it('creates the school and shows the invite confirmation', () => {
    signIn('super_admin');
    fillForm();
    submit();

    const request = httpMock.expectOne('/api/admin/schools');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Sunrise Public School',
      type: 'school',
      city: 'Nagpur',
      plan: 'growth',
      adminName: 'Sunrise Principal',
      adminEmail: 'principal@sunrise.test',
    });
    request.flush(RESULT);
    fixture.detectChanges();

    const success = element().querySelector('[data-testid="school-created"]');
    expect(success?.textContent).toContain('Sunrise Public School is ready');
    expect(success?.textContent).toContain('Growth plan');
    expect(success?.textContent).toContain('principal@sunrise.test');
    expect(success?.textContent).toContain('72 hours');
    expect(element().querySelector('form')).toBeNull();
  });

  it('shows the server error when the admin email already exists', () => {
    signIn('super_admin');
    fillForm();
    submit();

    httpMock
      .expectOne('/api/admin/schools')
      .flush(
        { message: 'A user with this email already exists.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    const alert = element().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('A user with this email already exists.');
    expect(element().querySelector('form')).not.toBeNull();
  });

  it('warns when the invitation email could not be sent', () => {
    signIn('super_admin');
    fillForm();
    submit();

    httpMock.expectOne('/api/admin/schools').flush({
      ...RESULT,
      invite: { ...RESULT.invite, sent: false },
    });
    fixture.detectChanges();

    const success = element().querySelector('[data-testid="school-created"]');
    expect(success?.textContent).toContain('could not be delivered');
  });

  it('resets back to an empty form to add another school', () => {
    signIn('super_admin');
    fillForm();
    submit();
    httpMock.expectOne('/api/admin/schools').flush(RESULT);
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-testid="school-created"] button')?.click();
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="school-created"]')).toBeNull();

    const name = element().querySelector<HTMLInputElement>('[formcontrolname="name"]');
    const plan = element().querySelector<HTMLSelectElement>('[formcontrolname="plan"]');

    expect(name?.value).toBe('');
    expect(plan?.value).toBe('starter');
  });
});
