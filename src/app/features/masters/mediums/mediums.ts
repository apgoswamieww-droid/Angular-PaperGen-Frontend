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
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { MediumsService } from '../../../core/api/mediums.service';
import type {
  MediumRecord,
  MediumSortDirection,
  MediumSortField,
  MediumStatus,
  MediumsPage,
} from '../../../core/api/mediums.types';
import { AuthService } from '../../../core/auth/auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

type StatusFilter = MediumStatus | 'all';

const NAME_MAX_LENGTH = 60;

@Component({
  selector: 'app-mediums',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './mediums.html',
  styleUrl: './mediums.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mediums {
  private readonly mediumsApi = inject(MediumsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly includeDeleted = signal(false);
  protected readonly sort = signal<MediumSortField>('name');
  protected readonly dir = signal<MediumSortDirection>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<MediumsPage | null>(null);

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly canManage = computed(() => this.auth.can('masters.manage'));
  protected readonly editing = computed(() => this.editingId() !== null);
  protected readonly rows = computed(() => this.result()?.items ?? []);
  protected readonly summary = computed(() => this.result()?.summary ?? null);
  protected readonly total = computed(() => this.result()?.total ?? 0);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.total()),
  );
  protected readonly hasFilters = computed(
    () => this.query() !== '' || this.statusFilter() !== 'all' || this.includeDeleted(),
  );

  protected readonly statuses: StatusFilter[] = ['all', 'active', 'inactive'];
  protected readonly pageSizes = [10, 25, 50];

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredValidator,
        Validators.minLength(2),
        Validators.maxLength(NAME_MAX_LENGTH),
      ],
    }),
    status: new FormControl<MediumStatus>('active', { nonNullable: true }),
  });

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    const status = this.statusFilter();

    this.mediumsApi
      .list({
        search: this.query().trim(),
        status: status === 'all' ? '' : status,
        includeDeleted: this.includeDeleted(),
        page: this.page(),
        pageSize: this.pageSize(),
        sort: this.sort(),
        dir: this.dir(),
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected onSearch(value: string): void {
    this.searchInput.next(value);
  }

  protected setStatus(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  protected toggleDeleted(value: boolean): void {
    this.includeDeleted.set(value);
    this.page.set(1);
    this.load();
  }

  protected sortBy(field: MediumSortField): void {
    if (this.sort() === field) {
      this.dir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sort.set(field);
      this.dir.set(field === 'name' ? 'asc' : 'desc');
    }

    this.page.set(1);
    this.load();
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.page()) {
      return;
    }

    this.page.set(page);
    this.load();
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', status: 'active' });
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(medium: MediumRecord): void {
    this.editingId.set(medium.id);
    this.form.reset({ name: medium.name, status: medium.status });
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.formError.set(null);
  }

  protected nameError(): string | null {
    const control = this.form.controls.name;

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Name is required.';
    }

    if (control.hasError('minlength')) {
      return 'Use at least 2 characters.';
    }

    if (control.hasError('maxlength')) {
      return `Use ${NAME_MAX_LENGTH} characters or fewer.`;
    }

    return 'This name is not valid.';
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const payload = { name: value.name.trim(), status: value.status };

    this.saving.set(true);
    this.actionError.set(null);

    const request =
      editingId === null
        ? this.mediumsApi.create(payload)
        : this.mediumsApi.update(editingId, payload);

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.notice.set(editingId === null ? 'Medium added.' : 'Medium updated.');
          this.load(true);
        },
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected toggleStatus(medium: MediumRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: MediumStatus = medium.status === 'active' ? 'inactive' : 'active';

    this.busyId.set(medium.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);

    this.mediumsApi
      .update(medium.id, { status: next })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(medium: MediumRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(medium.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(medium: MediumRecord): void {
    this.busyId.set(medium.id);
    this.actionError.set(null);

    this.mediumsApi
      .remove(medium.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);
          this.notice.set('Medium deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(medium: MediumRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(medium.id);
    this.actionError.set(null);
    this.notice.set(null);

    this.mediumsApi
      .restore(medium.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set('Medium restored.');
          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected dismissNotice(): void {
    this.notice.set(null);
  }

  protected dateLabel(value: string | null): string {
    if (value === null) {
      return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
