import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { QuestionsService } from '../../core/api/questions.service';
import type { QuestionOption, QuestionRecord } from '../../core/api/questions.types';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon/icon';
import { MathContent } from '../../shared/math/math-content';

@Component({
  selector: 'app-question-detail',
  imports: [RouterLink, Icon, MathContent],
  templateUrl: './question-detail.html',
  styleUrl: './question-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionDetail {
  private readonly questionsApi = inject(QuestionsService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly questionId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(
    (this.router.getCurrentNavigation()?.extras.state?.['notice'] as string | undefined) ?? null,
  );
  protected readonly busy = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly question = signal<QuestionRecord | null>(null);

  protected readonly canManage = computed(() => this.auth.can('questions.manage'));
  protected readonly correctOptions = computed(() =>
    (this.question()?.options ?? []).filter((option) => option.isCorrect),
  );

  constructor() {
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  protected dismissNotice(): void {
    this.notice.set(null);
  }

  protected dismissError(): void {
    this.actionError.set(null);
  }

  protected requestDelete(): void {
    this.actionError.set(null);
    this.confirmDelete.set(true);
  }

  protected cancelDelete(): void {
    this.confirmDelete.set(false);
  }

  protected toggleStatus(): void {
    const question = this.question();

    if (question === null || this.busy()) {
      return;
    }

    const next = question.status === 'active' ? 'inactive' : 'active';

    this.busy.set(true);
    this.actionError.set(null);
    this.notice.set(null);

    this.questionsApi
      .update(question.id, { status: next })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.question.set(updated);
          this.notice.set(next === 'active' ? 'Question activated.' : 'Question deactivated.');
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected restore(): void {
    const question = this.question();

    if (question === null || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.actionError.set(null);

    this.questionsApi
      .restore(question.id)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.question.set(updated);
          this.notice.set('Question restored.');
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected remove(): void {
    const question = this.question();

    if (question === null || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.actionError.set(null);

    this.questionsApi
      .remove(question.id)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/questions'], {
            state: { notice: 'Question deleted.' },
          });
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected optionLabel(option: QuestionOption): string {
    return option.key.trim() === '' ? 'Option' : option.key;
  }

  protected location(question: QuestionRecord): string {
    return question.topicName === null
      ? question.chapterName
      : `${question.chapterName} / ${question.topicName}`;
  }

  protected dateLabel(value: string | null): string {
    if (value === null) {
      return 'Not available';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? 'Not available'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.questionsApi
      .get(this.questionId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (question) => this.question.set(question),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
