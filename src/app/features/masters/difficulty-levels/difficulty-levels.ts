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
import { DifficultyLevelsService } from '../../../core/api/difficulty-levels.service';
import type {
  DifficultyLevelRecord,
  DifficultyLevelsPage,
  DifficultyLevelSortDirection,
  DifficultyLevelSortField,
  DifficultyLevelStatus,
} from '../../../core/api/difficulty-levels.types';
import { AuthService } from '../../../core/auth/auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

type StatusFilter = DifficultyLevelStatus | 'all';

const NAME_MAX_LENGTH = 60;
const ORDER_MAX = 100;

@Component({
  selector: 'app-difficulty-levels',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './difficulty-levels.html',
  styleUrl: './difficulty-levels.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultyLevels {
  private readonly difficultyLevelsApi = inject(DifficultyLevelsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly includeDeleted = signal(false);
  protected readonly sort = signal<DifficultyLevelSortField>('order');
  protected readonly dir = signal<DifficultyLevelSortDirection>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<DifficultyLevelsPage | null>(null);

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
  protected readonly nextOrder = computed(() => {
    const orders = this.rows().map((row) => row.order);

    return orders.length === 0 ? 1 : Math.min(ORDER_MAX, Math.max(...orders) + 1);
  });
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
    order: new FormControl(1, {
      nonNullable: true,
      validators: [requiredValidator, Validators.min(1), Validators.max(ORDER_MAX)],
    }),
    status: new FormControl<DifficultyLevelStatus>('active', { nonNullable: true }),
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

    this.difficultyLevelsApi
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

  protected sortBy(field: DifficultyLevelSortField): void {
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
    this.editingId.set(null);
    this.form.reset({ name: '', order: this.nextOrder(), status: 'active' });
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(difficultyLevel: DifficultyLevelRecord): void {
    this.editingId.set(difficultyLevel.id);
    this.form.reset({
      name: difficultyLevel.name,
      order: difficultyLevel.order,
      status: difficultyLevel.status,
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
    this.save(false);
  }

  protected submitAndNew(): void {
    this.save(true);
  }

  private save(keepOpen: boolean): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const payload = {
      name: value.name.trim(),
      order: Number(value.order),
      status: value.status,
    };

    this.saving.set(true);
    this.actionError.set(null);

    const request =
      editingId === null
        ? this.difficultyLevelsApi.create(payload)
        : this.difficultyLevelsApi.update(editingId, payload);

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (keepOpen && editingId === null) {
            this.form.patchValue({
              name: '',
              order: Math.min(ORDER_MAX, Number(value.order) + 1),
            });
            this.form.markAsPristine();
            this.form.markAsUntouched();
            this.formError.set(null);
          } else {
            this.closeForm();
          }

          this.notice.set(
            editingId === null ? 'Difficulty level added.' : 'Difficulty level updated.',
          );
          this.load(true);
        },
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected toggleStatus(difficultyLevel: DifficultyLevelRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: DifficultyLevelStatus = difficultyLevel.status === 'active' ? 'inactive' : 'active';

    this.busyId.set(difficultyLevel.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);

    this.difficultyLevelsApi
      .update(difficultyLevel.id, { status: next })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(difficultyLevel: DifficultyLevelRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(difficultyLevel.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(difficultyLevel: DifficultyLevelRecord): void {
    this.busyId.set(difficultyLevel.id);
    this.actionError.set(null);

    this.difficultyLevelsApi
      .remove(difficultyLevel.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);
          this.notice.set('Difficulty level deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(difficultyLevel: DifficultyLevelRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(difficultyLevel.id);
    this.actionError.set(null);
    this.notice.set(null);

    this.difficultyLevelsApi
      .restore(difficultyLevel.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set('Difficulty level restored.');
          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected dismissNotice(): void {
    this.notice.set(null);
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
