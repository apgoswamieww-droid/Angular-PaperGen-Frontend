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
import type { AdminSchoolSummary, TenantType } from '../../../core/api/admin-schools.types';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { Icon } from '../../../shared/icon/icon';

const TYPE_LABELS: Record<TenantType, string> = {
  school: 'School',
  institute: 'Institute',
};

@Component({
  selector: 'app-white-label',
  imports: [RouterLink, Icon],
  templateUrl: './white-label.html',
  styleUrl: './white-label.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhiteLabel {
  private readonly adminSchools = inject(AdminSchoolsService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly schools = signal<AdminSchoolSummary[]>([]);
  protected readonly canManage = computed(() => this.adminAuth.user()?.role === 'super_admin');

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

  protected initials(school: AdminSchoolSummary): string {
    return school.name.trim().slice(0, 2).toUpperCase() || '??';
  }

  protected typeLabel(type: TenantType): string {
    return TYPE_LABELS[type];
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
