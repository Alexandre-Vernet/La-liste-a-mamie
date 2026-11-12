import { TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';
import { ThemeService } from '../theme/theme.service';

describe('ThemeToggle', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
  });

  it('should cycle the theme preference on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();

    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('system');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.preference()).toBe('light');
  });
});
