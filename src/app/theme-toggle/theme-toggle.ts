import { Component, computed, inject } from '@angular/core';
import { Theme, ThemeService } from '../theme/theme.service';

const THEME_LABELS: Record<Theme, string> = {
  light: 'Thème clair. Appuyer pour passer au thème sombre.',
  dark: 'Thème sombre. Appuyer pour passer au thème clair.',
};

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  protected readonly theme = this.themeService.theme.asReadonly();
  protected readonly label = computed(() => THEME_LABELS[this.theme()]);

  protected toggle(): void {
    this.themeService.toggle();
  }
}
