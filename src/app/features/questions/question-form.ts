import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, expand, finalize, forkJoin, reduce, type Observable } from 'rxjs';
import { BloomLevelsService } from '../../core/api/bloom-levels.service';
import type { BloomLevelRecord } from '../../core/api/bloom-levels.types';
import { ChaptersService } from '../../core/api/chapters.service';
import type { ChapterRecord } from '../../core/api/chapters.types';
import { DifficultyLevelsService } from '../../core/api/difficulty-levels.service';
import type { DifficultyLevelRecord } from '../../core/api/difficulty-levels.types';
import { MediumsService } from '../../core/api/mediums.service';
import type { MediumRecord } from '../../core/api/mediums.types';
import { QuestionTypesService } from '../../core/api/question-types.service';
import type { QuestionTypeRecord } from '../../core/api/question-types.types';
import { QuestionsService } from '../../core/api/questions.service';
import type {
  QuestionOption,
  QuestionRecord,
  QuestionStatus,
} from '../../core/api/questions.types';
import { StandardsService } from '../../core/api/standards.service';
import type { StandardRecord } from '../../core/api/standards.types';
import { SubjectsService } from '../../core/api/subjects.service';
import type { SubjectRecord } from '../../core/api/subjects.types';
import { TopicsService } from '../../core/api/topics.service';
import type { TopicRecord } from '../../core/api/topics.types';
import { requiredValidator } from '../../shared/forms/validators';
import { Icon } from '../../shared/icon/icon';
import { MathContent } from '../../shared/math/math-content';
import { mathTextFromHtml } from '../../shared/math/mathml-paste';
import { recognizeImage, type OcrLanguage } from '../../shared/ocr/image-ocr';

interface OptionControls {
  key: FormControl<string>;
  text: FormControl<string>;
  isCorrect: FormControl<boolean>;
}

type OptionForm = FormGroup<OptionControls>;

interface MasterData {
  mediums: MediumRecord[];
  standards: StandardRecord[];
  subjects: SubjectRecord[];
  chapters: ChapterRecord[];
  questionTypes: QuestionTypeRecord[];
  difficultyLevels: DifficultyLevelRecord[];
  bloomLevels: BloomLevelRecord[];
}

interface PreviewOption {
  key: string;
  text: string;
}

interface QuestionPreview {
  text: string;
  marks: number | null;
  options: PreviewOption[];
}

interface InsertTarget {
  start: number;
  end: number;
  optionIndex: number | null;
}

const BLOOM_BY_DIFFICULTY: Record<string, string> = {
  easy: 'remember',
  medium: 'apply',
  hard: 'evaluate',
};

const MASTER_FETCH_LIMIT = 50;
const MAX_OPTIONS = 10;
const OPTION_TEXT_MAX = 1000;
const TAGS_MAX = 20;
const TAG_MAX_LENGTH = 30;

