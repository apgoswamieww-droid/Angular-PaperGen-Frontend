import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AdminPlansService } from '../../../core/api/admin-plans.service';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import { AdminSchoolsService } from '../../../core/api/admin-schools.service';
import type { AdminSchoolSummary } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { Icon } from '../../../shared/icon/icon';

const TRIAL_WINDOW_DAYS = 14;

@Component({
  selector: 'app-plans',
  imports: [RouterLink, Icon],
  templateUrl: './plans.html',
  styleUrl: './plans.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans {
  private readonly plansApi = inject(AdminPlansService);
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly canManage = computed(() => this.adminAuth.user()?.role === 'super_admin');
  protected readonly saved = signal(this.route.snapshot.queryParamMap.get('saved') === '1');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly plans = signal<AdminPlan[]>([]);
  protected readonly schools = signal<AdminSchoolSummary[]>([]);
  protected readonly busyCode = signal<string | null>(null);
  protected readonly confirmingCode = signal<string | null>(null);

  protected readonly activeSubscriptions = computed(
    () => this.schools().filter((school) => school.subscriptionStatus === 'active').length,
  );

  protected readonly trialsEndingSoon = computed(() => {
    const now = Date.now();
    const limit = now + TRIAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    return this.schools().filter((school) => {
      if (school.subscriptionStatus !== 'trial' || school.trialEndsAt === null) {
        return false;
      }

      const endsAt = new Date(school.trialEndsAt).getTime();

      return !Number.isNaN(endsAt) && endsAt >= now && endsAt <= limit;
    }).length;
  });

  protected readonly mrr = computed(() => {
    const planByCode = new Map(this.plans().map((plan) => [plan.code, plan]));
    let total = 0;

    for (const school of this.schools()) {
      if (school.subscriptionStatus !== 'active') {
        continue;
      }

      if (school.priceOverride !== null) {
        total += school.priceOverride;
        continue;
      }

      const plan = planByCode.get(school.plan);

      if (plan === undefined) {
        continue;
      }

      if (school.billingCycle === 'annual') {
        if (plan.annualPrice !== null) {
          total += Math.round(plan.annualPrice / 12);
        }
      } else if (plan.monthlyPrice !== null) {
        total += plan.monthlyPrice;
      }
    }

    return total;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.actionError.set(null);

    forkJoin({
      plans: this.plansApi.list(),
      schools: this.adminSchools.list(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ plans, schools }) => {
          this.plans.set(plans);
          this.schools.set(schools);
        },
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected money(value: number | null): string {
    return value === null ? 'Custom' : `₹${value.toLocaleString('en-IN')}`;
  }

  protected limitsLabel(plan: AdminPlan): string {
    const parts: string[] = [];

    if (plan.limits.maxStudents !== null) {
      parts.push(`Up to ${plan.limits.maxStudents.toLocaleString('en-IN')} students`);
    }

    if (plan.limits.maxTeachers !== null) {
      parts.push(`${plan.limits.maxTeachers} teachers`);
    }

    if (plan.limits.maxTotalUsers !== null) {
      parts.push(`${plan.limits.maxTotalUsers} total users`);
    }

    return parts.length > 0 ? parts.join(' · ') : 'Unlimited usage';
  }

  protected toggleActive(plan: AdminPlan): void {
    if (this.busyCode() !== null) {
      return;
    }

    this.busyCode.set(plan.code);
    this.actionError.set(null);

    this.plansApi
      .update(plan.code, { active: !plan.active })
      .pipe(
        finalize(() => this.busyCode.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) =>
          this.plans.update((list) =>
            list.map((item) => (item.code === updated.code ? updated : item)),
          ),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected askRemove(plan: AdminPlan): void {
    this.confirmingCode.set(plan.code);
  }

  protected cancelRemove(): void {
    this.confirmingCode.set(null);
  }

  protected confirmRemove(plan: AdminPlan): void {
    if (this.busyCode() !== null) {
      return;
    }

    this.busyCode.set(plan.code);
    this.actionError.set(null);

    this.plansApi
      .remove(plan.code)
      .pipe(
        finalize(() => this.busyCode.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.plans.update((list) => list.filter((item) => item.code !== plan.code));
          this.confirmingCode.set(null);
        },
        error: (error: unknown) => {
          this.actionError.set(this.messageOf(error));
          this.confirmingCode.set(null);
        },
      });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
