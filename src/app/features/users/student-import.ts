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
import * as XLSX from 'xlsx';
import { SchoolUsersService } from '../../core/api/school-users.service';
import type { StudentImportResult } from '../../core/api/school-users.types';
import { Icon } from '../../shared/icon/icon';

const MAX_FILE_SIZE = 500_000;
const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function isoDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-student-import',
  imports: [RouterLink, Icon],
  templateUrl: './student-import.html',
  styleUrl: './student-import.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentImport {
  private readonly schoolUsers = inject(SchoolUsersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fileName = signal('');
  protected readonly csv = signal('');
  protected readonly result = signal<StudentImportResult | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly templateLoading = signal(false);

  protected readonly createdRows = computed(
    () => this.result()?.results.filter((row) => row.status === 'created') ?? [],
  );

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.result.set(null);
    this.error.set(null);

    if (file === null) {
      this.fileName.set('');
      this.csv.set('');
      return;
    }

    const name = file.name.toLowerCase();
    const isExcel = EXCEL_EXTENSIONS.some((extension) => name.endsWith(extension));
    const isCsv = name.endsWith('.csv');

    if (!isExcel && !isCsv) {
      this.fileName.set('');
      this.csv.set('');
      input.value = '';
      this.error.set('Choose an Excel (.xlsx) or CSV file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.fileName.set('');
      this.csv.set('');
      input.value = '';
      this.error.set('The file is too large. Keep the file under 500 KB.');
      return;
    }

    this.fileName.set(file.name);

    const read = isExcel ? this.readWorkbook(file) : file.text();

    void read
      .then((text) => this.csv.set(text))
      .catch(() => {
        this.fileName.set('');
        this.csv.set('');
        this.error.set(
          isExcel
            ? 'The spreadsheet could not be read. Choose it again.'
            : 'The file could not be read. Choose it again.',
        );
      });
  }

  protected startImport(): void {
    if (this.submitting()) {
      return;
    }

    if (this.csv().trim() === '') {
      this.error.set('Choose a CSV file before importing.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.result.set(null);

    this.schoolUsers
      .importStudents(this.csv())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected downloadTemplate(): void {
    if (this.templateLoading()) {
      return;
    }

    this.templateLoading.set(true);
    this.error.set(null);

    this.schoolUsers
      .importTemplate()
      .pipe(
        finalize(() => this.templateLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (content) => this.save('student-import-template.xlsx', content, EXCEL_MIME),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected downloadCredentials(): void {
    const rows = this.createdRows();

    if (rows.length === 0) {
      return;
    }

    const header = 'name,email,password';
    const lines = rows.map((row) =>
      [row.name, row.email, row.password ?? ''].map(csvField).join(','),
    );

    this.save('student-credentials.csv', [header, ...lines].join('\n') + '\n');
  }

  private async readWorkbook(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];

    if (!sheet) {
      throw new Error('The spreadsheet has no sheets.');
    }

    for (const [address, cell] of Object.entries(sheet)) {
      if (address.startsWith('!') || cell === undefined || cell === null) {
        continue;
      }

      const value = cell as XLSX.CellObject;

      if (value.t === 'd' && value.v instanceof Date) {
        value.t = 's';
        value.v = isoDate(value.v);

        delete value.w;
      }
    }

    return XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
  }

  private save(
    filename: string,
    content: string | ArrayBuffer,
    type = 'text/csv;charset=utf-8',
  ): void {
    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      this.error.set('The download could not be started. Please try again.');
    }
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
