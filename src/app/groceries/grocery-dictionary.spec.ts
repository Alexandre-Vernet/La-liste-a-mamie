import { Grocery } from './grocery.model';
import { categoryOf, groupGroceriesByCategory, suggestGroceryNames } from './grocery-dictionary';

function createGrocery(overrides: Partial<Grocery> = {}): Grocery {
  return { id: '1', name: 'pain', quantity: 1, done: false, ...overrides };
}

describe('suggestGroceryNames', () => {
  it('should suggest "beurre" when typing "beu"', () => {
    expect(suggestGroceryNames('beu')).toContain('beurre');
  });

  it('should ignore case and accents', () => {
    expect(suggestGroceryNames('PECH')).toContain('pêche');
  });

  it('should return no suggestion for an empty query', () => {
    expect(suggestGroceryNames('')).toEqual([]);
    expect(suggestGroceryNames('   ')).toEqual([]);
  });

  it('should cap the number of suggestions', () => {
    expect(suggestGroceryNames('p', 3)).toHaveLength(3);
  });

  it('should ignore apostrophes so "pompote" finds "Pom\'Potes"', () => {
    expect(suggestGroceryNames('pompote')).toContain("Pom'Potes");
  });

  it('should rank an exact match above products that merely contain the query', () => {
    const results = suggestGroceryNames('eau', 20);

    expect(results[0]).toBe('eau');
    expect(results).toContain('beaufort');
    expect(results.indexOf('eau')).toBeLessThan(results.indexOf('beaufort'));
  });

  it('should rank a product that starts with the query above one that only contains it', () => {
    const results = suggestGroceryNames('pois', 20);

    expect(results).toContain('pois chiches');
    expect(results).toContain('petit pois');
    expect(results.indexOf('pois chiches')).toBeLessThan(results.indexOf('petit pois'));
  });
});

describe('categoryOf', () => {
  it('should find the category of a known product, ignoring case and accents', () => {
    expect(categoryOf('Carotte')).toBe('Fruits & légumes');
    expect(categoryOf('BEURRE')).toBe('Crémerie & œufs');
  });

  it('should return null for a product absent from the catalog', () => {
    expect(categoryOf('mon article perso')).toBeNull();
  });
});

describe('groupGroceriesByCategory', () => {
  it('should group groceries by their catalog category', () => {
    const groups = groupGroceriesByCategory([
      createGrocery({ id: '1', name: 'carotte' }),
      createGrocery({ id: '2', name: 'beurre' }),
      createGrocery({ id: '3', name: 'pomme' }),
    ]);

    const names = groups.map((group) => group.category);
    expect(names).toEqual(['Fruits & légumes', 'Crémerie & œufs']);

    const fruitsGroup = groups.find((group) => group.category === 'Fruits & légumes');
    expect(fruitsGroup?.groceries.map((grocery) => grocery.name)).toEqual(['carotte', 'pomme']);
  });

  it('should put a product absent from the catalog in "Autres", last', () => {
    const groups = groupGroceriesByCategory([
      createGrocery({ id: '1', name: 'mon article perso' }),
      createGrocery({ id: '2', name: 'carotte' }),
    ]);

    expect(groups.map((group) => group.category)).toEqual(['Fruits & légumes', 'Autres']);
  });

  it('should order categories following the catalog order, not the input order', () => {
    const groups = groupGroceriesByCategory([
      createGrocery({ id: '1', name: 'bière' }),
      createGrocery({ id: '2', name: 'carotte' }),
    ]);

    expect(groups.map((group) => group.category)).toEqual(['Fruits & légumes', 'Boissons']);
  });

  it('should return an empty array for an empty list', () => {
    expect(groupGroceriesByCategory([])).toEqual([]);
  });
});
