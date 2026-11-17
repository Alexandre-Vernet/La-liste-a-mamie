import { TestBed } from '@angular/core/testing';
import { GroceryService } from './grocery.service';
import { MAX_NAME_LENGTH } from './grocery-storage';

describe('GroceryService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should truncate an overly long name when adding or renaming', () => {
    const service = TestBed.inject(GroceryService);
    const tooLong = 'A'.repeat(MAX_NAME_LENGTH + 50);

    service.add(tooLong);
    expect(service.visible()[0].name).toBe('A'.repeat(MAX_NAME_LENGTH));

    const id = service.visible()[0].id;
    service.rename(id, 'B'.repeat(MAX_NAME_LENGTH + 50));
    expect(service.visible()[0].name).toBe('B'.repeat(MAX_NAME_LENGTH));
  });

  it('should restore removed groceries on undo', () => {
    const service = TestBed.inject(GroceryService);
    service.add('Pain');
    const removed = service.visible()[0];
    service.remove(removed.id);
    expect(service.total()).toBe(0);

    service.restore([removed]);
    expect(service.visible().map((g) => g.name)).toEqual(['Pain']);
  });

  it('should not duplicate a grocery re-added under the same name before the undo', () => {
    const service = TestBed.inject(GroceryService);
    service.add('Pain');
    const removed = service.visible()[0];
    service.remove(removed.id);

    service.add('Pain');
    service.restore([removed]);

    expect(service.visible().map((g) => g.name)).toEqual(['Pain']);
  });
});
