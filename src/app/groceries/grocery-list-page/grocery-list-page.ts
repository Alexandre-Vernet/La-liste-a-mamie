import { Component, computed, effect, inject, signal } from '@angular/core';
import { Filter, Grocery } from '../grocery.model';
import { GroceryService } from '../grocery.service';
import { GroceryItem } from '../grocery-item/grocery-item';
import { GroceryGroup, groupGroceriesByCategory, suggestGroceryNames } from '../grocery-dictionary';
import { groceryIcon, productsByEmoji } from '../grocery-icons';

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

const CONFETTI_COLORS = ['#a0673f', '#d39a6a', '#b4483c', '#8f877c', '#1f1d1a'];
const CONFETTI_PIECE_COUNT = 28;
const CONFETTI_DURATION_MS = 1500;
const UNDO_DURATION_MS = 5000;

@Component({
  selector: 'app-grocery-list-page',
  imports: [GroceryItem],
  templateUrl: './grocery-list-page.html',
  styleUrl: './grocery-list-page.scss',
})
export class GroceryListPage {
  protected readonly groceryService = inject(GroceryService);

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
  protected readonly removedGrocery = signal<Grocery | null>(null);

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

  protected selectSuggestion(name: string, input: HTMLInputElement): void {
    input.value = name;
    this.add(input);
  }

  protected removeGrocery(grocery: Grocery): void {
    this.groceryService.remove(grocery.id);

    clearTimeout(this.undoTimeout);
    this.removedGrocery.set(grocery);
    this.undoTimeout = setTimeout(() => this.removedGrocery.set(null), UNDO_DURATION_MS);
  }

  protected undoRemove(): void {
    const grocery = this.removedGrocery();

    if (!grocery) {
      return;
    }

    clearTimeout(this.undoTimeout);
    this.groceryService.restore(grocery);
    this.removedGrocery.set(null);
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
