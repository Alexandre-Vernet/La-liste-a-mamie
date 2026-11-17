import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

// Must stay in sync with the key used in the anti-flash script in index.html.
const STORAGE_KEY = 'theme-preference';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const THEME_COLORS: Record<Theme, string> = {
  light: '#f6f3ee',
  dark: '#141311',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.load());

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.theme();
      this.updateThemeColorMeta(this.theme());
    });

    effect(() => {
      localStorage.setItem(STORAGE_KEY, this.theme());
    });
  }

  toggle(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  private updateThemeColorMeta(theme: Theme): void {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
  }

  // With no stored choice (first launch, or an old "system" value), start from the
  // system theme; after that, only the user's explicit choice matters.
  private load(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return this.detectSystemPrefersDark() ? 'dark' : 'light';
  }

  private detectSystemPrefersDark(): boolean {
    if (typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(DARK_MEDIA_QUERY).matches;
  }
}
