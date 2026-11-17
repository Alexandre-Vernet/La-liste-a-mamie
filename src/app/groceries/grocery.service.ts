import { Injectable, computed, effect, signal } from '@angular/core';
import { Filter, Grocery } from './grocery.model';
import { normalize } from './grocery-dictionary';
import { MAX_NAME_LENGTH, MAX_QUANTITY, parseStoredGroceries } from './grocery-storage';

const STORAGE_KEY = 'groceries';

@Injectable({ providedIn: 'root' })
export class GroceryService {
  private readonly items = signal<Grocery[]>(this.load());

  readonly filter = signal<Filter>('all');

  readonly visible = computed(() => {
    const items = this.items();

    switch (this.filter()) {
      case 'active':
        return items.filter((i) => !i.done);
      case 'done':
        return items.filter((i) => i.done);
      default:
        return this.sortByDone(items);
    }
  });

  readonly total = computed(() => this.items().length);
  readonly remaining = computed(() => this.items().filter((i) => !i.done).length);
  readonly completed = computed(() => this.total() - this.remaining());
  readonly progress = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.completed() / this.total()) * 100),
  );
  readonly names = computed(() => new Set(this.items().map((i) => normalize(i.name))));

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    });
  }

  add(name: string): boolean {
    const trimmed = this.clampName(name);

    if (!trimmed || this.hasName(trimmed)) {
      return false;
    }

    this.items.update((items) => [
      { id: crypto.randomUUID(), name: trimmed, quantity: 1, done: false },
      ...items,
    ]);
    return true;
  }

  toggle(id: string): void {
    this.patch(id, (i) => ({ ...i, done: !i.done }));
  }

  rename(id: string, name: string): boolean {
    const trimmed = this.clampName(name);

    if (!trimmed) {
      this.remove(id);
      return true;
    }

    if (this.hasName(trimmed, id)) {
      return false;
    }

    this.patch(id, (i) => ({ ...i, name: trimmed }));
    return true;
  }

  increment(id: string): void {
    this.patch(id, (i) => ({ ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) }));
  }

  decrement(id: string): void {
    const item = this.items().find((i) => i.id === id);

    if (item && item.quantity <= 1) {
      this.remove(id);
      return;
    }

    this.patch(id, (i) => ({ ...i, quantity: i.quantity - 1 }));
  }

  remove(id: string): void {
    this.items.update((items) => items.filter((i) => i.id !== id));
  }

  /** Removes an item by its name (e.g. re-clicking an already added product) and returns it. */
  removeByName(name: string): Grocery | null {
    const normalized = normalize(name);
    const item = this.items().find((i) => normalize(i.name) === normalized);

    if (!item) {
      return null;
    }

    this.remove(item.id);
    return item;
  }

  /**
   * Restores removed items (undo). An item that was re-added under the
   * same name in the meantime is not duplicated.
   */
  restore(groceries: readonly Grocery[]): void {
    const restorable = groceries.filter((grocery) => !this.hasName(grocery.name));

    if (restorable.length === 0) {
      return;
    }

    this.items.update((items) => [...restorable, ...items]);
  }

  /** Removes the purchased items and returns them, so the action can be undone. */
  clearCompleted(): Grocery[] {
    const cleared = this.items().filter((i) => i.done);

    this.items.update((items) => items.filter((i) => !i.done));

    return cleared;
  }

  contains(name: string): boolean {
    return this.hasName(name.trim());
  }

  private clampName(name: string): string {
    return name.trim().slice(0, MAX_NAME_LENGTH);
  }

  private sortByDone(items: Grocery[]): Grocery[] {
    return [...items].sort((a, b) => Number(a.done) - Number(b.done));
  }

  private patch(id: string, change: (item: Grocery) => Grocery): void {
    this.items.update((items) => items.map((i) => (i.id === id ? change(i) : i)));
  }

  private hasName(name: string, excludeId?: string): boolean {
    const normalized = normalize(name);
    return this.items().some((i) => i.id !== excludeId && normalize(i.name) === normalized);
  }

  private load(): Grocery[] {
    return parseStoredGroceries(localStorage.getItem(STORAGE_KEY));
  }
}
