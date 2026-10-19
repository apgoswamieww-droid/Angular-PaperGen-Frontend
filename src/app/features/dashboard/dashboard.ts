import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiError } from '../../core/api/api-error.interceptor';
import { HealthService } from '../../core/api/health.service';
import type { HealthResponse } from '../../core/api/health.types';
import { Icon, type IconName } from '../../shared/icon/icon';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  icon: IconName;
}

interface PaperRow {
  name: string;
  className: string;
  status: 'draft' | 'generated' | 'published';
  date: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly healthService = inject(HealthService);

  protected readonly status = signal<'checking' | 'ok' | 'degraded' | 'unreachable'>('checking');
  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly stats: StatCard[] = [
    { label: 'Papers generated', value: '128', delta: '+12 this month', icon: 'file-text' },
    { label: 'Question bank', value: '1,204', delta: '+86 this week', icon: 'help-circle' },
    { label: 'Blueprints', value: '18', delta: '4 updated recently', icon: 'layers' },
    { label: 'Classes', value: '12', delta: 'Across 4 subjects', icon: 'users' },
  ];

  protected readonly recentPapers: PaperRow[] = [
    {
      name: 'Mid-term · Physics',
      className: 'Class 12-A',
      status: 'generated',
      date: '12 Oct 2026',
    },
    {
      name: 'Unit test · Algebra',
      className: 'Class 10-B',
      status: 'published',
      date: '10 Oct 2026',
    },
    {
      name: 'Pre-board · Chemistry',
      className: 'Class 12-C',
      status: 'draft',
      date: '08 Oct 2026',
    },
    {
      name: 'Weekly test · Biology',
      className: 'Class 11-A',
      status: 'generated',
      date: '05 Oct 2026',
    },
    {
      name: 'Half-yearly · English',
      className: 'Class 9-B',
      status: 'published',
      date: '01 Oct 2026',
    },
  ];

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
}
