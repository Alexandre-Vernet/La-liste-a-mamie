import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

function mockSystemPrefersDark(prefersDark: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: prefersDark, media: query }) as MediaQueryList),
  );
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start from the dark system theme when nothing is saved', () => {
    mockSystemPrefersDark(true);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('should start from the light system theme when nothing is saved', () => {
    mockSystemPrefersDark(false);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('should fall back to light when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('should toggle between light and dark only', () => {
    mockSystemPrefersDark(false);
    const service = TestBed.inject(ThemeService);

    service.toggle();
    expect(service.theme()).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
  });

  it('should restore a previously saved theme over the system theme', () => {
    mockSystemPrefersDark(false);
    localStorage.setItem('theme-preference', 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('should replace a legacy "system" preference with the system theme', () => {
    mockSystemPrefersDark(true);
    localStorage.setItem('theme-preference', 'system');

    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('should apply the theme on the html element', () => {
    mockSystemPrefersDark(false);
    const service = TestBed.inject(ThemeService);

    service.toggle();
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
