import { suggestGroceryNames } from './grocery-dictionary';

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
