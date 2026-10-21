import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import type { MediumRecord } from '../../core/api/mediums.types';
import type { StandardRecord } from '../../core/api/standards.types';
import { MediumsService } from '../../core/api/mediums.service';
import type { RoleOption } from '../../core/api/roles.types';
import { RolesService } from '../../core/api/roles.service';
import { SchoolUsersService } from '../../core/api/school-users.service';
import type {
  CreateUserRequest,
  GeneratedCredentials,
  SchoolUserRole,
  ScienceGroup,
  StudentGender,
  StudentProfileRequest,
  StudentStream,
  UpdateUserRequest,
} from '../../core/api/school-users.types';
import type { SubjectRecord } from '../../core/api/subjects.types';
import { SubjectsService } from '../../core/api/subjects.service';
import { StandardsService } from '../../core/api/standards.service';
import { AuthService } from '../../core/auth/auth.service';
import { emailValidator, requiredValidator } from '../../shared/forms/validators';
import { Icon } from '../../shared/icon/icon';

const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;
const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const AADHAAR_PATTERN = /^\d{12}$/;
const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_]{1,39}$/;
const NAME_MAX_LENGTH = 120;
const PART_NAME_MAX_LENGTH = 60;
const ADDRESS_MAX_LENGTH = 400;

const FALLBACK_ROLES: RoleOption[] = [
  { key: 'school_admin', name: 'School admin', isSystem: true },
  { key: 'teacher', name: 'Teacher', isSystem: true },
  { key: 'staff', name: 'Staff', isSystem: true },
  { key: 'student', name: 'Student', isSystem: true },
];

const GENDERS: { value: StudentGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const STREAMS: { value: StudentStream; label: string }[] = [
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'none', label: 'None' },
];

const SCIENCE_GROUPS: { value: ScienceGroup; label: string }[] = [
  { value: 'a', label: 'Group A' },
  { value: 'b', label: 'Group B' },
  { value: 'ab', label: 'Group AB' },
];

type FieldName = 'name' | 'email' | 'phone' | 'role';

