import { Component, computed, inject, signal } from '@angular/core';
import { GroceryService } from '../grocery.service';
import { GROCERY_CATEGORIES, normalize } from '../grocery-dictionary';
import { groceryIcon, productsByEmoji } from '../grocery-icons';

interface CatalogProduct {
  readonly name: string;
  readonly icon: string;
  readonly added: boolean;
}

interface CatalogCategory {
  readonly name: string;
  readonly slug: string;
  readonly products: readonly CatalogProduct[];
}

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

  protected readonly categories = computed<readonly CatalogCategory[]>(() => {
    const addedNames = this.groceryService.names();
    const query = this.query();
    const normalizedQuery = normalize(query);
    const emojiMatches = new Set(productsByEmoji(query));

    return GROCERY_CATEGORIES.map((category) => {
      const slug = slugify(category.name);

      return {
        name: category.name,
        slug,
        products: category.products
          .filter(
            (product) => emojiMatches.has(product) || normalize(product).includes(normalizedQuery),
          )
          .map((product) => ({
            name: product,
            icon: groceryIcon(product),
            added: addedNames.has(normalize(product)),
          })),
      };
    }).filter((category) => category.products.length > 0);
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

  protected add(name: string): void {
    this.groceryService.add(name);
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
