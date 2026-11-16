import { TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';
import { ThemeService } from '../theme/theme.service';

describe('ThemeToggle', () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('theme-preference', 'light');
    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
  });

  it('should switch between light and dark on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();

    const service = TestBed.inject(ThemeService);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(service.theme()).toBe('light');

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.theme()).toBe('dark');
    expect(button.getAttribute('aria-label')).toContain('Thème sombre');

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.theme()).toBe('light');
    expect(button.getAttribute('aria-label')).toContain('Thème clair');
  });

  it('should never mention an automatic theme', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-label')).not.toContain('automatique');
  });
});
