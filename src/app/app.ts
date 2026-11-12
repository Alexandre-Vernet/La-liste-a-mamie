import { Component, computed, effect, inject, signal } from '@angular/core';
import { Filter } from './groceries/grocery.model';
import { GroceryService } from './groceries/grocery.service';
import { GroceryItem } from './groceries/grocery-item/grocery-item';
import { suggestGroceryNames } from './groceries/grocery-dictionary';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  rotate: string;
  color: string;
}

const CONFETTI_COLORS = ['#a0673f', '#d39a6a', '#b4483c', '#8f877c', '#1f1d1a'];
const CONFETTI_PIECE_COUNT = 28;
const CONFETTI_DURATION_MS = 1500;

@Component({
  selector: 'app-root',
  imports: [GroceryItem],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
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

  protected readonly suggestions = computed(() => {
    const candidates = suggestGroceryNames(this.query());
    return candidates.filter((name) => !this.groceryService.contains(name));
  });

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
