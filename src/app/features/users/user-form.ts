import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SchoolUsersService } from '../../core/api/school-users.service';
import type {
  CreateUserRequest,
  GeneratedCredentials,
  SchoolUserRole,
  UpdateUserRequest,
} from '../../core/api/school-users.types';
import { AuthService } from '../../core/auth/auth.service';
import { emailValidator, requiredValidator } from '../../shared/forms/validators';
import { Icon } from '../../shared/icon/icon';

const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;
const NAME_MAX_LENGTH = 120;

type FieldName = 'name' | 'email' | 'phone' | 'role';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private readonly schoolUsers = inject(SchoolUsersService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

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

  protected readonly roleOptions: { value: SchoolUserRole; label: string }[] = [
    { value: 'school_admin', label: 'School admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'staff', label: 'Staff' },
    { value: 'student', label: 'Student' },
  ];

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

  protected readonly roleLocked = computed(() => this.isSelf());

  constructor() {
    if (this.editing) {
      this.load();
    }
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
      return field === 'name' ? 'Name is required.' : 'Email is required.';
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

  protected submit(): void {
    this.formError.set(null);
    this.emailServerError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const base = {
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      role: value.role,
    };

    this.submitting.set(true);

    if (this.editing) {
      const payload: UpdateUserRequest = base;

      this.schoolUsers
        .update(this.id ?? '', payload)
        .pipe(
          finalize(() => this.submitting.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => void this.router.navigate(['/users'], { queryParams: { saved: '1' } }),
          error: (error: unknown) => this.handleSaveError(error),
        });

      return;
    }

    const payload: CreateUserRequest = base;

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
