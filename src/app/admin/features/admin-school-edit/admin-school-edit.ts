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
import { finalize, forkJoin } from 'rxjs';
import { AdminPlansService } from '../../../core/api/admin-plans.service';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import { AdminSchoolsService } from '../../../core/api/admin-schools.service';
import type {
  TenantBoard,
  TenantType,
  UpdateSchoolRequest,
} from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { emailValidator, requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;
const PINCODE_PATTERN = /^\d{4,10}$/;
const ACADEMIC_YEAR_PATTERN = /^\d{4}(-\d{2,4})?$/;
const WEBSITE_PATTERN = /^https?:\/\/\S+$/;
const NAME_MAX_LENGTH = 120;
const LINE_MAX_LENGTH = 160;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Kathmandu',
  'Asia/Dhaka',
  'Asia/Colombo',
  'Asia/Karachi',
  'Asia/Singapore',
  'Asia/Riyadh',
  'Europe/London',
  'America/New_York',
  'Australia/Sydney',
  'UTC',
];

type FieldName =
  | 'name'
  | 'slug'
  | 'plan'
  | 'email'
  | 'phone'
  | 'website'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'state'
  | 'pincode'
  | 'country'
  | 'tagline'
  | 'brandColor'
  | 'affiliationNumber'
  | 'principalName'
  | 'academicYear';

