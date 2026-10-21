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
import { StandardsService } from '../../../core/api/standards.service';
import type { StandardRecord } from '../../../core/api/standards.types';
import { SubjectsService } from '../../../core/api/subjects.service';
import type {
  SubjectRecord,
  SubjectsPage,
  SubjectSortDirection,
  SubjectSortField,
  SubjectStatus,
} from '../../../core/api/subjects.types';
import { AuthService } from '../../../core/auth/auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

type StatusFilter = SubjectStatus | 'all';

const NAME_MAX_LENGTH = 60;
const ORDER_MAX = 100;
const STANDARDS_FETCH_LIMIT = 50;

@Component({
  selector: 'app-subjects',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subjects {
  private readonly subjectsApi = inject(SubjectsService);
  private readonly standardsApi = inject(StandardsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly standardFilter = signal('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly includeDeleted = signal(false);
  protected readonly sort = signal<SubjectSortField>('order');
  protected readonly dir = signal<SubjectSortDirection>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<SubjectsPage | null>(null);

  protected readonly standards = signal<StandardRecord[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly canManage = computed(() => this.auth.can('masters.manage'));
  protected readonly editing = computed(() => this.editingId() !== null);
  protected readonly liveStandards = computed(() =>
    this.standards().filter(
      (standard) => standard.status === 'active' && standard.deletedAt === null,
    ),
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
      this.standardFilter() !== 'all' ||
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
    standardId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    order: new FormControl(1, {
      nonNullable: true,
      validators: [requiredValidator, Validators.min(1), Validators.max(ORDER_MAX)],
    }),
    status: new FormControl<SubjectStatus>('active', { nonNullable: true }),
  });

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });

    this.loadStandards();
    this.load();
  }

  protected loadStandards(): void {
    this.standardsApi
      .list({
        pageSize: STANDARDS_FETCH_LIMIT,
        sort: 'order',
        dir: 'asc',
        status: 'active',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.standards.set(page.items),
        error: () => this.standards.set([]),
      });
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    const status = this.statusFilter();

    this.subjectsApi
      .list({
        search: this.query().trim(),
        standardId: this.standardFilter() === 'all' ? '' : this.standardFilter(),
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

  protected setStandardFilter(value: string): void {
    this.standardFilter.set(value);
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

  protected sortBy(field: SubjectSortField): void {
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

  protected standardLabel(standard: StandardRecord): string {
    return `${standard.name} · ${standard.mediumName}`;
  }

  protected openCreate(): void {
    const standards = this.liveStandards();

    if (standards.length === 0) {
      this.actionError.set('Add at least one standard before creating subjects.');
      return;
    }

    const preferred =
      this.standardFilter() !== 'all' &&
      standards.some((standard) => standard.id === this.standardFilter())
        ? this.standardFilter()
        : standards[0].id;

    this.editingId.set(null);
    this.form.reset({
      name: '',
      standardId: preferred,
      order: this.nextOrder(),
      status: 'active',
    });
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(subject: SubjectRecord): void {
    this.editingId.set(subject.id);
    this.form.reset({
      name: subject.name,
      standardId: subject.standardId,
      order: subject.order,
      status: subject.status,
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

  protected standardError(): string | null {
    const control = this.form.controls.standardId;

    return control.invalid && (control.touched || control.dirty) ? 'Select a standard.' : null;
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
      standardId: value.standardId,
      order: Number(value.order),
      status: value.status,
    };

    this.saving.set(true);
    this.actionError.set(null);

    const request =
      editingId === null
        ? this.subjectsApi.create(payload)
        : this.subjectsApi.update(editingId, payload);

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

          this.notice.set(editingId === null ? 'Subject added.' : 'Subject updated.');
          this.load(true);
        },
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected toggleStatus(subject: SubjectRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: SubjectStatus = subject.status === 'active' ? 'inactive' : 'active';

    this.busyId.set(subject.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);

    this.subjectsApi
      .update(subject.id, { status: next })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(subject: SubjectRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(subject.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(subject: SubjectRecord): void {
    this.busyId.set(subject.id);
    this.actionError.set(null);

    this.subjectsApi
      .remove(subject.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);
          this.notice.set('Subject deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(subject: SubjectRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(subject.id);
    this.actionError.set(null);
    this.notice.set(null);

    this.subjectsApi
      .restore(subject.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set('Subject restored.');
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
