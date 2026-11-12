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
});
