import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { AppBadgeService } from './app-badge.service';
import { GroceryService } from '../groceries/grocery.service';

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AppBadgeService', () => {
  let setAppBadge: Mock<(contents?: number) => Promise<void>>;
  let clearAppBadge: Mock<() => Promise<void>>;

  beforeEach(() => {
    localStorage.clear();
    setAppBadge = vi.fn().mockResolvedValue(undefined);
    clearAppBadge = vi.fn().mockResolvedValue(undefined);
    navigator.setAppBadge = setAppBadge;
    navigator.clearAppBadge = clearAppBadge;
  });

  it('should set the badge to the number of remaining groceries', async () => {
    const groceryService = TestBed.inject(GroceryService);
    TestBed.inject(AppBadgeService);

    groceryService.add('pain');
    await flush();

    expect(setAppBadge).toHaveBeenCalledWith(1);
  });

  it('should update the badge as groceries are checked off', async () => {
    const groceryService = TestBed.inject(GroceryService);
    TestBed.inject(AppBadgeService);

    groceryService.add('pain');
    groceryService.add('lait');
    await flush();
    setAppBadge.mockClear();

    groceryService.toggle(groceryService.visible()[0].id);
    await flush();

    expect(setAppBadge).toHaveBeenCalledWith(1);
  });

  it('should clear the badge once every grocery is bought', async () => {
    const groceryService = TestBed.inject(GroceryService);
    TestBed.inject(AppBadgeService);

    groceryService.add('pain');
    await flush();

    groceryService.toggle(groceryService.visible()[0].id);
    await flush();

    expect(clearAppBadge).toHaveBeenCalled();
  });

  it('should do nothing when the Badging API is not supported', async () => {
    // @ts-expect-error simulating a browser without the Badging API
    navigator.setAppBadge = undefined;

    const groceryService = TestBed.inject(GroceryService);
    TestBed.inject(AppBadgeService);

    groceryService.add('pain');
    await flush();

    expect(clearAppBadge).not.toHaveBeenCalled();
  });
});
