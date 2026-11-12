import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { Grocery } from '../grocery.model';

@Component({
  selector: 'app-grocery-item',
  templateUrl: './grocery-item.html',
  styleUrl: './grocery-item.scss',
  host: { '[class.done]': 'grocery().done', '[class.leaving]': 'leaving()' },
})
export class GroceryItem {
  readonly grocery = input.required<Grocery>();

  readonly toggled = output<void>();
  readonly renamed = output<string>();
  readonly incremented = output<void>();
  readonly decremented = output<void>();
  readonly removed = output<void>();

  protected readonly editing = signal(false);
  protected readonly leaving = signal(false);
  private readonly editor = viewChild<ElementRef<HTMLInputElement>>('editor');

  protected startEditing(): void {
    this.editing.set(true);
    setTimeout(() => this.editor()?.nativeElement.select());
  }

  protected save(value: string): void {
    if (!this.editing()) {
      return;
    }

    this.editing.set(false);

    if (value !== this.grocery().name) {
      this.renamed.emit(value);
    }
  }

  protected requestRemove(): void {
    this.leaving.set(true);
    setTimeout(() => this.removed.emit(), 180);
  }
}
