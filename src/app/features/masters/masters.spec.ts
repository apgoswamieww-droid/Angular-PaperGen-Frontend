import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Masters } from './masters';

describe('Masters', () => {
  let fixture: ComponentFixture<Masters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Masters],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Masters);
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('lists all eight masters with links', () => {
    const cards = Array.from(
      element().querySelectorAll<HTMLAnchorElement>('[data-testid="master-card"]'),
    );

    expect(cards.length).toBe(8);
    expect(element().textContent).toContain('Mediums');
    expect(element().textContent).toContain('Standards');
    expect(element().textContent).toContain('Subjects');
    expect(element().textContent).toContain('Chapters');
    expect(element().textContent).toContain('Topics');
    expect(element().textContent).toContain('Question Types');
    expect(element().textContent).toContain('Difficulty Levels');
    expect(element().textContent).toContain('Bloom Levels');
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/masters/mediums',
      '/masters/standards',
      '/masters/subjects',
      '/masters/chapters',
      '/masters/topics',
      '/masters/question-types',
      '/masters/difficulty-levels',
      '/masters/bloom-levels',
    ]);
  });
});
