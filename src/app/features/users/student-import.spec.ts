import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import * as XLSX from 'xlsx';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import type { StudentImportResult } from '../../core/api/school-users.types';
import { StudentImport } from './student-import';

const IMPORT_RESULT: StudentImportResult = {
  total: 2,
  created: 1,
  failed: 1,
  results: [
    {
      row: 1,
      status: 'created',
      name: 'Esha Kulkarni',
      email: 'esha@greenwood.test',
      password: 'Abcd@1234wxyz',
      error: null,
    },
    {
      row: 2,
      status: 'failed',
      name: 'Ravi Shah',
      email: 'ravi@greenwood.test',
      password: null,
      error: 'Unknown subject "Astronomy".',
    },
  ],
};

describe('StudentImport', () => {
  let fixture: ComponentFixture<StudentImport>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentImport],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StudentImport);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function chooseFile(content: string, name = 'students.csv'): void {
    chooseBlob([content], name, 'text/csv');
  }

  function chooseSpreadsheet(rows: (string | number | Date)[][], name = 'students.xlsx'): void {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, sheet, 'Students');
    chooseBlob(
      [XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })],
      name,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  }

  function chooseBlob(parts: BlobPart[], name: string, type: string): void {
    const fileInput = element().querySelector<HTMLInputElement>('[data-testid="csv-input"]');

    if (fileInput === null) {
      throw new Error('CSV input not found');
    }

    Object.defineProperty(fileInput, 'files', {
      value: [new File(parts, name, { type })],
      configurable: true,
    });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function startImport(): void {
    element().querySelector<HTMLButtonElement>('[data-testid="start-import"]')?.click();
    fixture.detectChanges();
  }

  async function waitForSelection(): Promise<void> {
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        element().querySelector<HTMLButtonElement>('[data-testid="start-import"]')?.disabled,
      ).toBe(false);
    });
  }

  it('renders the walkthrough with a link back to students', () => {
    expect(element().textContent).toContain('Bulk import students');
    expect(element().textContent).toContain('Download the template');
    expect(element().textContent).toContain('Choose your file');
    expect(element().querySelector('.crumbs a')?.getAttribute('href')).toBe('/users/students');
    expect(
      element().querySelector<HTMLButtonElement>('[data-testid="start-import"]')?.disabled,
    ).toBe(true);
  });

  it('rejects files over the size limit', () => {
    chooseFile('x'.repeat(500_001), 'huge.csv');

    expect(element().textContent).toContain('The file is too large. Keep the file under 500 KB.');
    expect(element().textContent).toContain('No file chosen');
  });

  it('rejects unsupported file types', () => {
    chooseFile('hello', 'students.txt');

    expect(element().textContent).toContain('Choose an Excel (.xlsx) or CSV file.');
    expect(element().textContent).toContain('No file chosen');
  });

  it('reads the chosen file and imports its rows', async () => {
    chooseFile('first_name,surname\nEsha,Kulkarni\n');

    await waitForSelection();
    startImport();

    const request = httpMock.expectOne('/api/users/import');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ csv: 'first_name,surname\nEsha,Kulkarni\n' });

    request.flush(IMPORT_RESULT);
    fixture.detectChanges();

    expect(element().textContent).toContain('1 of 2 rows created');
    expect(element().textContent).toContain('1 failed');
    expect(element().textContent).toContain('Abcd@1234wxyz');
    expect(element().textContent).toContain('Unknown subject "Astronomy".');

    const failedRow = element().querySelector<HTMLElement>('[data-row="2"]');

    expect(failedRow?.querySelector('.pill--failed')).not.toBeNull();
  });

  it('converts an Excel workbook into import rows', async () => {
    chooseSpreadsheet([
      ['first_name', 'gr_number', 'roll_number', 'dob'],
      ['Esha', 'GR-2026-017', 21, new Date(2011, 0, 20)],
    ]);

    await waitForSelection();
    startImport();

    const request = httpMock.expectOne('/api/users/import');

    expect(request.request.body).toEqual({
      csv: 'first_name,gr_number,roll_number,dob\nEsha,GR-2026-017,21,2011-01-20',
    });

    request.flush({
      total: 1,
      created: 1,
      failed: 0,
      results: [
        {
          row: 1,
          status: 'created',
          name: 'Esha',
          email: '',
          password: 'Abcd@1234wxyz',
          error: null,
        },
      ],
    });
    fixture.detectChanges();

    expect(element().textContent).toContain('1 of 1 rows created');
  });

  it('downloads credentials for the created rows', async () => {
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:credentials');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    chooseFile('first_name\nEsha\n');
    await waitForSelection();
    startImport();
    httpMock.expectOne('/api/users/import').flush(IMPORT_RESULT);
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('[data-testid="download-credentials"]')?.click();

    const blob = createUrl.mock.calls[0]?.[0];

    expect(blob).toBeInstanceOf(Blob);
    await expect((blob as Blob).text()).resolves.toBe(
      'name,email,password\nEsha Kulkarni,esha@greenwood.test,Abcd@1234wxyz\n',
    );
    expect(click).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalledWith('blob:credentials');
  });

  it('downloads the Excel template', () => {
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:template');

    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    element().querySelector<HTMLButtonElement>('[data-testid="download-template"]')?.click();
    fixture.detectChanges();

    const request = httpMock.expectOne('/api/users/import-template');

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('arraybuffer');
    request.flush(new ArrayBuffer(8));
    fixture.detectChanges();

    const blob = createUrl.mock.calls[0]?.[0];

    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(element().querySelector('[data-testid="import-error"]')).toBeNull();
  });

  it('keeps the import disabled until a file is chosen', () => {
    const button = element().querySelector<HTMLButtonElement>('[data-testid="start-import"]');

    expect(button?.disabled).toBe(true);

    startImport();

    httpMock.expectNone('/api/users/import');
    expect(element().textContent).toContain('No file chosen');
  });

  it('shows server errors from the import', async () => {
    chooseFile('first_name\n');
    await waitForSelection();
    startImport();

    httpMock
      .expectOne('/api/users/import')
      .flush(
        { message: 'Import is limited to 100 students per file.' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="import-error"]')?.textContent).toContain(
      'Import is limited to 100 students per file.',
    );
  });
});
