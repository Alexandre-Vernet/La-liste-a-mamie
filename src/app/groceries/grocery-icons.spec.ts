import { groceryIcon, productsByEmoji } from './grocery-icons';

describe('groceryIcon', () => {
  it('should return the specific icon of a known product', () => {
    expect(groceryIcon('carotte')).toBe('🥕');
  });

  it('should ignore case and accents', () => {
    expect(groceryIcon('CAROTTE')).toBe('🥕');
    expect(groceryIcon('Pêche')).toBe('🍑');
  });

  it('should fall back to the category icon for a catalog product without a specific icon', () => {
    expect(groceryIcon('salsifis')).toBe('🥬');
  });

  it('should fall back to the cart emoji for a custom product outside the catalog', () => {
    expect(groceryIcon('mon article perso')).toBe('🛒');
  });
});

describe('productsByEmoji', () => {
  it('should find "fraise" when searching 🍓', () => {
    expect(productsByEmoji('🍓')).toContain('fraise');
  });

  it('should trim surrounding whitespace', () => {
    expect(productsByEmoji('  🥕  ')).toContain('carotte');
  });

  it('should return every product sharing the same specific icon', () => {
    expect(productsByEmoji('🍑')).toEqual(
      expect.arrayContaining(['abricot', 'pêche', 'nectarine']),
    );
  });

  it('should return no product for an emoji used only as a category fallback or default icon', () => {
    expect(productsByEmoji('🛒')).toEqual([]);
  });

  it('should return no product for plain text', () => {
    expect(productsByEmoji('carotte')).toEqual([]);
  });
});
