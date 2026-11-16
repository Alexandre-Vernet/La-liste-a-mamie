import { Injectable, effect, inject } from '@angular/core';
import { GroceryService } from '../groceries/grocery.service';

@Injectable({ providedIn: 'root' })
export class AppBadgeService {
  private readonly groceryService = inject(GroceryService);

  constructor() {
    effect(() => this.updateBadge(this.groceryService.remaining()));
  }

  private updateBadge(remaining: number): void {
    if (typeof navigator.setAppBadge !== 'function') {
      return;
    }

    if (remaining === 0) {
      void navigator.clearAppBadge();
      return;
    }

    void navigator.setAppBadge(remaining);
  }
}
