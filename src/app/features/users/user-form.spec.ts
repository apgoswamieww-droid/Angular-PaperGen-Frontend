import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { MediumRecord } from '../../core/api/mediums.types';
import type { SchoolUserRecord } from '../../core/api/school-users.types';
import type { SubjectRecord } from '../../core/api/subjects.types';
import type { StandardRecord } from '../../core/api/standards.types';
import { AuthService } from '../../core/auth/auth.service';
import { UserForm } from './user-form';

const USER: SchoolUserRecord = {
  id: 'u1',
  name: 'Chetan Joshi',
  email: 'teacher@greenwood.test',
  phone: '+91 90000 00001',
  role: 'teacher',
  studentProfile: null,
  status: 'active',
  lastLoginAt: null,
  createdAt: '2026-10-01T10:00:00.000Z',
};

const STUDENT: SchoolUserRecord = {
  id: 's1',
  name: 'Kabir Rao',
  email: 'kabir@greenwood.test',
  phone: '',
  role: 'student',
  studentProfile: {
    surname: 'Rao',
    firstName: 'Kabir',
    lastName: 'Rao',
    grNumber: 'GR-2026-017',
    rollNumber: '21',
    fatherFullName: 'Mohan Rao',
    motherFullName: 'Lata Rao',
    gender: 'male',
    dateOfBirth: '2011-01-20',
    address: '5 Hill View',
    mobile: '9123456780',
    whatsappNumber: '',
    stream: 'science',
    scienceGroup: 'ab',
    subjectIds: ['sub1'],
    aadhaarNumber: '',
    mediumId: 'med1',
    standardId: 'std1',
  },
  status: 'active',
  lastLoginAt: null,
  createdAt: '2026-10-02T10:00:00.000Z',
};

