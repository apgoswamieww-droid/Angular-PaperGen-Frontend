import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../../core/api/api-error.interceptor';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { PlanForm } from './plan-form';

const PLAN_URL = '/api/admin/plans/growth';

const PLAN: AdminPlan = {
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
};

describe('PlanForm', () => {
  let fixture: ComponentFixture<PlanForm>;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;

  const routeStub = {
    snapshot: {
      paramMap: convertToParamMap({}),
    },
  };

  beforeEach(async () => {
    routeStub.snapshot.paramMap = convertToParamMap({});

    await TestBed.configureTestingModule({
      imports: [PlanForm],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeStub },
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
    fixture = TestBed.createComponent(PlanForm);
    fixture.detectChanges();
  }

  function createEditPage(): void {
    routeStub.snapshot.paramMap = convertToParamMap({ code: 'growth' });
    createPage();
  }

  function setInput(name: string, value: string): void {
    const control = element().querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[formcontrolname="${name}"]`,
    );

    if (control === null) {
      throw new Error(`Control ${name} not found`);
    }

    control.value = value;
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setCheckbox(selector: string, checked: boolean): void {
    const control = element().querySelector<HTMLInputElement>(selector);

    if (control === null) {
      throw new Error(`Checkbox ${selector} not found`);
    }

    control.checked = checked;
    control.dispatchEvent(new Event('change'));
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

  function fillBasics(): void {
    setInput('name', 'Campus Pro');
    setInput('monthlyPrice', '6499');
  }

  it('renders the create form for super admins', () => {
    createPage();

    expect(element().textContent).toContain('New plan');
    expect(element().querySelector('button[type="submit"]')?.textContent).toContain('Create plan');
  });

  it('shows a notice for non-super admins', () => {
    createPage('support');

    expect(element().textContent).toContain('Only super admins can manage plans.');
    expect(element().querySelector('form')).toBeNull();
  });

  it('blocks the submit until a name and a price are provided', () => {
    createPage();
    submit();

    expect(element().textContent).toContain('Plan name is required.');
    httpMock.expectNone('/api/admin/plans');

    setInput('name', 'Campus Pro');
    submit();

    expect(element().textContent).toContain(
      'Enter a monthly or annual price, or switch on custom pricing.',
    );
    httpMock.expectNone('/api/admin/plans');
  });

  it('creates a plan and returns to the list', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    createPage();
    fillBasics();
    setInput('tagline', 'For large campuses.');
    setInput('featuresText', ' Unlimited students \n\n Priority support ');
    setInput('maxStudents', '5000');
    setInput('sortOrder', '4');
    setCheckbox('[formcontrolname="active"]', false);

    submit();

    const request = httpMock.expectOne('/api/admin/plans');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Campus Pro',
      tagline: 'For large campuses.',
      monthlyPrice: 6499,
      annualPrice: null,
      features: ['Unlimited students', 'Priority support'],
      maxStudents: 5000,
      maxTeachers: null,
      maxTotalUsers: null,
      featured: false,
      active: false,
      sortOrder: 4,
    });
    request.flush({ ...PLAN, code: 'campus-pro', name: 'Campus Pro' });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/admin/plans'], {
      queryParams: { saved: '1' },
    });
  });

  it('sends null prices for a custom-priced plan', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    createPage();
    setInput('name', 'Scale');
    setCheckbox('[data-testid="custom-price"]', true);

    const monthly = element().querySelector<HTMLInputElement>('[formcontrolname="monthlyPrice"]');
    expect(monthly?.disabled).toBe(true);

    submit();

    const request = httpMock.expectOne('/api/admin/plans');
    expect(request.request.body).toMatchObject({ monthlyPrice: null, annualPrice: null });
    request.flush({ ...PLAN, code: 'scale', name: 'Scale', monthlyPrice: null, annualPrice: null });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalled();
  });

  it('validates the feature list length', () => {
    createPage();
    fillBasics();
    setInput(
      'featuresText',
      Array.from({ length: 13 }, (_, index) => `Feature ${index + 1}`).join('\n'),
    );
    submit();

    expect(element().textContent).toContain('Use up to 12 features');
    httpMock.expectNone('/api/admin/plans');
  });

  it('loads a plan for editing and saves the changes', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    createEditPage();

    httpMock.expectOne(PLAN_URL).flush(PLAN);
    fixture.detectChanges();

    expect(element().textContent).toContain('Edit plan');
    expect(element().querySelector<HTMLInputElement>('[formcontrolname="name"]')?.value).toBe(
      'Growth',
    );
    expect(
      element().querySelector<HTMLInputElement>('[formcontrolname="monthlyPrice"]')?.value,
    ).toBe('8999');
    expect(
      element().querySelector<HTMLTextAreaElement>('[formcontrolname="featuresText"]')?.value,
    ).toContain('Priority support');

    setInput('name', 'Growth Plus');
    submit();

    const request = httpMock.expectOne(PLAN_URL);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toMatchObject({
      name: 'Growth Plus',
      monthlyPrice: 8999,
      annualPrice: 89990,
      maxStudents: 1200,
      featured: true,
      active: true,
      sortOrder: 2,
      features: ['Up to 1,200 students', 'Priority support'],
    });
    request.flush({ ...PLAN, name: 'Growth Plus' });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/admin/plans'], {
      queryParams: { saved: '1' },
    });
  });

  it('shows a load error and retries', () => {
    createEditPage();

    httpMock
      .expectOne(PLAN_URL)
      .flush({ message: 'Plan not found.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().textContent).toContain('Plan not found.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    httpMock.expectOne(PLAN_URL).flush(PLAN);
    fixture.detectChanges();

    expect(element().textContent).toContain('Edit plan');
  });

  it('shows the server error when saving fails', () => {
    createPage();
    fillBasics();
    submit();

    httpMock
      .expectOne('/api/admin/plans')
      .flush({ message: 'Unknown plan.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    const alert = element().querySelector('[data-testid="form-error"]');
    expect(alert?.textContent).toContain('Unknown plan.');
  });
});
