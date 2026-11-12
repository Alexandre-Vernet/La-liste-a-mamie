import { Injectable, computed, effect, signal } from '@angular/core';
import { Filter, Grocery } from './grocery.model';

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
  readonly names = computed(() => new Set(this.items().map((i) => i.name.toLowerCase())));

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items())));
  }

  add(name: string): boolean {
    const trimmed = name.trim();

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
    const trimmed = name.trim();

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
    this.patch(id, (i) => ({ ...i, quantity: Math.min(i.quantity + 1, 99) }));
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

  restore(grocery: Grocery): void {
    if (this.hasName(grocery.name)) {
      return;
    }

    this.items.update((items) => [grocery, ...items]);
  }

  clearCompleted(): void {
    this.items.update((items) => items.filter((i) => !i.done));
  }

  contains(name: string): boolean {
    return this.hasName(name.trim());
  }

  private sortByDone(items: Grocery[]): Grocery[] {
    return [...items].sort((a, b) => Number(a.done) - Number(b.done));
  }

  private patch(id: string, change: (item: Grocery) => Grocery): void {
    this.items.update((items) => items.map((i) => (i.id === id ? change(i) : i)));
  }

  private hasName(name: string, excludeId?: string): boolean {
    const normalized = name.toLowerCase();
    return this.items().some((i) => i.id !== excludeId && i.name.toLowerCase() === normalized);
  }

  private load(): Grocery[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}
