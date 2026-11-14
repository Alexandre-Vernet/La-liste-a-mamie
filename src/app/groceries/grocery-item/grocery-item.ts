import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Grocery } from '../grocery.model';
import { groceryIcon } from '../grocery-icons';

const SWIPE_MAX_OFFSET_PX = -88;
const SWIPE_DELETE_THRESHOLD_PX = -64;

interface DragOrigin {
  readonly x: number;
  readonly y: number;
}

@Component({
  selector: 'app-grocery-item',
  templateUrl: './grocery-item.html',
  styleUrl: './grocery-item.scss',
  host: {
    '[class.done]': 'grocery().done',
    '[class.leaving]': 'leaving()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class GroceryItem {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly grocery = input.required<Grocery>();

  readonly toggled = output<void>();
  readonly renamed = output<string>();
  readonly incremented = output<void>();
  readonly decremented = output<void>();
  readonly removed = output<void>();

  protected readonly icon = computed(() => groceryIcon(this.grocery().name));
  protected readonly quantityBadgeLabel = computed(
    () => `Quantité : ${this.grocery().quantity}. Appuyer pour modifier.`,
  );
  protected readonly swipeDeleteLabel = computed(() => `Supprimer ${this.grocery().name}`);

  protected readonly editing = signal(false);
  protected readonly leaving = signal(false);
  protected readonly quantityExpanded = signal(false);

  protected readonly swipeOffset = signal(0);
  protected readonly rowTransform = computed(() => `translateX(${this.swipeOffset()}px)`);

  private readonly editor = viewChild<ElementRef<HTMLInputElement>>('editor');
  private dragOrigin: DragOrigin | null = null;

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

  protected toggleQuantity(): void {
    this.quantityExpanded.update((expanded) => !expanded);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.quantityExpanded()) {
      return;
    }

    if (this.elementRef.nativeElement.contains(event.target as Node)) {
      return;
    }

    this.quantityExpanded.set(false);
  }

  protected requestRemove(): void {
    this.leaving.set(true);
    setTimeout(() => this.removed.emit(), 180);
  }

  protected onSwipeStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.dragOrigin = { x: touch.clientX, y: touch.clientY };
  }

  protected onSwipeMove(event: TouchEvent): void {
    if (!this.dragOrigin) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.dragOrigin.x;
    const deltaY = touch.clientY - this.dragOrigin.y;

    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    event.preventDefault();
    this.swipeOffset.set(Math.max(SWIPE_MAX_OFFSET_PX, Math.min(0, deltaX)));
  }

  protected onSwipeEnd(): void {
    if (!this.dragOrigin) {
      return;
    }

    this.dragOrigin = null;

    if (this.swipeOffset() <= SWIPE_DELETE_THRESHOLD_PX) {
      this.requestRemove();
      return;
    }

    this.swipeOffset.set(0);
  }
}
