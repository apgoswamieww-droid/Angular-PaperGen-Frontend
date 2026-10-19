import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { HealthResponse } from '../../core/api/health.types';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function createDashboard(): ComponentFixture<Dashboard> {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return fixture;
  }

  function element(fixture: ComponentFixture<Dashboard>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function statusOf(fixture: ComponentFixture<Dashboard>): string {
    return (element(fixture).querySelector('[data-testid="api-status"]')?.textContent ?? '').trim();
  }

  function flushHealth(fixture: ComponentFixture<Dashboard>, body: HealthResponse): void {
    http.expectOne('/api/health').flush(body);
    fixture.detectChanges();
  }

  const UP: HealthResponse = { status: 'ok', database: 'up', uptime: 42 };
  const DOWN: HealthResponse = { status: 'degraded', database: 'down', uptime: 42 };

  it('creates the dashboard', () => {
    const fixture = createDashboard();

    expect(fixture.componentInstance).toBeTruthy();

    flushHealth(fixture, UP);
  });

  it('renders the page title and recent papers', () => {
    const fixture = createDashboard();

    expect(element(fixture).querySelector('h1')?.textContent).toContain('Dashboard');
    expect(element(fixture).textContent).toContain('Mid-term · Physics');

    flushHealth(fixture, UP);
  });

  it('starts in the checking state', () => {
    const fixture = createDashboard();

    expect(statusOf(fixture)).toBe('checking');

    flushHealth(fixture, UP);
  });

  it('reports ok when the backend database is up', () => {
    const fixture = createDashboard();

    flushHealth(fixture, UP);

    expect(statusOf(fixture)).toBe('ok');
    expect(element(fixture).textContent).toContain('42 s');
  });

  it('reports degraded when the backend database is down', () => {
    const fixture = createDashboard();

    flushHealth(fixture, DOWN);

    expect(statusOf(fixture)).toBe('degraded');
  });

  it('reports unreachable and surfaces the error message when the request fails', () => {
    const fixture = createDashboard();

    http
      .expectOne('/api/health')
      .flush('boom', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(statusOf(fixture)).toBe('unreachable');
    expect(element(fixture).querySelector('[data-testid="api-error"]')).toBeTruthy();
  });

  it('re-runs the check when the re-check button is clicked', () => {
    const fixture = createDashboard();
    flushHealth(fixture, UP);

    element(fixture).querySelector<HTMLButtonElement>('[data-testid="recheck"]')?.click();
    fixture.detectChanges();

    expect(statusOf(fixture)).toBe('checking');

    flushHealth(fixture, DOWN);

    expect(statusOf(fixture)).toBe('degraded');
  });
});
