import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import type { ApiError } from '../../../core/api/api-error.interceptor';
import { AdminPlansService } from '../../../core/api/admin-plans.service';
import type { AdminPlan } from '../../../core/api/admin-plans.types';
import { AdminSchoolsService } from '../../../core/api/admin-schools.service';
import type { AdminSchoolSummary, SubscriptionStatus } from '../../../core/api/admin-schools.types';
import { HealthService } from '../../../core/api/health.service';
import type { HealthResponse } from '../../../core/api/health.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { Icon, type IconName } from '../../../shared/icon/icon';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  icon: IconName;
}

const NEW_WINDOW_DAYS = 30;
const RECENT_LIMIT = 5;

const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
};

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, Icon],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly healthService = inject(HealthService);
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminPlans = inject(AdminPlansService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<'checking' | 'ok' | 'degraded' | 'unreachable'>('checking');
  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly dataLoading = signal(true);
  protected readonly dataError = signal<string | null>(null);
  protected readonly schools = signal<AdminSchoolSummary[]>([]);
  private readonly plans = signal<AdminPlan[]>([]);

  private readonly canManage = computed(() => this.adminAuth.user()?.role === 'super_admin');

  protected readonly stats = computed<StatCard[]>(() => {
    const schools = this.schools();
    const cutoff = Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const newLast30 = schools.filter((school) => {
      const created = new Date(school.createdAt).getTime();

      return !Number.isNaN(created) && created >= cutoff;
    }).length;
    const totalUsers = schools.reduce((sum, school) => sum + school.userCount, 0);
    const activeSubs = schools.filter((school) => school.subscriptionStatus === 'active').length;
    const trials = schools.filter((school) => school.subscriptionStatus === 'trial').length;
    const annual = schools.filter(
      (school) => school.subscriptionStatus === 'active' && school.billingCycle === 'annual',
    ).length;

    return [
      {
        label: 'Total schools',
        value: schools.length.toLocaleString('en-IN'),
        delta: `+${newLast30} in last ${NEW_WINDOW_DAYS} days`,
        icon: 'building',
      },
      {
        label: 'Total users',
        value: totalUsers.toLocaleString('en-IN'),
        delta: 'across every workspace',
        icon: 'users',
      },
      {
        label: 'Active subscriptions',
        value: activeSubs.toLocaleString('en-IN'),
        delta: `${trials} on trial`,
        icon: 'credit-card',
      },
      {
        label: 'Monthly revenue',
        value: `₹${this.mrr().toLocaleString('en-IN')}`,
        delta: annual > 0 ? `${annual} billed yearly` : 'active subscriptions only',
        icon: 'check',
      },
    ];
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

  protected readonly tenants = computed(() =>
    [...this.schools()]
      .sort((a, b) => this.timeOf(b.createdAt) - this.timeOf(a.createdAt))
      .slice(0, RECENT_LIMIT),
  );

  protected readonly uptime = computed(() => {
    const health = this.health();

    if (health === null) {
      return '—';
    }

    const minutes = Math.floor(health.uptime / 60);
    return minutes > 0 ? `${minutes} min` : `${health.uptime} s`;
  });

  protected readonly apiState = computed(() => {
    switch (this.status()) {
      case 'checking':
        return '—';
      case 'unreachable':
        return 'Offline';
      default:
        return 'Responding';
    }
  });

  constructor() {
    this.refresh();
    this.load();
  }

  protected load(): void {
    this.dataLoading.set(true);
    this.dataError.set(null);

    forkJoin({
      schools: this.adminSchools.list(),
      plans: this.canManage() ? this.adminPlans.list() : of<AdminPlan[]>([]),
    })
      .pipe(
        finalize(() => this.dataLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ schools, plans }) => {
          this.schools.set(schools);
          this.plans.set(plans);
        },
        error: (error: unknown) => this.dataError.set(this.messageOf(error)),
      });
  }

  protected refresh(): void {
    this.status.set('checking');
    this.health.set(null);
    this.error.set(null);

    this.healthService.check().subscribe({
      next: (health) => {
        this.health.set(health);
        this.status.set(health.database === 'up' ? 'ok' : 'degraded');
      },
      error: (err: ApiError) => {
        this.status.set('unreachable');
        this.error.set(err.message);
      },
    });
  }

  protected subscriptionLabel(status: SubscriptionStatus): string {
    return SUBSCRIPTION_LABELS[status];
  }

  protected countLabel(value: number): string {
    return value.toLocaleString('en-IN');
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

  private timeOf(value: string): number {
    const time = new Date(value).getTime();

    return Number.isNaN(time) ? 0 : time;
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
