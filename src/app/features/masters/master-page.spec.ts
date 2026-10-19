import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MasterPage } from './master-page';

describe('MasterPage', () => {
  let fixture: ComponentFixture<MasterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterPage);
    fixture.componentRef.setInput('title', 'Mediums');
    fixture.componentRef.setInput('description', 'Languages of instruction.');
    fixture.componentRef.setInput('icon', 'globe');
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the master title, description and empty state', () => {
    expect(element().textContent).toContain('Mediums');
    expect(element().textContent).toContain('Languages of instruction.');
    expect(element().textContent).toContain('Module coming soon');
  });

  it('links back to the masters index', () => {
    const link = element().querySelector<HTMLAnchorElement>('[data-testid="back-to-masters"]');

    expect(link?.getAttribute('href')).toBe('/masters');
  });
});
