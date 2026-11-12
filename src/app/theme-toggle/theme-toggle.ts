import { Component, computed, inject } from '@angular/core';
import { ThemePreference, ThemeService } from '../theme/theme.service';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Thème automatique (suit le système). Appuyer pour passer au thème clair.',
  light: 'Thème clair. Appuyer pour passer au thème sombre.',
  dark: 'Thème sombre. Appuyer pour revenir au thème automatique.',
};

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
  protected readonly label = computed(() => THEME_LABELS[this.themeService.preference()]);

  protected toggle(): void {
    this.themeService.cyclePreference();
  }
}
