import { MAX_NAME_LENGTH, MAX_QUANTITY, parseStoredGroceries } from './grocery-storage';

describe('parseStoredGroceries', () => {
  it('should return valid groceries unchanged', () => {
    const groceries = [
      { id: 'a', name: 'Pain', quantity: 2, done: false },
      { id: 'b', name: 'Lait', quantity: 1, done: true },
    ];

    expect(parseStoredGroceries(JSON.stringify(groceries))).toEqual(groceries);
  });

  it('should return an empty list when nothing is stored', () => {
    expect(parseStoredGroceries(null)).toEqual([]);
  });

  it('should return an empty list for invalid JSON', () => {
    expect(parseStoredGroceries('{not json')).toEqual([]);
  });

  it('should return an empty list when the stored value is not an array', () => {
    expect(parseStoredGroceries('{"name":"Pain"}')).toEqual([]);
    expect(parseStoredGroceries('42')).toEqual([]);
    expect(parseStoredGroceries('null')).toEqual([]);
  });

  it('should drop entries without a usable name', () => {
    const stored = JSON.stringify([
      null,
      'Pain',
      { id: 'a' },
      { id: 'b', name: '   ' },
      { id: 'c', name: 12 },
      { id: 'd', name: 'Lait', quantity: 1, done: false },
    ]);

    expect(parseStoredGroceries(stored).map((grocery) => grocery.name)).toEqual(['Lait']);
  });

  it('should repair entries saved by an older version (missing fields)', () => {
    const [grocery] = parseStoredGroceries(JSON.stringify([{ name: ' Pain ' }]));

    expect(grocery.name).toBe('Pain');
    expect(grocery.quantity).toBe(1);
    expect(grocery.done).toBe(false);
    expect(grocery.id).toEqual(expect.any(String));
    expect(grocery.id.length).toBeGreaterThan(0);
  });

  it('should clamp and round out-of-range quantities', () => {
    const stored = JSON.stringify([
      { id: 'a', name: 'A', quantity: 0, done: false },
      { id: 'b', name: 'B', quantity: -3, done: false },
      { id: 'c', name: 'C', quantity: 500, done: false },
      { id: 'd', name: 'D', quantity: 2.6, done: false },
      { id: 'e', name: 'E', quantity: '3', done: false },
    ]);

    expect(parseStoredGroceries(stored).map((grocery) => grocery.quantity)).toEqual([
      1,
      1,
      MAX_QUANTITY,
      3,
      1,
    ]);
  });

  it('should truncate an overly long name', () => {
    const stored = JSON.stringify([{ id: 'a', name: 'A'.repeat(MAX_NAME_LENGTH + 50) }]);

    const [grocery] = parseStoredGroceries(stored);

    expect(grocery.name).toBe('A'.repeat(MAX_NAME_LENGTH));
  });

  it('should only treat a strict true as done', () => {
    const stored = JSON.stringify([
      { id: 'a', name: 'A', quantity: 1, done: 'true' },
      { id: 'b', name: 'B', quantity: 1, done: 1 },
      { id: 'c', name: 'C', quantity: 1, done: true },
    ]);

    expect(parseStoredGroceries(stored).map((grocery) => grocery.done)).toEqual([
      false,
      false,
      true,
    ]);
  });
});
