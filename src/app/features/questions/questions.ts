import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  of,
  Subject,
} from 'rxjs';
import type { BloomLevelRecord } from '../../core/api/bloom-levels.types';
import { BloomLevelsService } from '../../core/api/bloom-levels.service';
import type { ChapterRecord } from '../../core/api/chapters.types';
import { ChaptersService } from '../../core/api/chapters.service';
import type { DifficultyLevelRecord } from '../../core/api/difficulty-levels.types';
import { DifficultyLevelsService } from '../../core/api/difficulty-levels.service';
import type { MediumRecord } from '../../core/api/mediums.types';
import { MediumsService } from '../../core/api/mediums.service';
import type { QuestionTypeRecord } from '../../core/api/question-types.types';
import { QuestionTypesService } from '../../core/api/question-types.service';
import type {
  QuestionListItem,
  QuestionsPage,
  QuestionSortDirection,
  QuestionSortField,
  QuestionStatus,
} from '../../core/api/questions.types';
import { QuestionsService } from '../../core/api/questions.service';
import type { StandardRecord } from '../../core/api/standards.types';
import { StandardsService } from '../../core/api/standards.service';
import type { SubjectRecord } from '../../core/api/subjects.types';
import { SubjectsService } from '../../core/api/subjects.service';
import type { TopicRecord } from '../../core/api/topics.types';
import { TopicsService } from '../../core/api/topics.service';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon/icon';
import { plainMathText } from '../../shared/math/math-text';

type StatusFilter = QuestionStatus | 'all';

const MASTER_FETCH_LIMIT = 50;
const TOPIC_FETCH_LIMIT = 50;

