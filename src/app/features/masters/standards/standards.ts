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
import type { MediumRecord } from '../../../core/api/mediums.types';
import { StandardsService } from '../../../core/api/standards.service';
import type {
  StandardRecord,
  StandardSortDirection,
  StandardSortField,
  StandardStatus,
  StandardsPage,
} from '../../../core/api/standards.types';
import { AuthService } from '../../../core/auth/auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

type StatusFilter = StandardStatus | 'all';

const NAME_MAX_LENGTH = 60;
const ORDER_MAX = 100;
const MEDIUMS_FETCH_LIMIT = 50;

@Component({
  selector: 'app-standards',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './standards.html',
  styleUrl: './standards.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Standards {
  private readonly standardsApi = inject(StandardsService);
  private readonly mediumsApi = inject(MediumsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly mediumFilter = signal('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly includeDeleted = signal(false);
  protected readonly sort = signal<StandardSortField>('order');
  protected readonly dir = signal<StandardSortDirection>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<StandardsPage | null>(null);

  protected readonly mediums = signal<MediumRecord[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly canManage = computed(() => this.auth.can('masters.manage'));
  protected readonly editing = computed(() => this.editingId() !== null);
  protected readonly liveMediums = computed(() =>
    this.mediums().filter((medium) => medium.deletedAt === null),
  );
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
  protected readonly nextOrder = computed(() => {
    const orders = this.rows().map((row) => row.order);

    return orders.length === 0 ? 1 : Math.min(ORDER_MAX, Math.max(...orders) + 1);
  });
  protected readonly hasFilters = computed(
    () =>
      this.query() !== '' ||
      this.mediumFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.includeDeleted(),
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
    mediumId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    order: new FormControl(1, {
      nonNullable: true,
      validators: [requiredValidator, Validators.min(1), Validators.max(ORDER_MAX)],
    }),
    status: new FormControl<StandardStatus>('active', { nonNullable: true }),
  });

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });

    this.loadMediums();
    this.load();
  }

  protected loadMediums(): void {
    this.mediumsApi
      .list({ pageSize: MEDIUMS_FETCH_LIMIT, sort: 'name', dir: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.mediums.set(page.items),
        error: () => this.mediums.set([]),
      });
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    const status = this.statusFilter();

    this.standardsApi
      .list({
        search: this.query().trim(),
        mediumId: this.mediumFilter() === 'all' ? '' : this.mediumFilter(),
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

  protected setMediumFilter(value: string): void {
    this.mediumFilter.set(value);
    this.page.set(1);
    this.load();
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

  protected sortBy(field: StandardSortField): void {
    if (this.sort() === field) {
      this.dir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sort.set(field);
      this.dir.set(field === 'createdAt' ? 'desc' : 'asc');
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
    const mediums = this.liveMediums();

    if (mediums.length === 0) {
      this.actionError.set('Add at least one medium before creating standards.');
      return;
    }

    const preferred =
      this.mediumFilter() !== 'all' && mediums.some((medium) => medium.id === this.mediumFilter())
        ? this.mediumFilter()
        : mediums[0].id;

    this.editingId.set(null);
    this.form.reset({ name: '', mediumId: preferred, order: this.nextOrder(), status: 'active' });
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(standard: StandardRecord): void {
    this.editingId.set(standard.id);
    this.form.reset({
      name: standard.name,
      mediumId: standard.mediumId,
      order: standard.order,
      status: standard.status,
    });
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

  protected mediumError(): string | null {
    const control = this.form.controls.mediumId;

    return control.invalid && (control.touched || control.dirty) ? 'Select a medium.' : null;
  }

  protected orderError(): string | null {
    const control = this.form.controls.order;

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    return control.hasError('required')
      ? 'Order is required.'
      : `Enter a whole number between 1 and ${ORDER_MAX}.`;
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const payload = {
      name: value.name.trim(),
      mediumId: value.mediumId,
      order: Number(value.order),
      status: value.status,
    };

    this.saving.set(true);
    this.actionError.set(null);

    const request =
      editingId === null
        ? this.standardsApi.create(payload)
        : this.standardsApi.update(editingId, payload);

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.notice.set(editingId === null ? 'Standard added.' : 'Standard updated.');
          this.load(true);
        },
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected toggleStatus(standard: StandardRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: StandardStatus = standard.status === 'active' ? 'inactive' : 'active';

    this.busyId.set(standard.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);

    this.standardsApi
      .update(standard.id, { status: next })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(standard: StandardRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(standard.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(standard: StandardRecord): void {
    this.busyId.set(standard.id);
    this.actionError.set(null);

    this.standardsApi
      .remove(standard.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);
          this.notice.set('Standard deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(standard: StandardRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(standard.id);
    this.actionError.set(null);
    this.notice.set(null);

    this.standardsApi
      .restore(standard.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set('Standard restored.');
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
