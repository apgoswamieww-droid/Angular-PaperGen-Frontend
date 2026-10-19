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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminPlansService } from '../../../core/api/admin-plans.service';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import { AdminSchoolsService } from '../../../core/api/admin-schools.service';
import type {
  AdminSchoolDetailResult,
  AdminSchoolUser,
  BillingCycle,
  ResendInviteResult,
  ResetPasswordSendResult,
  SubscriptionStatus,
  TenantBoard,
  TenantType,
  UpdateSchoolBillingRequest,
} from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

const TYPE_LABELS: Record<TenantType, string> = {
  school: 'School',
  institute: 'Institute',
};

const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
};

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

const BILLING_CYCLES: BillingCycle[] = ['monthly', 'annual'];
const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['trial', 'active', 'past_due', 'cancelled'];

const BOARD_LABELS: Record<TenantBoard, string> = {
  cbse: 'CBSE',
  icse: 'ICSE',
  state: 'State board',
  ib: 'IB',
  other: 'Other',
};

const ROLE_LABELS: Record<AdminSchoolUser['role'], string> = {
  school_admin: 'School admin',
  teacher: 'Teacher',
  staff: 'Staff',
  student: 'Student',
};

@Component({
  selector: 'app-admin-school-detail',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './admin-school-detail.html',
  styleUrl: './admin-school-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSchoolDetail {
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminPlans = inject(AdminPlansService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly result = signal<AdminSchoolDetailResult | null>(null);
  protected readonly toggling = signal(false);
  protected readonly resending = signal(false);
  protected readonly resent = signal<ResendInviteResult | null>(null);
  protected readonly resetting = signal(false);
  protected readonly resetLink = signal<ResetPasswordSendResult | null>(null);
  protected readonly saved = signal(this.route.snapshot.queryParamMap.get('saved') === '1');

  private readonly plans = signal<AdminPlan[]>([]);

  protected readonly billingOpen = signal(false);
  protected readonly billingSubmitting = signal(false);
  protected readonly billingNotice = signal<string | null>(null);
  protected readonly billingError = signal<string | null>(null);
  protected readonly renewing = signal<'month' | 'year' | null>(null);

  protected readonly billingCycles = BILLING_CYCLES;
  protected readonly subscriptionStatuses = SUBSCRIPTION_STATUSES;

  protected readonly billingForm = new FormGroup({
    plan: new FormControl('', { nonNullable: true, validators: [requiredValidator] }),
    billingCycle: new FormControl<BillingCycle>('monthly', { nonNullable: true }),
    subscriptionStatus: new FormControl<SubscriptionStatus>('active', { nonNullable: true }),
    renewalAt: new FormControl('', { nonNullable: true }),
    trialEndsAt: new FormControl('', { nonNullable: true }),
    priceOverride: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
  });

  protected readonly canManage = computed(() => this.adminAuth.user()?.role === 'super_admin');
  protected readonly school = computed(() => this.result()?.school ?? null);
  protected readonly stats = computed(() => this.result()?.stats ?? null);
  protected readonly recentUsers = computed(() => this.result()?.recentUsers ?? []);
  protected readonly initials = computed(
    () => (this.school()?.name ?? '').trim().slice(0, 2).toUpperCase() || '??',
  );

  protected readonly planOptions = computed(() => {
    const selected = this.billingForm.controls.plan.value;

    return this.plans().filter((plan) => plan.active || plan.code === selected);
  });

  constructor() {
    if (this.canManage()) {
      this.loadPlans();
    }

    this.load();
  }

  protected loadPlans(): void {
    this.adminPlans
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plans) => this.plans.set(plans),
        error: () => this.plans.set([]),
      });
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    this.adminSchools
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected toggleStatus(): void {
    const school = this.school();

    if (school === null || this.toggling()) {
      return;
    }

    const next = school.status === 'active' ? 'suspended' : 'active';

    this.toggling.set(true);
    this.actionError.set(null);

    this.adminSchools
      .updateStatus(school.id, next)
      .pipe(
        finalize(() => this.toggling.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected resendInvite(): void {
    const school = this.school();

    if (school === null || this.resending()) {
      return;
    }

    this.resending.set(true);
    this.actionError.set(null);
    this.resent.set(null);
    this.resetLink.set(null);

    this.adminSchools
      .resendInvite(school.id)
      .pipe(
        finalize(() => this.resending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (invite) => {
          this.resent.set(invite);
          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected resetPassword(): void {
    const school = this.school();

    if (school === null || this.resetting()) {
      return;
    }

    this.resetting.set(true);
    this.actionError.set(null);
    this.resent.set(null);
    this.resetLink.set(null);

    this.adminSchools
      .resetPassword(school.id)
      .pipe(
        finalize(() => this.resetting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.resetLink.set(result);
          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected openBilling(): void {
    const school = this.school();

    if (school === null) {
      return;
    }

    this.billingForm.reset({
      plan: school.plan,
      billingCycle: school.billingCycle,
      subscriptionStatus: school.subscriptionStatus,
      renewalAt: this.dateInputValue(school.renewalAt),
      trialEndsAt: this.dateInputValue(school.trialEndsAt),
      priceOverride: school.priceOverride,
    });
    this.billingError.set(null);
    this.billingNotice.set(null);
    this.billingOpen.set(true);
  }

  protected closeBilling(): void {
    this.billingError.set(null);
    this.billingOpen.set(false);
  }

  protected saveBilling(): void {
    const school = this.school();

    if (school === null || this.billingSubmitting()) {
      return;
    }

    if (this.billingForm.invalid) {
      this.billingForm.markAllAsTouched();
      return;
    }

    const value = this.billingForm.getRawValue();
    const payload: UpdateSchoolBillingRequest = {
      plan: value.plan,
      billingCycle: value.billingCycle,
      subscriptionStatus: value.subscriptionStatus,
      renewalAt: value.renewalAt === '' ? null : value.renewalAt,
      trialEndsAt: value.trialEndsAt === '' ? null : value.trialEndsAt,
      priceOverride: value.priceOverride,
    };

    this.billingSubmitting.set(true);
    this.billingError.set(null);
    this.billingNotice.set(null);

    this.adminSchools
      .updateBilling(school.id, payload)
      .pipe(
        finalize(() => this.billingSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.billingOpen.set(false);
          this.billingNotice.set('Billing updated.');
          this.load(true);
        },
        error: (error: unknown) => this.billingError.set(this.messageOf(error)),
      });
  }

  protected renew(unit: 'month' | 'year'): void {
    const school = this.school();

    if (school === null || this.renewing() !== null) {
      return;
    }

    const now = new Date();
    const current = school.renewalAt === null ? null : new Date(school.renewalAt);
    const base =
      current !== null && !Number.isNaN(current.getTime()) && current.getTime() > now.getTime()
        ? current
        : now;
    const next = new Date(base);

    if (unit === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }

    this.renewing.set(unit);
    this.billingError.set(null);
    this.billingNotice.set(null);

    this.adminSchools
      .updateBilling(school.id, {
        renewalAt: next.toISOString(),
        subscriptionStatus: 'active',
      })
      .pipe(
        finalize(() => this.renewing.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.billingNotice.set('Renewal date updated.');
          this.load(true);
        },
        error: (error: unknown) => this.billingError.set(this.messageOf(error)),
      });
  }

  protected dateInputValue(value: string | null): string {
    return value === null ? '' : value.slice(0, 10);
  }

  protected subscriptionLabel(status: SubscriptionStatus): string {
    return SUBSCRIPTION_LABELS[status];
  }

  protected billingCycleLabel(cycle: BillingCycle): string {
    return BILLING_CYCLE_LABELS[cycle];
  }

  protected priceLabel(value: number | null): string {
    return value === null ? 'Plan price' : `₹${value.toLocaleString('en-IN')} / month`;
  }

  protected typeLabel(type: TenantType): string {
    return TYPE_LABELS[type];
  }

  protected boardLabel(board: string): string {
    return board === '' ? '—' : (BOARD_LABELS[board as TenantBoard] ?? board);
  }

  protected roleLabel(role: AdminSchoolUser['role']): string {
    return ROLE_LABELS[role];
  }

  protected addressLines(): string[] {
    const school = this.school();

    if (school === null) {
      return [];
    }

    const locality = [school.city, school.state, school.pincode]
      .map((part) => part.trim())
      .filter((part) => part !== '')
      .join(', ');
    const lines = [school.addressLine1, school.addressLine2, locality, school.country]
      .map((part) => part.trim())
      .filter((part) => part !== '');

    return lines;
  }

  protected dateLabel(value: string | null): string {
    if (value === null) {
      return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected dateTimeLabel(value: string | null): string {
    if (value === null) {
      return 'Never';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
