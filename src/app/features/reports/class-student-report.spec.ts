import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClassStudentReport } from './class-student-report';

describe('ClassStudentReport', () => {
  let fixture: ComponentFixture<ClassStudentReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassStudentReport],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassStudentReport);
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the report header and empty state', () => {
    expect(element().textContent).toContain('Class & Student');
    expect(element().textContent).toContain('Class-wise strength');
    expect(element().textContent).toContain('Report data is on its way');
  });

  it('links back to the reports index', () => {
    const link = element().querySelector<HTMLAnchorElement>('[data-testid="back-to-reports"]');

    expect(link?.getAttribute('href')).toBe('/reports');
  });
});
