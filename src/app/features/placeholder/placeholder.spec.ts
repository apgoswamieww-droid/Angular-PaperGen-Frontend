import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Placeholder } from './placeholder';

describe('Placeholder', () => {
  let fixture: ComponentFixture<Placeholder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Placeholder],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Placeholder);
  });

  it('renders the supplied title and description', () => {
    fixture.componentRef.setInput('title', 'Question Bank');
    fixture.componentRef.setInput('description', 'Curate questions by chapter.');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Question Bank');
    expect(element.textContent).toContain('Curate questions by chapter.');
    expect(element.textContent).toContain('Back to dashboard');
  });
});