const SUBJECTS: SubjectRecord[] = [
  {
    id: 'sub1',
    name: 'Science',
    standardId: 'std1',
    standardName: 'Class 10',
    mediumId: 'med1',
    mediumName: 'English',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'sub2',
    name: 'Mathematics',
    standardId: 'std1',
    standardName: 'Class 10',
    mediumId: 'med1',
    mediumName: 'English',
    order: 2,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const MEDIUMS: MediumRecord[] = [
  {
    id: 'med1',
    name: 'English',
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const STANDARDS: StandardRecord[] = [
  {
    id: 'std1',
    name: 'Class 10',
    mediumId: 'med1',
    mediumName: 'English',
    order: 1,
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  },
];

const STUDENT_PROFILE = {
  firstName: 'Esha',
  surname: 'Kulkarni',
  lastName: '',
  grNumber: '',
  rollNumber: '',
  fatherFullName: '',
  motherFullName: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  mobile: '',
  whatsappNumber: '',
  stream: '',
  scienceGroup: '',
  subjectIds: [],
  aadhaarNumber: '',
  mediumId: '',
  standardId: '',
};

const ROLE_OPTIONS = [
  { key: 'school_admin', name: 'School admin', isSystem: true },
  { key: 'teacher', name: 'Teacher', isSystem: true },
  { key: 'staff', name: 'Staff', isSystem: true },
  { key: 'student', name: 'Student', isSystem: true },
  { key: 'exam_coordinator', name: 'Exam coordinator', isSystem: false },
];

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
    httpMock.expectOne('/api/roles/options').flush(ROLE_OPTIONS);
    fixture.detectChanges();
  }

  function flushMasters(subjects = SUBJECTS, mediums = MEDIUMS, standards = STANDARDS): void {
    httpMock
      .expectOne((request) => request.url === '/api/subjects' && request.method === 'GET')
      .flush({
        items: subjects,
        total: subjects.length,
        page: 1,
        pageSize: 50,
        summary: { active: subjects.length, inactive: 0, deleted: 0 },
      });
    httpMock
      .expectOne((request) => request.url === '/api/mediums' && request.method === 'GET')
      .flush({
        items: mediums,
        total: mediums.length,
        page: 1,
        pageSize: 50,
        summary: { active: mediums.length, inactive: 0, deleted: 0 },
      });
    httpMock
      .expectOne((request) => request.url === '/api/standards' && request.method === 'GET')
      .flush({
        items: standards,
        total: standards.length,
        page: 1,
        pageSize: 50,
        summary: { active: standards.length, inactive: 0, deleted: 0 },
      });
    fixture.detectChanges();
  }

  function setCheckbox(selector: string, checked: boolean): void {
    const box = input(selector);

    box.checked = checked;
    box.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('creates a user and reveals the generated credentials', () => {
    createPage();

    setInput('[data-testid="name-input"]', 'Esha Kulkarni');
    setInput('[data-testid="email-input"]', 'esha@greenwood.test');
    submit();

    const request = httpMock.expectOne('/api/users');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Esha Kulkarni',
      email: 'esha@greenwood.test',
      phone: '',
      role: 'teacher',
    });
    request.flush({
      user: {
        ...USER,
        name: 'Esha Kulkarni',
        email: 'esha@greenwood.test',
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

  it('creates a student without an email and shows the generated password', () => {
    createPage();

    setSelect('[data-testid="role-input"]', 'student');
    flushMasters();

    expect(element().querySelector('[data-testid="name-input"]')).toBeNull();

    setInput('[data-testid="first-name-input"]', 'Esha');
    setInput('[data-testid="surname-input"]', 'Kulkarni');
    submit();

    const request = httpMock.expectOne('/api/users');

    expect(request.request.body).toEqual({
      name: 'Esha Kulkarni',
      email: '',
      phone: '',
      role: 'student',
      studentProfile: STUDENT_PROFILE,
    });
    request.flush({
      user: {
        ...USER,
        name: 'Esha Kulkarni',
        email: '',
        role: 'student',
        phone: '',
      },
      credentials: { email: '', password: 'Abcd@1234wxyz', sent: false },
    });
    fixture.detectChanges();

    expect(element().textContent).toContain('No email address was provided');
    expect(element().textContent).toContain('Not provided');
    expect(
      element().querySelector('[data-testid="credentials-password"]')?.textContent?.trim(),
    ).toBe('Abcd@1234wxyz');
  });

  it('requires a first name for students', () => {
    createPage();

    setSelect('[data-testid="role-input"]', 'student');
    flushMasters();

    submit();

    httpMock.expectNone('/api/users');
    expect(element().textContent).toContain('First name is required.');
  });

  it('offers the tenant roles, including custom roles', () => {
    createPage();

    const select = element().querySelector<HTMLSelectElement>('[data-testid="role-input"]');
    const option = select?.querySelector<HTMLOptionElement>('option[value="exam_coordinator"]');

    expect(option?.textContent).toContain('Exam coordinator');
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

  it('preselects the role and returns to a role page', () => {
    fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('role', 'student');
    fixture.componentRef.setInput('from', '/users/students');
    httpMock.expectOne('/api/roles/options').flush(ROLE_OPTIONS);
    fixture.detectChanges();
    flushMasters();

    expect(element().querySelector<HTMLSelectElement>('[data-testid="role-input"]')?.value).toBe(
      'student',
    );
    expect(element().querySelector('.crumbs a')?.getAttribute('href')).toBe('/users/students');
    expect(element().querySelector('.form__actions a')?.getAttribute('href')).toBe(
      '/users/students',
    );
  });

  it('returns to the role page after creating a user', () => {
    fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('role', 'student');
    fixture.componentRef.setInput('from', '/users/students');
    httpMock.expectOne('/api/roles/options').flush(ROLE_OPTIONS);
    fixture.detectChanges();
    flushMasters();

    setInput('[data-testid="first-name-input"]', 'Esha');
    setInput('[data-testid="surname-input"]', 'Kulkarni');
    setInput('[data-testid="email-input"]', 'esha@greenwood.test');
    submit();

    const request = httpMock.expectOne('/api/users');

    expect(request.request.body).toEqual({
      name: 'Esha Kulkarni',
      email: 'esha@greenwood.test',
      phone: '',
      role: 'student',
      studentProfile: STUDENT_PROFILE,
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

    expect(element().querySelector('a[href="/users/students?saved=1"]')).not.toBeNull();
  });

  it('prefills and saves a student profile with masters', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    routeStub.snapshot.paramMap = convertToParamMap({ id: 's1' });
    createPage();
    httpMock.expectOne('/api/users/s1').flush(STUDENT);
    fixture.detectChanges();
    flushMasters();

    expect(input('[data-testid="first-name-input"]').value).toBe('Kabir');
    expect(input('[data-testid="surname-input"]').value).toBe('Rao');
    expect(input('[data-testid="gr-input"]').value).toBe('GR-2026-017');
    expect(input('[data-testid="roll-input"]').value).toBe('21');
    expect(input('[data-testid="dob-input"]').value).toBe('2011-01-20');
    expect(input('[data-testid="mobile-input"]').value).toBe('9123456780');
    expect(element().querySelector<HTMLSelectElement>('[data-testid="medium-input"]')?.value).toBe(
      'med1',
    );
    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="standard-input"]')?.value,
    ).toBe('std1');
    expect(
      element().querySelector<HTMLSelectElement>('[data-testid="science-group-input"]')?.value,
    ).toBe('ab');
    expect(input('[data-subject="sub1"]').checked).toBe(true);

    setSelect('[data-testid="science-group-input"]', 'a');
    setCheckbox('[data-subject="sub2"]', true);
    submit();

    const request = httpMock.expectOne('/api/users/s1');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      name: 'Kabir Rao',
      email: 'kabir@greenwood.test',
      phone: '',
      role: 'student',
      studentProfile: {
        ...STUDENT.studentProfile,
        scienceGroup: 'a',
        subjectIds: ['sub1', 'sub2'],
      },
    });
    request.flush(STUDENT);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/users'], {
      queryParams: { saved: '1' },
    });
  });

  it('lands back on the role page after an edit', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    routeStub.snapshot.paramMap = convertToParamMap({ id: 'u1' });
    fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('from', '/users/teachers');
    httpMock.expectOne('/api/roles/options').flush(ROLE_OPTIONS);
    fixture.detectChanges();
    httpMock.expectOne('/api/users/u1').flush(USER);
    fixture.detectChanges();

    setInput('[data-testid="name-input"]', 'Chetan J. Joshi');
    submit();
    httpMock.expectOne('/api/users/u1').flush({ ...USER, name: 'Chetan J. Joshi' });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/users/teachers'], { queryParams: { saved: '1' } });
  });
});
