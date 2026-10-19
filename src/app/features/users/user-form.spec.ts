import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { SchoolUserRecord } from '../../core/api/school-users.types';
import { AuthService } from '../../core/auth/auth.service';
import { UserForm } from './user-form';

const USER: SchoolUserRecord = {
  id: 'u1',
  name: 'Chetan Joshi',
  email: 'teacher@greenwood.test',
  phone: '+91 90000 00001',
  role: 'teacher',
  status: 'active',
  lastLoginAt: null,
  createdAt: '2026-10-01T10:00:00.000Z',
};

const routeStub = {
  snapshot: {
    paramMap: convertToParamMap({} as Record<string, string>),
  },
};

describe('UserForm', () => {
  let fixture: ComponentFixture<UserForm>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    routeStub.snapshot.paramMap = convertToParamMap({} as Record<string, string>);

    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
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

  function setSelect(selector: string, value: string): void {
    const select = element().querySelector<HTMLSelectElement>(selector);

    if (select === null) {
      throw new Error(`Select not found: ${selector}`);
    }

    select.value = value;
    select.dispatchEvent(new Event('change'));
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

  function signIn(id: string): void {
    auth.restore().subscribe();
    httpMock.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-1',
      user: { id, name: 'Asha Deshmukh', email: 'principal@greenwood.test', role: 'school_admin' },
    });
  }

  function createPage(): void {
    fixture = TestBed.createComponent(UserForm);
    fixture.detectChanges();
  }

  it('creates a user and reveals the generated credentials', () => {
    createPage();

    setInput('[data-testid="name-input"]', 'Esha Kulkarni');
    setInput('[data-testid="email-input"]', 'esha@greenwood.test');
    setSelect('[data-testid="role-input"]', 'student');
    submit();

    const request = httpMock.expectOne('/api/users');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Esha Kulkarni',
      email: 'esha@greenwood.test',
      phone: '',
      role: 'student',
    });
    request.flush({
      user: {
        ...USER,
        name: 'Esha Kulkarni',
        email: 'esha@greenwood.test',
        role: 'student',
        phone: '',
      },
      credentials: {
        email: 'esha@greenwood.test',
        password: 'Abcd@1234wxyz',
        sent: true,
      },
    });
    fixture.detectChanges();

    const panel = element().querySelector('[data-testid="credentials-panel"]');

    expect(panel).not.toBeNull();
    expect(element().textContent).toContain('esha@greenwood.test');
    expect(
      element().querySelector('[data-testid="credentials-password"]')?.textContent?.trim(),
    ).toBe('Abcd@1234wxyz');
    expect(element().querySelector('a[href="/users?saved=1"]')).not.toBeNull();

    panel?.querySelector<HTMLButtonElement>('.btn-ghost')?.click();
    fixture.detectChanges();

    expect(panel?.textContent).toContain('Copied');
  });

  it('blocks submission until the required fields are valid', () => {
    createPage();

    submit();

    httpMock.expectNone('/api/users');
    expect(element().textContent).toContain('Name is required.');
    expect(element().textContent).toContain('Email is required.');
  });

  it('shows a server error when the email is already taken', () => {
    createPage();

    setInput('[data-testid="name-input"]', 'Copy Cat');
    setInput('[data-testid="email-input"]', 'teacher@greenwood.test');
    submit();

    httpMock
      .expectOne('/api/users')
      .flush(
        { message: 'A user with this email already exists.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(element().textContent).toContain('A user with this email already exists.');
  });

  it('prefills the form and saves an edited user', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    routeStub.snapshot.paramMap = convertToParamMap({ id: 'u1' });
    createPage();
    httpMock.expectOne('/api/users/u1').flush(USER);
    fixture.detectChanges();

    expect(input('[data-testid="name-input"]').value).toBe('Chetan Joshi');
    expect(input('[data-testid="email-input"]').value).toBe('teacher@greenwood.test');
    expect(input('[data-testid="phone-input"]').value).toBe('+91 90000 00001');

    setInput('[data-testid="name-input"]', 'Chetan J. Joshi');
    submit();

    const request = httpMock.expectOne('/api/users/u1');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      name: 'Chetan J. Joshi',
      email: 'teacher@greenwood.test',
      phone: '+91 90000 00001',
      role: 'teacher',
    });
    request.flush({ ...USER, name: 'Chetan J. Joshi' });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/users'], {
      queryParams: { saved: '1' },
    });
  });

  it('locks the role selector when editing your own account', () => {
    signIn('u1');

    routeStub.snapshot.paramMap = convertToParamMap({ id: 'u1' });
    createPage();
    httpMock.expectOne('/api/users/u1').flush(USER);
    fixture.detectChanges();

    expect(element().querySelector<HTMLSelectElement>('[data-testid="role-input"]')?.disabled).toBe(
      true,
    );
    expect(element().textContent).toContain('You cannot change your own role.');
  });

  it('shows a load error and retries', () => {
    routeStub.snapshot.paramMap = convertToParamMap({ id: 'u1' });
    createPage();

    httpMock
      .expectOne('/api/users/u1')
      .flush({ message: 'User not found.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().textContent).toContain('User not found.');

    element().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    httpMock.expectOne('/api/users/u1').flush(USER);
    fixture.detectChanges();

    expect(input('[data-testid="name-input"]').value).toBe('Chetan Joshi');
  });
});
