import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Reports } from './reports';

describe('Reports', () => {
  let fixture: ComponentFixture<Reports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('lists the class & student report with a link', () => {
    const card = element().querySelector<HTMLAnchorElement>('[data-testid="report-card"]');

    expect(element().textContent).toContain('Class & Student');
    expect(element().textContent).toContain('Class-wise strength');
    expect(card?.getAttribute('href')).toBe('/reports/class-students');
  });
});
