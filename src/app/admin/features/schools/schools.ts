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
import { finalize } from 'rxjs';
import { AdminSchoolsService } from '../../../core/api/admin-schools.service';
import type {
  AdminSchoolSummary,
  ResetPasswordSendResult,
  TenantType,
} from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { Icon } from '../../../shared/icon/icon';

type StatusFilter = 'all' | 'active' | 'suspended';

const TYPE_LABELS: Record<TenantType, string> = {
  school: 'School',
  institute: 'Institute',
};

@Component({
  selector: 'app-schools',
  imports: [RouterLink, Icon],
  templateUrl: './schools.html',
  styleUrl: './schools.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schools {
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly query = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionNotice = signal<ResetPasswordSendResult | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly schools = signal<AdminSchoolSummary[]>([]);

  protected readonly filters: StatusFilter[] = ['all', 'active', 'suspended'];
  protected readonly canCreate = computed(() => this.adminAuth.user()?.role === 'super_admin');

  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.statusFilter();

    return this.schools().filter((school) => {
      const matchesQuery =
        query === '' ||
        school.name.toLowerCase().includes(query) ||
        school.city.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || school.status === status;

      return matchesQuery && matchesStatus;
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminSchools
      .list()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (schools) => this.schools.set(schools),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
  }

  protected updateStatus(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  protected toggleStatus(school: AdminSchoolSummary): void {
    if (this.busyId() !== null) {
      return;
    }

    const next = school.status === 'active' ? 'suspended' : 'active';

    this.busyId.set(school.id);
    this.actionError.set(null);
    this.actionNotice.set(null);

    this.adminSchools
      .updateStatus(school.id, next)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) =>
          this.schools.update((list) =>
            list.map((item) => (item.id === updated.id ? updated : item)),
          ),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected resetPassword(school: AdminSchoolSummary): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(school.id);
    this.actionError.set(null);
    this.actionNotice.set(null);

    this.adminSchools
      .resetPassword(school.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.actionNotice.set(result),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected typeLabel(type: TenantType): string {
    return TYPE_LABELS[type];
  }

  protected createdLabel(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
