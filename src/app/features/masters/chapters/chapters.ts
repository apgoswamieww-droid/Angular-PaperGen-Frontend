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
import { ChaptersService } from '../../../core/api/chapters.service';
import type {
  ChapterRecord,
  ChapterReferenceType,
  ChaptersPage,
  ChapterSortDirection,
  ChapterSortField,
  ChapterStatus,
} from '../../../core/api/chapters.types';
import { SubjectsService } from '../../../core/api/subjects.service';
import type { SubjectRecord } from '../../../core/api/subjects.types';
import { AuthService } from '../../../core/auth/auth.service';
import { requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

type StatusFilter = ChapterStatus | 'all';
type ReferenceFilter = ChapterReferenceType | 'all';

const NAME_MAX_LENGTH = 60;
const ORDER_MAX = 100;
const SUBJECTS_FETCH_LIMIT = 50;

@Component({
  selector: 'app-chapters',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './chapters.html',
  styleUrl: './chapters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chapters {
  private readonly chaptersApi = inject(ChaptersService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly subjectFilter = signal('all');
  protected readonly referenceFilter = signal<ReferenceFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly includeDeleted = signal(false);
  protected readonly sort = signal<ChapterSortField>('order');
  protected readonly dir = signal<ChapterSortDirection>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<ChaptersPage | null>(null);

  protected readonly subjects = signal<SubjectRecord[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly canManage = computed(() => this.auth.can('masters.manage'));
  protected readonly editing = computed(() => this.editingId() !== null);
  protected readonly liveSubjects = computed(() =>
    this.subjects().filter((subject) => subject.status === 'active' && subject.deletedAt === null),
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
      this.subjectFilter() !== 'all' ||
      this.referenceFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.includeDeleted(),
  );

  protected readonly statuses: StatusFilter[] = ['all', 'active', 'inactive'];
  protected readonly referenceTypes: ReferenceFilter[] = ['all', 'ncert', 'other'];
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
    subjectId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    referenceType: new FormControl<ChapterReferenceType>('ncert', { nonNullable: true }),
    order: new FormControl(1, {
      nonNullable: true,
      validators: [requiredValidator, Validators.min(1), Validators.max(ORDER_MAX)],
    }),
    status: new FormControl<ChapterStatus>('active', { nonNullable: true }),
  });

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });

    this.loadSubjects();
    this.load();
  }

  protected loadSubjects(): void {
    this.subjectsApi
      .list({
        pageSize: SUBJECTS_FETCH_LIMIT,
        sort: 'order',
        dir: 'asc',
        status: 'active',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.subjects.set(page.items),
        error: () => this.subjects.set([]),
      });
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    const status = this.statusFilter();
    const referenceType = this.referenceFilter();

    this.chaptersApi
      .list({
        search: this.query().trim(),
        subjectId: this.subjectFilter() === 'all' ? '' : this.subjectFilter(),
        referenceType: referenceType === 'all' ? '' : referenceType,
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

  protected setSubjectFilter(value: string): void {
    this.subjectFilter.set(value);
    this.page.set(1);
    this.load();
  }

  protected setReference(value: ReferenceFilter): void {
    this.referenceFilter.set(value);
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

  protected sortBy(field: ChapterSortField): void {
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

  protected subjectLabel(subject: SubjectRecord): string {
    return `${subject.name} · ${subject.standardName} · ${subject.mediumName}`;
  }

  protected referenceLabel(referenceType: ChapterReferenceType): string {
    return referenceType === 'ncert' ? 'NCERT' : 'Other';
  }

  protected openCreate(): void {
    const subjects = this.liveSubjects();

    if (subjects.length === 0) {
      this.actionError.set('Add at least one subject before creating chapters.');
      return;
    }

    const preferred =
      this.subjectFilter() !== 'all' &&
      subjects.some((subject) => subject.id === this.subjectFilter())
        ? this.subjectFilter()
        : subjects[0].id;

    this.editingId.set(null);
    this.form.reset({
      name: '',
      subjectId: preferred,
      referenceType: 'ncert',
      order: this.nextOrder(),
      status: 'active',
    });
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(chapter: ChapterRecord): void {
    this.editingId.set(chapter.id);
    this.form.reset({
      name: chapter.name,
      subjectId: chapter.subjectId,
      referenceType: chapter.referenceType,
      order: chapter.order,
      status: chapter.status,
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

  protected subjectError(): string | null {
    const control = this.form.controls.subjectId;

    return control.invalid && (control.touched || control.dirty) ? 'Select a subject.' : null;
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
      subjectId: value.subjectId,
      referenceType: value.referenceType,
      order: Number(value.order),
      status: value.status,
    };

    this.saving.set(true);
    this.actionError.set(null);

    const request =
      editingId === null
        ? this.chaptersApi.create(payload)
        : this.chaptersApi.update(editingId, payload);

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

          this.notice.set(editingId === null ? 'Chapter added.' : 'Chapter updated.');
          this.load(true);
        },
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected toggleStatus(chapter: ChapterRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: ChapterStatus = chapter.status === 'active' ? 'inactive' : 'active';

    this.busyId.set(chapter.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);

    this.chaptersApi
      .update(chapter.id, { status: next })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(chapter: ChapterRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(chapter.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(chapter: ChapterRecord): void {
    this.busyId.set(chapter.id);
    this.actionError.set(null);

    this.chaptersApi
      .remove(chapter.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);
          this.notice.set('Chapter deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(chapter: ChapterRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(chapter.id);
    this.actionError.set(null);
    this.notice.set(null);

    this.chaptersApi
      .restore(chapter.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set('Chapter restored.');
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
