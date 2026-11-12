import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly exact: boolean;
}

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
})
export class BottomNav {
  protected readonly links: readonly NavLink[] = [
    { path: '/', label: 'Ma liste', exact: true },
    { path: '/produits', label: 'Produits', exact: false },
  ];

  protected readonly activeIndex = signal(0);
  protected readonly indicatorTransform = computed(
    () => `translateX(${this.activeIndex() * 100}%)`,
  );

  protected onActiveChange(index: number, active: boolean): void {
    if (active) {
      this.activeIndex.set(index);
    }
  }
}
