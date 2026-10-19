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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminPlansService } from '../../../core/api/admin-plans.service';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import { AdminSchoolsService } from '../../../core/api/admin-schools.service';
import type {
  CreateSchoolRequest,
  CreateSchoolResult,
  TenantType,
} from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { emailValidator, requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

const NAME_MAX_LENGTH = 120;
const CITY_MAX_LENGTH = 80;

type FieldName = 'name' | 'city' | 'plan' | 'adminName' | 'adminEmail';

@Component({
  selector: 'app-admin-school-register',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './admin-school-register.html',
  styleUrl: './admin-school-register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSchoolRegister {
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminPlans = inject(AdminPlansService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly canRegister = computed(() => this.adminAuth.user()?.role === 'super_admin');
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly created = signal<CreateSchoolResult | null>(null);
  protected readonly plansLoading = signal(true);
  protected readonly plansError = signal<string | null>(null);
  protected readonly plans = signal<AdminPlan[]>([]);

  protected readonly types: { value: TenantType; label: string }[] = [
    { value: 'school', label: 'School' },
    { value: 'institute', label: 'Institute' },
  ];

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.maxLength(NAME_MAX_LENGTH)],
    }),
    type: new FormControl<TenantType>('school', { nonNullable: true }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(CITY_MAX_LENGTH)],
    }),
    plan: new FormControl('', { nonNullable: true, validators: [requiredValidator] }),
    adminName: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.maxLength(NAME_MAX_LENGTH)],
    }),
    adminEmail: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, emailValidator],
    }),
  });

  constructor() {
    if (this.canRegister()) {
      this.loadPlans();
    }
  }

  protected loadPlans(): void {
    this.plansLoading.set(true);
    this.plansError.set(null);

    this.adminPlans
      .list()
      .pipe(
        finalize(() => this.plansLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plans) => {
          const active = plans.filter((plan) => plan.active);

          this.plans.set(active);

          if (this.form.controls.plan.value === '') {
            const first = active[0];

            if (first !== undefined) {
              this.form.controls.plan.setValue(first.code);
            }
          }
        },
        error: (error: unknown) => this.plansError.set(this.messageOf(error)),
      });
  }

  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      switch (field) {
        case 'name':
          return 'School name is required.';
        case 'plan':
          return 'Select a plan.';
        case 'adminName':
          return "The admin's name is required.";
        default:
          return 'Admin email is required.';
      }
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return field === 'city'
      ? `City must be ${CITY_MAX_LENGTH} characters or fewer.`
      : `Must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateSchoolRequest = {
      name: value.name.trim(),
      type: value.type,
      city: value.city.trim() || undefined,
      plan: value.plan,
      adminName: value.adminName.trim(),
      adminEmail: value.adminEmail.trim(),
    };

    this.submitting.set(true);

    this.adminSchools
      .create(payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.created.set(result),
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected addAnother(): void {
    this.created.set(null);
    this.formError.set(null);
    this.form.reset({
      name: '',
      type: 'school',
      city: '',
      plan: this.plans()[0]?.code ?? '',
      adminName: '',
      adminEmail: '',
    });
  }

  protected planLabel(plan: string): string {
    return this.plans().find((option) => option.code === plan)?.name ?? plan;
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
