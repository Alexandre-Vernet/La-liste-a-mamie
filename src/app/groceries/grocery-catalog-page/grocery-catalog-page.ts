import { Component, computed, inject, signal } from '@angular/core';
import { Grocery } from '../grocery.model';
import { GroceryService } from '../grocery.service';
import { GROCERY_CATEGORIES, matchRank, normalize } from '../grocery-dictionary';
import { groceryIcon, productsByEmoji } from '../grocery-icons';

interface CatalogProduct {
  readonly name: string;
  readonly icon: string;
  readonly added: boolean;
  readonly actionLabel: string;
}

interface CatalogCategory {
  readonly name: string;
  readonly slug: string;
  readonly products: readonly CatalogProduct[];
}

interface PendingUndo {
  readonly message: string;
  readonly grocery: Grocery;
}

const UNDO_DURATION_MS = 5000;

@Component({
  selector: 'app-grocery-catalog-page',
  templateUrl: './grocery-catalog-page.html',
  styleUrl: './grocery-catalog-page.scss',
})
export class GroceryCatalogPage {
  protected readonly groceryService = inject(GroceryService);

  protected readonly productCount = GROCERY_CATEGORIES.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  protected readonly query = signal('');
  protected readonly pendingUndo = signal<PendingUndo | null>(null);

  private undoTimeout?: ReturnType<typeof setTimeout>;

  protected readonly categories = computed<readonly CatalogCategory[]>(() => {
    const addedNames = this.groceryService.names();
    const query = this.query();
    const normalizedQuery = normalize(query);
    const emojiMatches = new Set(productsByEmoji(query));

    const rankedCategories = GROCERY_CATEGORIES.map((category) => {
      const rankedProducts = category.products
        .filter(
          (product) => emojiMatches.has(product) || normalize(product).includes(normalizedQuery),
        )
        .map((product) => ({ product, rank: matchRank(normalize(product), normalizedQuery) }))
        .sort((a, b) => a.rank - b.rank);

      const catalogCategory: CatalogCategory = {
        name: category.name,
        slug: slugify(category.name),
        products: rankedProducts.map(({ product }) => {
          const added = addedNames.has(normalize(product));

          return {
            name: product,
            icon: groceryIcon(product),
            added,
            actionLabel: added ? `Retirer ${product} de la liste` : `Ajouter ${product} à la liste`,
          };
        }),
      };

      const bestRank = rankedProducts.length > 0 ? rankedProducts[0].rank : Infinity;

      return { catalogCategory, bestRank };
    });

    return rankedCategories
      .filter(({ catalogCategory }) => catalogCategory.products.length > 0)
      .sort((a, b) => a.bestRank - b.bestRank)
      .map(({ catalogCategory }) => catalogCategory);
  });

  protected readonly resultCount = computed(() =>
    this.categories().reduce((total, category) => total + category.products.length, 0),
  );

  protected readonly summary = computed(() => {
    const query = this.query().trim();

    if (!query) {
      return `${this.productCount} produits classés par rayon, à ajouter en un clic.`;
    }

    const count = this.resultCount();

    if (count === 0) {
      return `Aucun résultat pour « ${query} ».`;
    }

    return count > 1
      ? `${count} résultats pour « ${query} »`
      : `${count} résultat pour « ${query} »`;
  });

  protected onQueryInput(value: string): void {
    this.query.set(value);
  }

  protected clearQuery(): void {
    this.query.set('');
  }

  protected toggle(name: string): void {
    if (!this.groceryService.contains(name)) {
      this.groceryService.add(name);
      return;
    }

    const removed = this.groceryService.removeByName(name);

    if (removed) {
      this.offerUndo(removed);
    }
  }

  protected undo(): void {
    const pending = this.pendingUndo();

    if (!pending) {
      return;
    }

    clearTimeout(this.undoTimeout);
    this.groceryService.restore([pending.grocery]);
    this.pendingUndo.set(null);
  }

  private offerUndo(grocery: Grocery): void {
    clearTimeout(this.undoTimeout);
    this.pendingUndo.set({ message: `« ${grocery.name} » supprimé`, grocery });
    this.undoTimeout = setTimeout(() => this.pendingUndo.set(null), UNDO_DURATION_MS);
  }

  protected scrollToCategory(slug: string): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.getElementById(slug)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }
}

function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
