import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { Filter, Grocery } from '../grocery.model';
import { GroceryService } from '../grocery.service';
import { GroceryItem } from '../grocery-item/grocery-item';
import { GroceryGroup, groupGroceriesByCategory, suggestGroceryNames } from '../grocery-dictionary';
import { groceryIcon, productsByEmoji } from '../grocery-icons';
import { MAX_NAME_LENGTH } from '../grocery-storage';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  rotate: string;
  color: string;
}

interface Suggestion {
  readonly name: string;
  readonly icon: string;
}

interface PendingUndo {
  readonly message: string;
  readonly groceries: readonly Grocery[];
}

const CONFETTI_COLORS = ['#a0673f', '#d39a6a', '#b4483c', '#8f877c', '#1f1d1a'];
const CONFETTI_PIECE_COUNT = 28;
const CONFETTI_DURATION_MS = 1500;
const UNDO_DURATION_MS = 5000;

// Fraction du viewport visuel (donc déjà réduit par le clavier virtuel, contrairement à la
// fenêtre) que le panneau de suggestions peut occuper, pour ne jamais déborder sous le clavier.
const SUGGESTIONS_VIEWPORT_RATIO = 0.5;

@Component({
  selector: 'app-grocery-list-page',
  imports: [GroceryItem],
  templateUrl: './grocery-list-page.html',
  styleUrl: './grocery-list-page.scss',
})
export class GroceryListPage {
  protected readonly groceryService = inject(GroceryService);
  protected readonly maxNameLength = MAX_NAME_LENGTH;

  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'active', label: 'À acheter' },
    { value: 'done', label: 'Acheté' },
  ];

  protected readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  protected readonly duplicate = signal(false);
  protected readonly confetti = signal<ConfettiPiece[]>([]);
  protected readonly query = signal('');
  protected readonly pendingUndo = signal<PendingUndo | null>(null);
  private readonly viewportHeight = signal(this.readViewportHeight());

  protected readonly suggestionsAvailableHeight = computed(
    () => `${Math.round(this.viewportHeight() * SUGGESTIONS_VIEWPORT_RATIO)}px`,
  );

  protected readonly suggestions = computed<readonly Suggestion[]>(() => {
    const query = this.query();
    const emojiMatches = productsByEmoji(query);
    const candidates = emojiMatches.length > 0 ? emojiMatches : suggestGroceryNames(query);

    return candidates
      .filter((name) => !this.groceryService.contains(name))
      .map((name) => ({ name, icon: groceryIcon(name) }));
  });

  protected readonly activeGroups = computed<readonly GroceryGroup[]>(() =>
    groupGroceriesByCategory(this.groceryService.visible().filter((grocery) => !grocery.done)),
  );

  protected readonly completedGroceries = computed<readonly Grocery[]>(() =>
    this.groceryService.visible().filter((grocery) => grocery.done),
  );

  protected readonly summary = computed(() => {
    const total = this.groceryService.total();
    const remaining = this.groceryService.remaining();

    if (total === 0) {
      return "Le panier est vide pour l'instant.";
    }

    if (remaining === 0) {
      return 'Tout est dans le panier. Bon appétit !';
    }

    return remaining > 1 ? `${remaining} articles restants` : `${remaining} article restant`;
  });

  private wasComplete = false;
  private undoTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const complete = this.groceryService.total() > 0 && this.groceryService.remaining() === 0;

      if (complete && !this.wasComplete) {
        this.burstConfetti();
      }

      this.wasComplete = complete;
    });

    this.watchViewportHeight();
  }

  protected add(input: HTMLInputElement): void {
    const added = this.groceryService.add(input.value);
    this.duplicate.set(!added && input.value.trim().length > 0);

    if (added) {
      input.value = '';
      this.query.set('');
      input.focus();
    }
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
    this.duplicate.set(false);
  }

  protected onSearchFocus(input: HTMLInputElement): void {
    if (typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: none)').matches) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    input.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  protected selectSuggestion(name: string, input: HTMLInputElement): void {
    input.value = name;
    this.add(input);
  }

  protected removeGrocery(grocery: Grocery): void {
    this.groceryService.remove(grocery.id);

    this.offerUndo({ message: `« ${grocery.name} » supprimé`, groceries: [grocery] });
  }

  protected clearCompleted(): void {
    const cleared = this.groceryService.clearCompleted();

    if (cleared.length === 0) {
      return;
    }

    this.offerUndo({ message: this.clearedMessage(cleared.length), groceries: cleared });
  }

  protected undo(): void {
    const pending = this.pendingUndo();

    if (!pending) {
      return;
    }

    clearTimeout(this.undoTimeout);
    this.groceryService.restore(pending.groceries);
    this.pendingUndo.set(null);
  }

  private offerUndo(pending: PendingUndo): void {
    clearTimeout(this.undoTimeout);
    this.pendingUndo.set(pending);
    this.undoTimeout = setTimeout(() => this.pendingUndo.set(null), UNDO_DURATION_MS);
  }

  private clearedMessage(count: number): string {
    return count > 1 ? `${count} articles achetés retirés` : '1 article acheté retiré';
  }

  private readViewportHeight(): number {
    return window.visualViewport?.height ?? window.innerHeight;
  }

  private watchViewportHeight(): void {
    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      return;
    }

    const updateViewportHeight = (): void => this.viewportHeight.set(visualViewport.height);
    visualViewport.addEventListener('resize', updateViewportHeight);

    inject(DestroyRef).onDestroy(() =>
      visualViewport.removeEventListener('resize', updateViewportHeight),
    );
  }

  private burstConfetti(): void {
    this.confetti.set(
      Array.from({ length: CONFETTI_PIECE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        rotate: `rotate(${Math.random() * 360}deg)`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    );
    setTimeout(() => this.confetti.set([]), CONFETTI_DURATION_MS);
  }
}