@Component({
  selector: 'app-admin-school-edit',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './admin-school-edit.html',
  styleUrl: './admin-school-edit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSchoolEdit {
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminPlans = inject(AdminPlansService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly canManage = computed(() => this.adminAuth.user()?.role === 'super_admin');

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly slugServerError = signal<string | null>(null);
  protected readonly logo = signal('');
  protected readonly logoError = signal<string | null>(null);
  private readonly schoolTimezone = signal('');
  private readonly plans = signal<AdminPlan[]>([]);

  protected readonly planOptions = computed(() => {
    const selected = this.form.controls.plan.value;

    return this.plans().filter((plan) => plan.active || plan.code === selected);
  });

  protected readonly timezones = computed(() => {
    const current = this.schoolTimezone();

    return current !== '' && !TIMEZONES.includes(current) ? [current, ...TIMEZONES] : TIMEZONES;
  });

  protected readonly types: { value: TenantType; label: string }[] = [
    { value: 'school', label: 'School' },
    { value: 'institute', label: 'Institute' },
  ];

  protected readonly boards: { value: TenantBoard | ''; label: string }[] = [
    { value: '', label: 'Not set' },
    { value: 'cbse', label: 'CBSE' },
    { value: 'icse', label: 'ICSE' },
    { value: 'state', label: 'State board' },
    { value: 'ib', label: 'IB' },
    { value: 'other', label: 'Other' },
  ];

  protected readonly presets = [
    { name: 'Maroon', color: '#73113a' },
    { name: 'Royal blue', color: '#1d4ed8' },
    { name: 'Emerald', color: '#047857' },
    { name: 'Violet', color: '#6d28d9' },
    { name: 'Amber', color: '#b45309' },
    { name: 'Midnight', color: '#0f172a' },
  ];

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.maxLength(NAME_MAX_LENGTH)],
    }),
    slug: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.pattern(SLUG_PATTERN)],
    }),
    type: new FormControl<TenantType>('school', { nonNullable: true }),
    plan: new FormControl('', { nonNullable: true, validators: [requiredValidator] }),
    email: new FormControl('', { nonNullable: true, validators: [emailValidator] }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_PATTERN)],
    }),
    website: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(WEBSITE_PATTERN)],
    }),
    addressLine1: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(LINE_MAX_LENGTH)],
    }),
    addressLine2: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(LINE_MAX_LENGTH)],
    }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] }),
    state: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] }),
    pincode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PINCODE_PATTERN)],
    }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] }),
    board: new FormControl<TenantBoard | ''>('', { nonNullable: true }),
    affiliationNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(60)],
    }),
    principalName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(NAME_MAX_LENGTH)],
    }),
    academicYear: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(ACADEMIC_YEAR_PATTERN)],
    }),
    timezone: new FormControl('Asia/Kolkata', { nonNullable: true }),
    tagline: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(160)] }),
    brandColor: new FormControl('#73113a', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
  });

  constructor() {
    if (this.canManage()) {
      this.load();
    } else {
      this.loading.set(false);
    }
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      detail: this.adminSchools.get(this.id),
      plans: this.adminPlans.list(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ detail: { school }, plans }) => {
          this.plans.set(plans);
          this.form.patchValue({
            name: school.name,
            slug: school.slug,
            type: school.type,
            plan: school.plan,
            email: school.email,
            phone: school.phone,
            website: school.website,
            addressLine1: school.addressLine1,
            addressLine2: school.addressLine2,
            city: school.city,
            state: school.state,
            pincode: school.pincode,
            country: school.country,
            board: (school.board || '') as TenantBoard | '',
            affiliationNumber: school.affiliationNumber,
            principalName: school.principalName,
            academicYear: school.academicYear,
            timezone: school.timezone,
            tagline: school.tagline,
            brandColor: school.brandColor,
          });
          this.logo.set(school.logo);
          this.schoolTimezone.set(school.timezone);
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
      switch (field) {
        case 'name':
          return 'School name is required.';
        case 'slug':
          return 'Login domain is required.';
        case 'plan':
          return 'Select a plan.';
        default:
          return 'Brand colour is required.';
      }
    }

    switch (field) {
      case 'slug':
        return 'Use 3–60 lowercase letters, numbers or dashes.';
      case 'email':
        return 'Enter a valid email address.';
      case 'phone':
        return 'Enter a valid contact number.';
      case 'website':
        return 'Enter a URL starting with http:// or https://.';
      case 'pincode':
        return 'Pincode must be 4 to 10 digits.';
      case 'academicYear':
        return 'Use a format like 2025-26.';
      case 'name':
        return `Must be ${NAME_MAX_LENGTH} characters or fewer.`;
      case 'addressLine1':
      case 'addressLine2':
        return `Must be ${LINE_MAX_LENGTH} characters or fewer.`;
      default:
        return 'This value is not valid.';
    }
  }

  protected applyPreset(color: string): void {
    this.form.controls.brandColor.setValue(color);
    this.form.controls.brandColor.markAsDirty();
  }

  protected onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file) {
      return;
    }

    if (!LOGO_TYPES.includes(file.type)) {
      this.logoError.set('Use a PNG, JPEG, WebP or SVG image.');
      return;
    }

    if (file.size > LOGO_MAX_BYTES) {
      this.logoError.set('The logo must be 2 MB or smaller.');
      return;
    }

    this.logoError.set(null);
    this.logo.set('');

    const reader = new FileReader();

    reader.onload = () => {
      this.logo.set(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => this.logoError.set('Could not read that file. Please try again.');
    reader.readAsDataURL(file);
  }

  protected removeLogo(): void {
    this.logo.set('');
    this.logoError.set(null);
  }

  protected submit(): void {
    this.formError.set(null);
    this.slugServerError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: UpdateSchoolRequest = {
      name: value.name.trim(),
      slug: value.slug.trim().toLowerCase(),
      type: value.type,
      plan: value.plan,
      email: value.email.trim(),
      phone: value.phone.trim(),
      website: value.website.trim(),
      addressLine1: value.addressLine1.trim(),
      addressLine2: value.addressLine2.trim(),
      city: value.city.trim(),
      state: value.state.trim(),
      pincode: value.pincode.trim(),
      country: value.country.trim(),
      board: value.board,
      affiliationNumber: value.affiliationNumber.trim(),
      principalName: value.principalName.trim(),
      academicYear: value.academicYear.trim(),
      timezone: value.timezone,
      tagline: value.tagline.trim(),
      brandColor: value.brandColor,
      logo: this.logo(),
    };

    this.submitting.set(true);

    this.adminSchools
      .update(this.id, payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () =>
          void this.router.navigate(['/admin/schools', this.id], {
            queryParams: { saved: '1' },
          }),
        error: (error: unknown) => {
          const message = this.messageOf(error);

          if ((error as { status?: number }).status === 409) {
            this.slugServerError.set(message);
          } else {
            this.formError.set(message);
          }
        },
      });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
