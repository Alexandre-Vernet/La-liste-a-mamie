import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

// Doit rester synchronisée avec la clé utilisée dans le script anti-flash de index.html.
const STORAGE_KEY = 'theme-preference';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const PREFERENCE_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f6f3ee',
  dark: '#141311',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly systemPrefersDark = signal(this.detectSystemPrefersDark());

  readonly preference = signal<ThemePreference>(this.load());

  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    return preference === 'system' ? (this.systemPrefersDark() ? 'dark' : 'light') : preference;
  });

  constructor() {
    this.watchSystemPreference();

    effect(() => {
      document.documentElement.dataset['theme'] = this.resolved();
      this.updateThemeColorMeta(this.resolved());
    });

    effect(() => {
      localStorage.setItem(STORAGE_KEY, this.preference());
    });
  }

  cyclePreference(): void {
    const currentIndex = PREFERENCE_ORDER.indexOf(this.preference());
    this.preference.set(PREFERENCE_ORDER[(currentIndex + 1) % PREFERENCE_ORDER.length]);
  }

  private detectSystemPrefersDark(): boolean {
    if (typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(DARK_MEDIA_QUERY).matches;
  }

  private watchSystemPreference(): void {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    window
      .matchMedia(DARK_MEDIA_QUERY)
      .addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
  }

  private updateThemeColorMeta(theme: ResolvedTheme): void {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
  }

  private load(): ThemePreference {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }

    return 'system';
  }
}