function trimmedPart(maxLength: number) {
  return {
    nonNullable: true as const,
    validators: [Validators.maxLength(maxLength)],
  };
}

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private readonly schoolUsers = inject(SchoolUsersService);
  private readonly rolesApi = inject(RolesService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly mediumsApi = inject(MediumsService);
  private readonly standardsApi = inject(StandardsService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly role = input<string>();
  readonly from = input<string>();

  private readonly id = this.route.snapshot.paramMap.get('id');

  protected readonly editing = this.id !== null;
  protected readonly loading = signal(this.editing);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly emailServerError = signal<string | null>(null);
  protected readonly credentials = signal<GeneratedCredentials | null>(null);
  protected readonly copied = signal(false);
  protected readonly isSelf = signal(false);
  protected readonly roleOptions = signal<RoleOption[]>(FALLBACK_ROLES);
  protected readonly subjectOptions = signal<SubjectRecord[]>([]);
  protected readonly mediumOptions = signal<MediumRecord[]>([]);
  protected readonly standardOptions = signal<StandardRecord[]>([]);
  protected readonly mastersLoading = signal(false);
  protected readonly mastersError = signal<string | null>(null);
  protected readonly subjectQuery = signal('');

  protected readonly genders = GENDERS;
  protected readonly streams = STREAMS;
  protected readonly scienceGroups = SCIENCE_GROUPS;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.maxLength(NAME_MAX_LENGTH)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, emailValidator],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_PATTERN)],
    }),
    role: new FormControl<SchoolUserRole>('teacher', { nonNullable: true }),
  });

  protected readonly student = new FormGroup({
    firstName: new FormControl('', trimmedPart(PART_NAME_MAX_LENGTH)),
    surname: new FormControl('', trimmedPart(PART_NAME_MAX_LENGTH)),
    lastName: new FormControl('', trimmedPart(PART_NAME_MAX_LENGTH)),
    grNumber: new FormControl('', trimmedPart(30)),
    rollNumber: new FormControl('', trimmedPart(30)),
    fatherFullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    motherFullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    gender: new FormControl<StudentGender | ''>('', { nonNullable: true }),
    dateOfBirth: new FormControl('', { nonNullable: true }),
    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(ADDRESS_MAX_LENGTH)],
    }),
    mobile: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(MOBILE_PATTERN)],
    }),
    whatsappNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(MOBILE_PATTERN)],
    }),
    aadhaarNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(AADHAAR_PATTERN)],
    }),
    stream: new FormControl<StudentStream | ''>('', { nonNullable: true }),
    scienceGroup: new FormControl<ScienceGroup | ''>('', { nonNullable: true }),
    mediumId: new FormControl('', { nonNullable: true }),
    standardId: new FormControl('', { nonNullable: true }),
    subjectIds: new FormControl<string[]>([], { nonNullable: true }),
  });

  private readonly roleValue = toSignal(this.form.controls.role.valueChanges, {
    initialValue: this.form.controls.role.value,
  });
  private readonly streamValue = toSignal(this.student.controls.stream.valueChanges, {
    initialValue: this.student.controls.stream.value,
  });

  protected readonly roleLocked = computed(() => this.isSelf());
  protected readonly isStudent = computed(() => this.roleValue() === 'student');
  protected readonly isScience = computed(() => this.streamValue() === 'science');
  protected readonly filteredSubjects = computed(() => {
    const query = this.subjectQuery().trim().toLowerCase();

    if (query === '') {
      return this.subjectOptions();
    }

    return this.subjectOptions().filter(
      (subject) =>
        subject.name.toLowerCase().includes(query) ||
        subject.standardName.toLowerCase().includes(query),
    );
  });
  protected readonly returnPath = computed(() => {
    const from = this.from();

    return from !== undefined && from.startsWith('/users') ? from : '/users';
  });

  private mastersRequested = false;

  ngOnInit(): void {
    const preset = this.role();

    if (!this.editing && preset !== undefined && ROLE_KEY_PATTERN.test(preset)) {
      this.form.controls.role.setValue(preset);
    }

    this.syncRole(this.form.controls.role.value);
  }

  constructor() {
    this.loadRoleOptions();

    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => this.syncRole(role));

    if (this.editing) {
      this.load();
    }
  }

  protected loadRoleOptions(): void {
    this.rolesApi
      .options()
      .pipe(
        catchError(() => of<RoleOption[]>([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((roles) => {
        if (roles.length > 0) {
          this.roleOptions.set(roles);
        }
      });
  }

  protected visibleRoleOptions(): RoleOption[] {
    if (this.auth.user()?.role === 'school_admin') {
      return this.roleOptions();
    }

    const current = this.form.controls.role.value;

    return this.roleOptions().filter(
      (option) => option.key !== 'school_admin' || option.key === current,
    );
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.schoolUsers
      .get(this.id ?? '')
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          this.form.patchValue({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          });

          if (user.role === 'student') {
            const profile = user.studentProfile;

            this.student.patchValue(
              profile === null
                ? { firstName: user.name }
                : {
                    firstName: profile.firstName,
                    surname: profile.surname,
                    lastName: profile.lastName,
                    grNumber: profile.grNumber,
                    rollNumber: profile.rollNumber,
                    fatherFullName: profile.fatherFullName,
                    motherFullName: profile.motherFullName,
                    gender: profile.gender ?? '',
                    dateOfBirth: profile.dateOfBirth ?? '',
                    address: profile.address,
                    mobile: profile.mobile,
                    whatsappNumber: profile.whatsappNumber,
                    stream: profile.stream ?? '',
                    scienceGroup: profile.scienceGroup ?? '',
                    mediumId: profile.mediumId ?? '',
                    standardId: profile.standardId ?? '',
                    subjectIds: profile.subjectIds,
                  },
            );
          }

          this.syncRole(user.role);

          const self = user.id === (this.auth.user()?.id ?? null);

          this.isSelf.set(self);

          if (self) {
            this.form.controls.role.disable();
          }
        },
        error: (error: unknown) => this.loadError.set(this.messageOf(error)),
      });
  }

  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      if (field === 'name') {
        return 'Name is required.';
      }

      return field === 'email' ? 'Email is required.' : 'This field is required.';
    }

    switch (field) {
      case 'name':
        return `Must be ${NAME_MAX_LENGTH} characters or fewer.`;
      case 'email':
        return 'Enter a valid email address.';
      case 'phone':
        return 'Enter a valid contact number.';
      default:
        return 'This value is not valid.';
    }
  }

  protected studentError(
    field: 'firstName' | 'mobile' | 'whatsappNumber' | 'aadhaarNumber',
  ): string | null {
    const control = this.student.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (field === 'firstName') {
      return control.hasError('required')
        ? 'First name is required.'
        : `Must be ${PART_NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (field === 'aadhaarNumber') {
      return 'Enter a 12-digit Aadhaar number.';
    }

    return 'Enter a 10-digit mobile number.';
  }

  protected subjectSelected(id: string): boolean {
    return this.student.controls.subjectIds.value.includes(id);
  }

  protected toggleSubject(id: string, checked: boolean): void {
    const control = this.student.controls.subjectIds;
    const selected = new Set(control.value);

    if (checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }

    control.setValue([...selected]);
    control.markAsDirty();
  }

  protected submit(): void {
    this.formError.set(null);
    this.emailServerError.set(null);

    if (this.form.invalid || (this.isStudent() && this.student.invalid)) {
      this.form.markAllAsTouched();
      this.student.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const student = this.student.getRawValue();
    const isStudent = value.role === 'student';
    const name = isStudent
      ? [student.firstName.trim(), student.lastName.trim() || student.surname.trim()]
          .filter((part) => part !== '')
          .join(' ')
      : value.name.trim();

    const base = {
      name,
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      role: value.role,
    };
    const studentProfile: StudentProfileRequest | null = isStudent
      ? {
          firstName: student.firstName.trim(),
          surname: student.surname.trim(),
          lastName: student.lastName.trim(),
          grNumber: student.grNumber.trim(),
          rollNumber: student.rollNumber.trim(),
          fatherFullName: student.fatherFullName.trim(),
          motherFullName: student.motherFullName.trim(),
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          address: student.address.trim(),
          mobile: student.mobile.trim(),
          whatsappNumber: student.whatsappNumber.trim(),
          stream: student.stream,
          scienceGroup: student.scienceGroup,
          subjectIds: student.subjectIds,
          aadhaarNumber: student.aadhaarNumber.trim(),
          mediumId: student.mediumId,
          standardId: student.standardId,
        }
      : null;

    this.submitting.set(true);

    if (this.editing) {
      const payload: UpdateUserRequest =
        studentProfile === null ? base : { ...base, studentProfile };

      this.schoolUsers
        .update(this.id ?? '', payload)
        .pipe(
          finalize(() => this.submitting.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () =>
            void this.router.navigate([this.returnPath()], { queryParams: { saved: '1' } }),
          error: (error: unknown) => this.handleSaveError(error),
        });

      return;
    }

    const payload: CreateUserRequest = studentProfile === null ? base : { ...base, studentProfile };

    this.schoolUsers
      .create(payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.credentials.set(result.credentials);
          this.copied.set(false);
        },
        error: (error: unknown) => this.handleSaveError(error),
      });
  }

  protected copyPassword(): void {
    const credentials = this.credentials();

    if (credentials === null) {
      return;
    }

    try {
      void navigator.clipboard?.writeText(credentials.password);
    } catch {
      // Clipboard access can be denied; the password stays visible below.
    }

    this.copied.set(true);
  }

  private syncRole(role: SchoolUserRole): void {
    const isStudent = role === 'student';
    const name = this.form.controls.name;
    const email = this.form.controls.email;
    const firstName = this.student.controls.firstName;

    if (isStudent) {
      name.removeValidators(requiredValidator);
      email.removeValidators(requiredValidator);
      firstName.addValidators(requiredValidator);
      this.loadMasters();
    } else {
      name.addValidators(requiredValidator);
      email.addValidators(requiredValidator);
      firstName.removeValidators(requiredValidator);
    }

    name.updateValueAndValidity({ emitEvent: false });
    email.updateValueAndValidity({ emitEvent: false });
    firstName.updateValueAndValidity({ emitEvent: false });
  }

  private loadMasters(): void {
    if (this.mastersRequested) {
      return;
    }

    this.mastersRequested = true;
    this.mastersLoading.set(true);
    this.mastersError.set(null);
    this.loadSubjects(1);
    this.loadMediums(1);
    this.loadStandards(1);
  }

  private loadSubjects(page: number): void {
    this.subjectsApi
      .list({ status: 'active', page, pageSize: 50, sort: 'name', dir: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.subjectOptions.update((subjects) => [...subjects, ...result.items]);

          if (page * result.pageSize < result.total) {
            this.loadSubjects(page + 1);
          } else {
            this.mastersLoading.set(false);
          }
        },
        error: (error: unknown) => {
          this.mastersLoading.set(false);
          this.mastersError.set(this.messageOf(error));
        },
      });
  }

  private loadMediums(page: number): void {
    this.mediumsApi
      .list({ status: 'active', page, pageSize: 50, sort: 'name', dir: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.mediumOptions.update((mediums) => [...mediums, ...result.items]);

          if (page * result.pageSize < result.total) {
            this.loadMediums(page + 1);
          }
        },
        error: (error: unknown) => this.mastersError.set(this.messageOf(error)),
      });
  }

  private loadStandards(page: number): void {
    this.standardsApi
      .list({ status: 'active', page, pageSize: 50, sort: 'order', dir: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.standardOptions.update((standards) => [...standards, ...result.items]);

          if (page * result.pageSize < result.total) {
            this.loadStandards(page + 1);
          }
        },
        error: (error: unknown) => this.mastersError.set(this.messageOf(error)),
      });
  }

  private handleSaveError(error: unknown): void {
    const message = this.messageOf(error);

    if ((error as { status?: number }).status === 409) {
      this.emailServerError.set(message);
    } else {
      this.formError.set(message);
    }
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
