import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminPlansService } from '../../../core/api/admin-plans.service';
import type { CreatePlanRequest } from '../../../core/api/admin-plans.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

const NAME_MAX_LENGTH = 60;
const TAGLINE_MAX_LENGTH = 160;
const FEATURES_MAX = 12;
const FEATURE_MAX_LENGTH = 80;

type FieldName =
  | 'name'
  | 'tagline'
  | 'monthlyPrice'
  | 'annualPrice'
  | 'featuresText'
  | 'maxStudents'
  | 'maxTeachers'
  | 'maxTotalUsers'
  | 'sortOrder';

function parseFeatures(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function featuresValidator(control: AbstractControl<string>): ValidationErrors | null {
  const lines = parseFeatures(control.value);

  if (lines.length > FEATURES_MAX) {
    return { features: 'count' };
  }

  if (lines.some((line) => line.length > FEATURE_MAX_LENGTH)) {
    return { features: 'length' };
  }

  return null;
}

@Component({
  selector: 'app-plan-form',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './plan-form.html',
  styleUrl: './plan-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanForm {
  private readonly plansApi = inject(AdminPlansService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly code = this.route.snapshot.paramMap.get('code');
  protected readonly editing = this.code !== null;
  protected readonly canManage = computed(() => this.adminAuth.user()?.role === 'super_admin');

  protected readonly loading = signal(this.editing);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly customPrice = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredValidator,
        Validators.minLength(2),
        Validators.maxLength(NAME_MAX_LENGTH),
      ],
    }),
    tagline: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(TAGLINE_MAX_LENGTH)],
    }),
    customPrice: new FormControl(false, { nonNullable: true }),
    monthlyPrice: new FormControl<number | null>(null, {
      validators: [Validators.min(0), Validators.max(10_000_000)],
    }),
    annualPrice: new FormControl<number | null>(null, {
      validators: [Validators.min(0), Validators.max(100_000_000)],
    }),
    featuresText: new FormControl('', { nonNullable: true, validators: [featuresValidator] }),
    maxStudents: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    maxTeachers: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    maxTotalUsers: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    featured: new FormControl(false, { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
    sortOrder: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
  });

  constructor() {
    this.form.controls.customPrice.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((custom) => this.setCustomPrice(custom));

    if (this.canManage() && this.editing) {
      this.load();
    } else {
      this.loading.set(false);
    }
  }

  protected load(): void {
    if (this.code === null) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.plansApi
      .get(this.code)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => {
          this.form.patchValue({
            name: plan.name,
            tagline: plan.tagline,
            monthlyPrice: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
            featuresText: plan.features.join('\n'),
            maxStudents: plan.limits.maxStudents,
            maxTeachers: plan.limits.maxTeachers,
            maxTotalUsers: plan.limits.maxTotalUsers,
            featured: plan.featured,
            active: plan.active,
            sortOrder: plan.sortOrder,
          });
          this.setCustomPrice(plan.monthlyPrice === null && plan.annualPrice === null);
          this.form.controls.customPrice.setValue(this.customPrice());
        },
        error: (error: unknown) => this.loadError.set(this.messageOf(error)),
      });
  }

  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    switch (field) {
      case 'name':
        if (control.hasError('required')) {
          return 'Plan name is required.';
        }

        return control.hasError('minlength')
          ? 'Use at least 2 characters.'
          : `Must be ${NAME_MAX_LENGTH} characters or fewer.`;
      case 'tagline':
        return `Must be ${TAGLINE_MAX_LENGTH} characters or fewer.`;
      case 'featuresText':
        return `Use up to ${FEATURES_MAX} features of ${FEATURE_MAX_LENGTH} characters or fewer.`;
      default:
        return 'Enter zero or a positive number.';
    }
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const custom = value.customPrice;

    if (!custom && value.monthlyPrice === null && value.annualPrice === null) {
      this.formError.set('Enter a monthly or annual price, or switch on custom pricing.');
      return;
    }

    const payload: CreatePlanRequest = {
      name: value.name.trim(),
      tagline: value.tagline.trim(),
      monthlyPrice: custom ? null : value.monthlyPrice,
      annualPrice: custom ? null : value.annualPrice,
      features: parseFeatures(value.featuresText),
      maxStudents: value.maxStudents,
      maxTeachers: value.maxTeachers,
      maxTotalUsers: value.maxTotalUsers,
      featured: value.featured,
      active: value.active,
      sortOrder: value.sortOrder ?? 0,
    };

    this.submitting.set(true);

    const request$ =
      this.code === null ? this.plansApi.create(payload) : this.plansApi.update(this.code, payload);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () =>
          void this.router.navigate(['/admin/plans'], {
            queryParams: { saved: '1' },
          }),
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  private setCustomPrice(custom: boolean): void {
    this.customPrice.set(custom);

    const priceControls = [this.form.controls.monthlyPrice, this.form.controls.annualPrice];

    for (const control of priceControls) {
      if (custom) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