@Component({
  selector: 'app-questions',
  imports: [RouterLink, Icon],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Questions {
  private readonly questionsApi = inject(QuestionsService);
  private readonly mediumsApi = inject(MediumsService);
  private readonly standardsApi = inject(StandardsService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly chaptersApi = inject(ChaptersService);
  private readonly topicsApi = inject(TopicsService);
  private readonly questionTypesApi = inject(QuestionTypesService);
  private readonly difficultyLevelsApi = inject(DifficultyLevelsService);
  private readonly bloomLevelsApi = inject(BloomLevelsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();
  private topicsRequestId = 0;

  protected readonly query = signal('');
  protected readonly mediumFilter = signal('all');
  protected readonly standardFilter = signal('all');
  protected readonly subjectFilter = signal('all');
  protected readonly chapterFilter = signal('all');
  protected readonly topicFilter = signal('all');
  protected readonly questionTypeFilter = signal('all');
  protected readonly difficultyFilter = signal('all');
  protected readonly bloomFilter = signal('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly includeDeleted = signal(false);
  protected readonly sort = signal<QuestionSortField>('updatedAt');
  protected readonly dir = signal<QuestionSortDirection>('desc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<QuestionsPage | null>(null);

  protected readonly mediums = signal<MediumRecord[]>([]);
  protected readonly standards = signal<StandardRecord[]>([]);
  protected readonly subjects = signal<SubjectRecord[]>([]);
  protected readonly chapters = signal<ChapterRecord[]>([]);
  protected readonly topics = signal<TopicRecord[]>([]);
  protected readonly questionTypes = signal<QuestionTypeRecord[]>([]);
  protected readonly difficultyLevels = signal<DifficultyLevelRecord[]>([]);
  protected readonly bloomLevels = signal<BloomLevelRecord[]>([]);
  protected readonly topicsLoading = signal(false);
  protected readonly mastersError = signal<string | null>(null);

  protected readonly canManage = computed(() => this.auth.can('questions.manage'));
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
    () =>
      this.query() !== '' ||
      this.mediumFilter() !== 'all' ||
      this.standardFilter() !== 'all' ||
      this.subjectFilter() !== 'all' ||
      this.chapterFilter() !== 'all' ||
      this.topicFilter() !== 'all' ||
      this.questionTypeFilter() !== 'all' ||
      this.difficultyFilter() !== 'all' ||
      this.bloomFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.includeDeleted(),
  );

  protected readonly standardOptions = computed(() => {
    const mediumId = this.mediumFilter();

    return this.standards().filter(
      (standard) => mediumId === 'all' || standard.mediumId === mediumId,
    );
  });
  protected readonly subjectOptions = computed(() => {
    const mediumId = this.mediumFilter();
    const standardId = this.standardFilter();

    return this.subjects().filter(
      (subject) =>
        (mediumId === 'all' || subject.mediumId === mediumId) &&
        (standardId === 'all' || subject.standardId === standardId),
    );
  });
  protected readonly chapterOptions = computed(() => {
    const mediumId = this.mediumFilter();
    const standardId = this.standardFilter();
    const subjectId = this.subjectFilter();

    return this.chapters().filter(
      (chapter) =>
        (mediumId === 'all' || chapter.mediumId === mediumId) &&
        (standardId === 'all' || chapter.standardId === standardId) &&
        (subjectId === 'all' || chapter.subjectId === subjectId),
    );
  });

  protected readonly statuses: StatusFilter[] = ['all', 'active', 'inactive'];
  protected readonly pageSizes = [10, 25, 50];

  constructor() {
    const navigationNotice = this.router.getCurrentNavigation()?.extras.state?.['notice'];

    if (typeof navigationNotice === 'string') {
      this.notice.set(navigationNotice);
    }

    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });

    this.loadMasters();
    this.load();
  }

  protected loadMasters(): void {
    this.mastersError.set(null);

    forkJoin({
      mediums: this.mediumsApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'name',
        dir: 'asc',
      }),
      standards: this.standardsApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      }),
      subjects: this.subjectsApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      }),
      chapters: this.chaptersApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      }),
      questionTypes: this.questionTypesApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      }),
      difficultyLevels: this.difficultyLevelsApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      }),
      bloomLevels: this.bloomLevelsApi.list({
        pageSize: MASTER_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      }),
    })
      .pipe(
        catchError(() => {
          this.mastersError.set('Some filters could not be loaded. Refresh to try again.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result === null) {
          return;
        }

        this.mediums.set(result.mediums.items);
        this.standards.set(result.standards.items);
        this.subjects.set(result.subjects.items);
        this.chapters.set(result.chapters.items);
        this.questionTypes.set(result.questionTypes.items);
        this.difficultyLevels.set(result.difficultyLevels.items);
        this.bloomLevels.set(result.bloomLevels.items);
      });
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    const status = this.statusFilter();

    this.questionsApi
      .list({
        search: this.query().trim(),
        mediumId: this.mediumFilter() === 'all' ? '' : this.mediumFilter(),
        standardId: this.standardFilter() === 'all' ? '' : this.standardFilter(),
        subjectId: this.subjectFilter() === 'all' ? '' : this.subjectFilter(),
        chapterId: this.chapterFilter() === 'all' ? '' : this.chapterFilter(),
        topicId: this.topicFilter() === 'all' ? '' : this.topicFilter(),
        questionTypeId: this.questionTypeFilter() === 'all' ? '' : this.questionTypeFilter(),
        difficultyLevelId: this.difficultyFilter() === 'all' ? '' : this.difficultyFilter(),
        bloomLevelId: this.bloomFilter() === 'all' ? '' : this.bloomFilter(),
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

  protected loadTopics(chapterId: string): void {
    const requestId = ++this.topicsRequestId;

    this.topics.set([]);

    if (chapterId === 'all') {
      this.topicsLoading.set(false);
      return;
    }

    this.topicsLoading.set(true);

    this.topicsApi
      .list({
        chapterId,
        pageSize: TOPIC_FETCH_LIMIT,
        status: 'active',
        sort: 'order',
        dir: 'asc',
      })
      .pipe(
        finalize(() => {
          if (requestId === this.topicsRequestId) {
            this.topicsLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          if (requestId === this.topicsRequestId) {
            this.topics.set(page.items);
          }
        },
        error: () => {
          if (requestId === this.topicsRequestId) {
            this.topics.set([]);
          }
        },
      });
  }

  protected onSearch(value: string): void {
    this.searchInput.next(value);
  }

  protected setMediumFilter(value: string): void {
    this.mediumFilter.set(value);
    this.standardFilter.set('all');
    this.subjectFilter.set('all');
    this.chapterFilter.set('all');
    this.topicFilter.set('all');
    this.loadTopics('all');
    this.page.set(1);
    this.load();
  }

  protected setStandardFilter(value: string): void {
    this.standardFilter.set(value);
    this.subjectFilter.set('all');
    this.chapterFilter.set('all');
    this.topicFilter.set('all');
    this.loadTopics('all');
    this.page.set(1);
    this.load();
  }

  protected setSubjectFilter(value: string): void {
    this.subjectFilter.set(value);
    this.chapterFilter.set('all');
    this.topicFilter.set('all');
    this.loadTopics('all');
    this.page.set(1);
    this.load();
  }

  protected setChapterFilter(value: string): void {
    this.chapterFilter.set(value);
    this.topicFilter.set('all');
    this.loadTopics(value);
    this.page.set(1);
    this.load();
  }

  protected setTopicFilter(value: string): void {
    this.topicFilter.set(value);
    this.page.set(1);
    this.load();
  }

  protected setQuestionTypeFilter(value: string): void {
    this.questionTypeFilter.set(value);
    this.page.set(1);
    this.load();
  }

  protected setDifficultyFilter(value: string): void {
    this.difficultyFilter.set(value);
    this.page.set(1);
    this.load();
  }

  protected setBloomFilter(value: string): void {
    this.bloomFilter.set(value);
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

  protected clearFilters(): void {
    this.query.set('');
    this.mediumFilter.set('all');
    this.standardFilter.set('all');
    this.subjectFilter.set('all');
    this.chapterFilter.set('all');
    this.topicFilter.set('all');
    this.questionTypeFilter.set('all');
    this.difficultyFilter.set('all');
    this.bloomFilter.set('all');
    this.statusFilter.set('all');
    this.includeDeleted.set(false);
    this.topics.set([]);
    this.page.set(1);
    this.load();
  }

  protected sortBy(field: QuestionSortField): void {
    if (this.sort() === field) {
      this.dir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sort.set(field);
      this.dir.set(field === 'text' || field === 'marks' ? 'asc' : 'desc');
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

  protected lineageLabel(question: QuestionListItem): string {
    return `${question.subjectName} - ${question.standardName} - ${question.mediumName}`;
  }

  protected questionLocation(question: QuestionListItem): string {
    return question.topicName ?? question.chapterName;
  }

  protected toggleStatus(question: QuestionListItem): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: QuestionStatus = question.status === 'active' ? 'inactive' : 'active';

    this.busyId.set(question.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(null);

    this.questionsApi
      .update(question.id, { status: next })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set(next === 'active' ? 'Question activated.' : 'Question deactivated.');
          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(question: QuestionListItem): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(question.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(question: QuestionListItem): void {
    this.busyId.set(question.id);
    this.actionError.set(null);

    this.questionsApi
      .remove(question.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);
          this.notice.set('Question deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(question: QuestionListItem): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(question.id);
    this.actionError.set(null);
    this.notice.set(null);

    this.questionsApi
      .restore(question.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notice.set('Question restored.');
          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected dismissNotice(): void {
    this.notice.set(null);
  }

  protected displayText(value: string): string {
    return plainMathText(value);
  }

  protected dateLabel(value: string | null): string {
    if (value === null) {
      return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '-'
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