@Component({
  selector: 'app-question-form',
  imports: [ReactiveFormsModule, RouterLink, Icon, MathContent],
  templateUrl: './question-form.html',
  styleUrl: './question-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionForm {
  private readonly questionsApi = inject(QuestionsService);
  private readonly mediumsApi = inject(MediumsService);
  private readonly standardsApi = inject(StandardsService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly chaptersApi = inject(ChaptersService);
  private readonly topicsApi = inject(TopicsService);
  private readonly questionTypesApi = inject(QuestionTypesService);
  private readonly difficultyLevelsApi = inject(DifficultyLevelsService);
  private readonly bloomLevelsApi = inject(BloomLevelsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly questionId = this.route.snapshot.paramMap.get('id');
  protected readonly editing = this.questionId !== null;

  private topicsRequestId = 0;
  private activeOptionIndex: number | null = null;
  private equationTarget: InsertTarget | null = null;

  private readonly questionInput = viewChild<ElementRef<HTMLTextAreaElement>>('questionText');
  private readonly equationInput = viewChild<ElementRef<HTMLTextAreaElement>>('equationInput');

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly topicsLoading = signal(false);
  protected readonly topicsError = signal<string | null>(null);
  protected readonly preview = signal<QuestionPreview>({
    text: '',
    marks: 1,
    options: [],
  });
  protected readonly ocrBusy = signal(false);
  protected readonly ocrStatus = signal('');
  protected readonly ocrError = signal<string | null>(null);
  protected readonly ocrLanguage = signal<OcrLanguage>('eng+guj');
  protected readonly equationOpen = signal(false);
  protected readonly equationLatex = signal('');
  protected readonly equationDisplay = signal(false);
  protected readonly equationPreview = computed(() => {
    const latex = this.equationLatex().trim();

    return latex === ''
      ? ''
      : `${this.equationDisplay() ? '$$' : '$'}${latex}${this.equationDisplay() ? '$$' : '$'}`;
  });

  protected readonly mediums = signal<MediumRecord[]>([]);
  protected readonly standards = signal<StandardRecord[]>([]);
  protected readonly subjects = signal<SubjectRecord[]>([]);
  protected readonly chapters = signal<ChapterRecord[]>([]);
  protected readonly topics = signal<TopicRecord[]>([]);
  protected readonly questionTypes = signal<QuestionTypeRecord[]>([]);
  protected readonly difficultyLevels = signal<DifficultyLevelRecord[]>([]);
  protected readonly bloomLevels = signal<BloomLevelRecord[]>([]);

  protected readonly selectedMedium = signal('');
  protected readonly selectedStandard = signal('');
  protected readonly selectedSubject = signal('');
  protected readonly selectedChapter = signal('');
  protected readonly selectedQuestionType = signal('');
  protected readonly selectedDifficulty = signal('');
  protected readonly selectedBloom = signal('');

  protected readonly form = new FormGroup({
    text: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.maxLength(5000)],
    }),
    mediumId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    standardId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    subjectId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    chapterId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    topicId: new FormControl('', { nonNullable: true }),
    questionTypeId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    difficultyLevelId: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
    bloomLevelId: new FormControl('', { nonNullable: true }),
    options: new FormArray<OptionForm>([]),
    answer: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(5000)],
    }),
    explanation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(5000)],
    }),
    source: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    tags: new FormControl('', { nonNullable: true }),
    marks: new FormControl<number | null>(1, {
      validators: [requiredValidator, Validators.min(0.5), Validators.max(100)],
    }),
    status: new FormControl<QuestionStatus>('active', { nonNullable: true }),
  });

  protected readonly mediumOptions = computed(() =>
    this.mediums().filter(
      (medium) => medium.status === 'active' || medium.id === this.selectedMedium(),
    ),
  );

  protected readonly standardOptions = computed(() =>
    this.standards().filter(
      (standard) =>
        standard.mediumId === this.selectedMedium() &&
        (standard.status === 'active' || standard.id === this.selectedStandard()),
    ),
  );

  protected readonly subjectOptions = computed(() =>
    this.subjects().filter(
      (subject) =>
        subject.standardId === this.selectedStandard() &&
        (subject.status === 'active' || subject.id === this.selectedSubject()),
    ),
  );

  protected readonly chapterOptions = computed(() =>
    this.chapters().filter(
      (chapter) =>
        chapter.subjectId === this.selectedSubject() &&
        (chapter.status === 'active' || chapter.id === this.selectedChapter()),
    ),
  );

  protected readonly topicOptions = computed(() =>
    this.topics().filter(
      (topic) => topic.status === 'active' || topic.id === this.form.controls.topicId.value,
    ),
  );

  protected readonly questionTypeOptions = computed(() =>
    this.questionTypes().filter(
      (type) => type.status === 'active' || type.id === this.selectedQuestionType(),
    ),
  );

  protected readonly difficultyOptions = computed(() =>
    this.difficultyLevels().filter(
      (level) => level.status === 'active' || level.id === this.selectedDifficulty(),
    ),
  );

  protected readonly bloomOptions = computed(() =>
    this.bloomLevels().filter(
      (level) => level.status === 'active' || level.id === this.selectedBloom(),
    ),
  );

  constructor() {
    this.bindCascade();
    this.bindPreview();
    this.load();
  }

  protected get options(): FormArray<OptionForm> {
    return this.form.controls.options;
  }

  protected get canAddOption(): boolean {
    return this.options.length < MAX_OPTIONS;
  }

  protected addOption(): void {
    if (!this.canAddOption) {
      return;
    }

    this.options.push(
      this.createOption({
        key: this.nextOptionKey(),
        text: '',
        isCorrect: false,
      }),
    );
  }

  protected removeOption(index: number): void {
    this.options.removeAt(index);

    if (this.activeOptionIndex === null) {
      return;
    }

    this.activeOptionIndex =
      this.activeOptionIndex === index
        ? null
        : this.activeOptionIndex > index
          ? this.activeOptionIndex - 1
          : this.activeOptionIndex;
  }

  protected optionError(index: number, control: 'text'): boolean {
    const field = this.options.at(index).controls[control];

    return field.invalid && field.touched;
  }

  protected isFieldInvalid(
    control:
      | 'text'
      | 'mediumId'
      | 'standardId'
      | 'subjectId'
      | 'chapterId'
      | 'questionTypeId'
      | 'difficultyLevelId'
      | 'answer'
      | 'explanation'
      | 'source'
      | 'marks',
  ): boolean {
    const field = this.form.controls[control];

    return field.invalid && field.touched;
  }

  protected onMediumChange(): void {
    this.resetHierarchy('standard');
  }

  protected onStandardChange(): void {
    this.resetHierarchy('subject');
  }

  protected onSubjectChange(): void {
    this.resetHierarchy('chapter');
  }

  protected onChapterChange(): void {
    this.form.controls.topicId.setValue('', { emitEvent: false });
  }

  protected retry(): void {
    this.load();
  }

  protected dismissError(): void {
    this.saveError.set(null);
  }

  protected optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected focusQuestion(): void {
    this.activeOptionIndex = null;
  }

  protected focusOption(index: number): void {
    this.activeOptionIndex = index;
  }

  protected onOcrLanguageChange(event: Event): void {
    this.ocrLanguage.set((event.target as HTMLSelectElement).value as OcrLanguage);
  }

  protected insertFraction(): void {
    this.insertLatexTemplate('\\frac{}{}', 6);
  }

  protected insertPower(): void {
    this.insertLatexTemplate('x^{2}', 3, 4);
  }

  protected insertSubscript(): void {
    this.insertLatexTemplate('x_{2}', 3, 4);
  }

  protected insertRoot(): void {
    this.insertLatexTemplate('\\sqrt{}', 6);
  }

  protected insertSum(): void {
    this.insertLatexTemplate('\\sum_{i=1}^{n}');
  }

  protected insertIntegral(): void {
    this.insertLatexTemplate('\\int_{a}^{b}');
  }

  protected insertSymbol(
    symbol: 'pi' | 'times' | 'divide' | 'le' | 'ge' | 'ne' | 'pm' | 'infinity' | 'degree',
  ): void {
    const symbols = {
      pi: '\\pi',
      times: '\\times',
      divide: '\\div',
      le: '\\le',
      ge: '\\ge',
      ne: '\\ne',
      pm: '\\pm',
      infinity: '\\infty',
      degree: '^\\circ',
    } as const;

    this.insertLatexTemplate(symbols[symbol]);
  }

  protected openEquation(): void {
    const target = this.currentTarget();
    const selected = this.targetControl(target.optionIndex).value.slice(target.start, target.end);
    const latex = this.stripMathDelimiters(selected);

    this.equationTarget = target;
    this.equationLatex.set(latex);
    this.equationDisplay.set(selected.trim().startsWith('$$'));
    this.equationOpen.set(true);

    setTimeout(() => this.equationInput()?.nativeElement.focus());
  }

  protected closeEquation(): void {
    this.equationOpen.set(false);
    this.equationTarget = null;
  }

  protected onEquationInput(event: Event): void {
    this.equationLatex.set((event.target as HTMLTextAreaElement).value);
  }

  protected onEquationDisplayChange(event: Event): void {
    this.equationDisplay.set((event.target as HTMLInputElement).checked);
  }

  protected insertEquation(): void {
    const latex = this.equationLatex().trim();

    if (latex === '') {
      return;
    }

    const target = this.equationTarget ?? this.currentTarget();
    const snippet = this.equationDisplay() ? `$$${latex}$$` : `$${latex}$`;

    this.insertText(snippet, target.start, target.end, target.optionIndex);
    this.closeEquation();
  }

  protected onQuestionPaste(event: ClipboardEvent): void {
    this.activeOptionIndex = null;
    this.handlePaste(event);
  }

  protected onOptionPaste(event: ClipboardEvent, index: number): void {
    this.activeOptionIndex = index;
    this.handlePaste(event);
  }

  private handlePaste(event: ClipboardEvent): void {
    const clipboard = event.clipboardData;

    if (clipboard === null) {
      return;
    }

    const image = Array.from(clipboard.items).find((item) => item.type.startsWith('image/'));

    if (image !== undefined) {
      const file = image.getAsFile();

      if (file !== null) {
        event.preventDefault();
        this.readImage(file, this.currentTarget());
        return;
      }
    }

    const html = clipboard.getData('text/html');

    if (/<math[\s>]/i.test(html)) {
      event.preventDefault();
      void this.pasteMathHtml(html, this.currentTarget());
      return;
    }

    const plain = clipboard.getData('text/plain');

    if (/<math[\s>]/i.test(plain)) {
      event.preventDefault();
      void this.pasteMathHtml(plain, this.currentTarget());
    }
  }

  protected dismissOcrError(): void {
    this.ocrError.set(null);
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }

    this.saveError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.saveError.set('Please complete the required fields before saving.');
      return;
    }

    const value = this.form.getRawValue();
    const options = value.options.map((option, index) => ({
      key: option.key.trim().toUpperCase() || this.optionLetter(index),
      text: option.text.trim(),
      isCorrect: option.isCorrect,
    }));

    if (options.length > 0 && options.length < 2) {
      this.saveError.set('Add at least two options, or remove options entirely.');
      return;
    }

    if (options.length > 0 && !options.some((option) => option.isCorrect)) {
      this.saveError.set('Mark at least one option as correct.');
      return;
    }

    const answer = value.answer.trim();
    const hasCorrectOption = options.some((option) => option.isCorrect);

    if (value.status === 'active' && answer === '' && !hasCorrectOption) {
      this.saveError.set(
        'Active questions need an answer key. Enter an answer or mark a correct option.',
      );
      return;
    }

    const tags = this.parseTags(value.tags);

    if (tags.length > TAGS_MAX) {
      this.saveError.set(`Use ${TAGS_MAX} tags or fewer.`);
      return;
    }

    if (tags.some((tag) => tag.length > TAG_MAX_LENGTH)) {
      this.saveError.set(`Each tag must be ${TAG_MAX_LENGTH} characters or fewer.`);
      return;
    }

    if (value.marks === null) {
      this.saveError.set('Enter the marks for this question.');
      return;
    }

    const payload = {
      text: value.text.trim(),
      chapterId: value.chapterId,
      topicId: value.topicId || null,
      questionTypeId: value.questionTypeId,
      difficultyLevelId: value.difficultyLevelId,
      bloomLevelId: value.bloomLevelId || null,
      options,
      answer,
      explanation: value.explanation.trim(),
      source: value.source.trim(),
      tags,
      marks: Number(value.marks),
      status: value.status,
    };

    this.saving.set(true);

    const request: Observable<QuestionRecord> =
      this.editing && this.questionId !== null
        ? this.questionsApi.update(this.questionId, payload)
        : this.questionsApi.create(payload);

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (question) => {
          void this.router.navigate(['/questions', question.id], {
            state: {
              notice: this.editing ? 'Question updated.' : 'Question created.',
            },
          });
        },
        error: (error: unknown) => this.saveError.set(this.messageOf(error)),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const masters$ = this.fetchMasters();

    if (this.editing && this.questionId !== null) {
      forkJoin({
        masters: masters$,
        question: this.questionsApi.get(this.questionId),
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ masters, question }) => {
            this.applyMasters(masters);
            this.fillForm(question);
            this.loading.set(false);
          },
          error: (error: unknown) => {
            this.loadError.set(this.messageOf(error));
            this.loading.set(false);
          },
        });

      return;
    }

    masters$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (masters) => {
        this.applyMasters(masters);
        this.applyDefaults();
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loadError.set(this.messageOf(error));
        this.loading.set(false);
      },
    });
  }

  private fetchMasters(): Observable<MasterData> {
    return forkJoin({
      mediums: this.fetchAll((page) =>
        this.mediumsApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'name',
          dir: 'asc',
        }),
      ),
      standards: this.fetchAll((page) =>
        this.standardsApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'order',
          dir: 'asc',
        }),
      ),
      subjects: this.fetchAll((page) =>
        this.subjectsApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'order',
          dir: 'asc',
        }),
      ),
      chapters: this.fetchAll((page) =>
        this.chaptersApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'order',
          dir: 'asc',
        }),
      ),
      questionTypes: this.fetchAll((page) =>
        this.questionTypesApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'order',
          dir: 'asc',
        }),
      ),
      difficultyLevels: this.fetchAll((page) =>
        this.difficultyLevelsApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'order',
          dir: 'asc',
        }),
      ),
      bloomLevels: this.fetchAll((page) =>
        this.bloomLevelsApi.list({
          page,
          pageSize: MASTER_FETCH_LIMIT,
          sort: 'order',
          dir: 'asc',
        }),
      ),
    });
  }

  private fetchAll<T>(
    load: (page: number) => Observable<{
      items: T[];
      total: number;
      page: number;
      pageSize: number;
    }>,
  ): Observable<T[]> {
    return load(1).pipe(
      expand((page) =>
        page.items.length > 0 && page.page * page.pageSize < page.total
          ? load(page.page + 1)
          : EMPTY,
      ),
      reduce((all, page) => all.concat(page.items), [] as T[]),
    );
  }

  private applyMasters(masters: MasterData): void {
    this.mediums.set(masters.mediums);
    this.standards.set(masters.standards);
    this.subjects.set(masters.subjects);
    this.chapters.set(masters.chapters);
    this.questionTypes.set(masters.questionTypes);
    this.difficultyLevels.set(masters.difficultyLevels);
    this.bloomLevels.set(masters.bloomLevels);
  }

  private applyDefaults(): void {
    const medium = this.firstActive(this.mediums());
    const standard = this.firstActive(
      this.standards().filter((item) => item.mediumId === medium?.id),
    );
    const subject = this.firstActive(
      this.subjects().filter((item) => item.standardId === standard?.id),
    );
    const chapter = this.firstActive(
      this.chapters().filter((item) => item.subjectId === subject?.id),
    );
    const questionType = this.firstActive(this.questionTypes());
    const difficulty = this.firstActive(this.difficultyLevels());

    this.form.patchValue({
      mediumId: medium?.id ?? '',
      standardId: standard?.id ?? '',
      subjectId: subject?.id ?? '',
      chapterId: chapter?.id ?? '',
      questionTypeId: questionType?.id ?? '',
      difficultyLevelId: difficulty?.id ?? '',
      bloomLevelId: this.bloomForDifficulty(difficulty?.id ?? ''),
      marks: 1,
      status: 'active',
    });
  }

  private fillForm(question: QuestionRecord): void {
    this.activeOptionIndex = null;
    this.form.patchValue(
      {
        text: question.text,
        mediumId: question.mediumId,
        standardId: question.standardId,
        subjectId: question.subjectId,
        chapterId: question.chapterId,
        questionTypeId: question.questionTypeId,
        difficultyLevelId: question.difficultyLevelId,
        bloomLevelId: question.bloomLevelId ?? '',
        answer: question.answer,
        explanation: question.explanation,
        source: question.source,
        tags: question.tags.join(', '),
        marks: question.marks,
        status: question.status,
      },
      { emitEvent: false },
    );

    this.selectedMedium.set(question.mediumId);
    this.selectedStandard.set(question.standardId);
    this.selectedSubject.set(question.subjectId);
    this.selectedChapter.set(question.chapterId);
    this.selectedQuestionType.set(question.questionTypeId);
    this.selectedDifficulty.set(question.difficultyLevelId);
    this.selectedBloom.set(question.bloomLevelId ?? '');
    this.form.controls.topicId.setValue(question.topicId ?? '', {
      emitEvent: false,
    });

    this.options.clear();
    question.options.forEach((option) => this.options.push(this.createOption(option)));
    this.loadTopics(question.chapterId);
    this.refreshPreview();
  }

  private bindPreview(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshPreview());
    this.refreshPreview();
  }

  private refreshPreview(): void {
    const value = this.form.getRawValue();
    const options = value.options
      .filter((option) => option.text.trim() !== '')
      .map((option, index) => ({
        key: option.key.trim() || this.optionLetter(index),
        text: option.text,
      }));

    this.preview.set({
      text: value.text,
      marks: value.marks,
      options,
    });
  }

  private bloomForDifficulty(difficultyId: string): string {
    if (difficultyId === '') {
      return '';
    }

    const blooms = this.bloomLevels()
      .filter((bloom) => bloom.status === 'active')
      .sort((left, right) => left.order - right.order);
    const difficulty = this.difficultyLevels().find((item) => item.id === difficultyId);

    if (difficulty !== undefined) {
      const expected = BLOOM_BY_DIFFICULTY[difficulty.name.trim().toLowerCase()];

      if (expected !== undefined) {
        const match = blooms.find((bloom) => bloom.name.trim().toLowerCase() === expected);

        if (match !== undefined) {
          return match.id;
        }
      }
    }

    const difficulties = this.difficultyLevels()
      .filter((item) => item.status === 'active')
      .sort((left, right) => left.order - right.order);
    const difficultyIndex = difficulties.findIndex((item) => item.id === difficultyId);

    if (difficultyIndex < 0 || blooms.length === 0) {
      return '';
    }

    const position =
      difficulties.length === 1
        ? 0
        : Math.floor((difficultyIndex / (difficulties.length - 1)) * (blooms.length - 1));

    return blooms[position]?.id ?? '';
  }

  private insertLatexTemplate(
    latex: string,
    selectStart = latex.length,
    selectEnd = selectStart,
  ): void {
    const snippet = `$${latex}$`;

    this.insertAtSelection(snippet, 1 + selectStart, 1 + selectEnd);
  }

  private insertAtSelection(text: string, selectStart?: number, selectEnd?: number): void {
    const target = this.currentTarget();

    this.insertText(text, target.start, target.end, target.optionIndex, selectStart, selectEnd);
  }

  private currentTarget(): InsertTarget {
    const input = this.targetInput(this.activeOptionIndex);

    const end = this.targetControl(this.activeOptionIndex).value.length;

    if (input === null) {
      return { start: end, end, optionIndex: this.activeOptionIndex };
    }

    return {
      start: input.selectionStart ?? end,
      end: input.selectionEnd ?? end,
      optionIndex: this.activeOptionIndex,
    };
  }

  private targetInput(optionIndex: number | null): HTMLInputElement | HTMLTextAreaElement | null {
    if (optionIndex === null) {
      return this.questionInput()?.nativeElement ?? null;
    }

    return this.element.nativeElement.querySelector<HTMLInputElement>(
      `[data-testid="option-text-${optionIndex}"]`,
    );
  }

  private targetControl(optionIndex: number | null): FormControl<string> {
    if (optionIndex !== null) {
      const option = this.options.at(optionIndex);

      if (option !== undefined) {
        return option.controls.text;
      }
    }

    return this.form.controls.text;
  }

  private insertText(
    text: string,
    start: number,
    end: number,
    optionIndex: number | null,
    selectStart?: number,
    selectEnd?: number,
  ): void {
    const control = this.targetControl(optionIndex);
    const value = control.value;
    const from = Math.min(start, value.length);
    const to = Math.min(Math.max(end, from), value.length);
    const next = value.slice(0, from) + text + value.slice(to);

    control.setValue(next);
    control.markAsDirty();
    this.saveError.set(null);

    const cursorStart = selectStart === undefined ? from + text.length : from + selectStart;
    const cursorEnd = selectEnd === undefined ? cursorStart : from + selectEnd;

    queueMicrotask(() => {
      const input = this.targetInput(optionIndex);

      if (input === null) {
        return;
      }

      input.focus();
      input.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  private stripMathDelimiters(value: string): string {
    return value
      .trim()
      .replace(/^\$\$?/, '')
      .replace(/\$\$?$/, '')
      .replace(/^\\\[/, '')
      .replace(/\\\]$/, '')
      .replace(/^\\\(/, '')
      .replace(/\\\)$/, '')
      .trim();
  }

  private async pasteMathHtml(html: string, target: InsertTarget): Promise<void> {
    try {
      const text = await mathTextFromHtml(html);

      if (text !== null) {
        this.insertText(text, target.start, target.end, target.optionIndex);
      }
    } catch {
      this.ocrError.set('The copied equation could not be converted. Try inserting it manually.');
    }
  }

  private readImage(file: File, target: InsertTarget): void {
    this.ocrBusy.set(true);
    this.ocrError.set(null);
    this.ocrStatus.set('Reading image…');

    void recognizeImage(
      file,
      (progress) => {
        if (progress > 0 && progress < 1) {
          this.ocrStatus.set(`Reading image… ${Math.round(progress * 100)}%`);
        }
      },
      this.ocrLanguage(),
    )
      .then((text) => {
        const value = this.targetControl(target.optionIndex).value;
        const before = value.slice(Math.max(0, target.start - 1), target.start);
        const after = value.slice(target.end, target.end + 1);
        const prefix = before !== '' && !/\s/.test(before) ? '\n' : '';
        const suffix = after !== '' && !/\s/.test(after) ? '\n' : '';

        this.insertText(`${prefix}${text}${suffix}`, target.start, target.end, target.optionIndex);
      })
      .catch(() => {
        this.ocrError.set(
          'The image could not be read. Try a clearer screenshot or type the text instead.',
        );
      })
      .finally(() => {
        this.ocrBusy.set(false);
        this.ocrStatus.set('');
      });
  }

  private bindCascade(): void {
    this.form.controls.mediumId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedMedium.set(value));
    this.form.controls.standardId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedStandard.set(value));
    this.form.controls.subjectId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedSubject.set(value));
    this.form.controls.questionTypeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedQuestionType.set(value));
    this.form.controls.difficultyLevelId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedDifficulty.set(value);
        this.form.controls.bloomLevelId.setValue(this.bloomForDifficulty(value));
      });
    this.form.controls.bloomLevelId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedBloom.set(value));
    this.form.controls.chapterId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedChapter.set(value);
        this.form.controls.topicId.setValue('', { emitEvent: false });
        this.loadTopics(value);
      });
  }

  private resetHierarchy(level: 'standard' | 'subject' | 'chapter'): void {
    if (level === 'standard') {
      this.form.patchValue({ standardId: '', subjectId: '', chapterId: '' });
    } else if (level === 'subject') {
      this.form.patchValue({ subjectId: '', chapterId: '' });
    } else {
      this.form.patchValue({ chapterId: '' });
    }

    this.form.controls.topicId.setValue('', { emitEvent: false });
  }

  private loadTopics(chapterId: string): void {
    const requestId = ++this.topicsRequestId;

    this.topics.set([]);
    this.topicsError.set(null);

    if (chapterId === '') {
      this.topicsLoading.set(false);
      return;
    }

    this.topicsLoading.set(true);

    this.fetchAll((page) =>
      this.topicsApi.list({
        chapterId,
        page,
        pageSize: MASTER_FETCH_LIMIT,
        sort: 'order',
        dir: 'asc',
      }),
    )
      .pipe(
        finalize(() => {
          if (requestId === this.topicsRequestId) {
            this.topicsLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (topics) => {
          if (requestId !== this.topicsRequestId) {
            return;
          }

          this.topics.set(topics);
        },
        error: () => {
          if (requestId === this.topicsRequestId) {
            this.topicsError.set('Topics could not be loaded.');
          }
        },
      });
  }

  private createOption(option: QuestionOption): OptionForm {
    return new FormGroup<OptionControls>({
      key: new FormControl(option.key, { nonNullable: true }),
      text: new FormControl(option.text, {
        nonNullable: true,
        validators: [requiredValidator, Validators.maxLength(OPTION_TEXT_MAX)],
      }),
      isCorrect: new FormControl(option.isCorrect, { nonNullable: true }),
    });
  }

  private nextOptionKey(): string {
    const used = new Set(
      this.options.controls.map((option) => option.controls.key.value.trim().toUpperCase()),
    );

    for (let index = 0; index < MAX_OPTIONS; index += 1) {
      const key = String.fromCharCode(65 + index);

      if (!used.has(key)) {
        return key;
      }
    }

    return String(this.options.length + 1);
  }

  private firstActive<T extends { id: string; status: string }>(items: T[]): T | undefined {
    return items.find((item) => item.status === 'active') ?? items[0];
  }

  private parseTags(raw: string): string[] {
    const seen = new Set<string>();
    const tags: string[] = [];

    for (const value of raw.split(/[\n,]+/)) {
      const tag = value.trim();

      if (tag === '') {
        continue;
      }

      const key = tag.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      tags.push(tag);
    }

    return tags;
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
