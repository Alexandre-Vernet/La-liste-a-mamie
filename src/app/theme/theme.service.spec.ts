import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to the system preference', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('system');
  });

  it('should cycle through system, light and dark', () => {
    const service = TestBed.inject(ThemeService);

    service.cyclePreference();
    expect(service.preference()).toBe('light');
    expect(service.resolved()).toBe('light');

    service.cyclePreference();
    expect(service.preference()).toBe('dark');
    expect(service.resolved()).toBe('dark');

    service.cyclePreference();
    expect(service.preference()).toBe('system');
  });

  it('should restore a previously saved preference', () => {
    localStorage.setItem('theme-preference', 'dark');

    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('dark');
  });
});
