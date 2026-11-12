import { TestBed } from '@angular/core/testing';
import { GroceryListPage } from './grocery-list-page';
import { GroceryService } from '../grocery.service';

describe('GroceryListPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [GroceryListPage] }).compileComponents();
  });

  it('should render the title', async () => {
    const fixture = TestBed.createComponent(GroceryListPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('La liste à mamie');
  });

  it('should add, toggle, filter and clear groceries', () => {
    const service = TestBed.inject(GroceryService);
    service.add('  Pain  ');
    service.add('   ');
    expect(service.total()).toBe(1);
    expect(service.visible()[0].name).toBe('Pain');
    expect(service.visible()[0].quantity).toBe(1);

    service.toggle(service.visible()[0].id);
    expect(service.remaining()).toBe(0);

    service.filter.set('active');
    expect(service.visible()).toHaveLength(0);

    service.clearCompleted();
    expect(service.total()).toBe(0);
  });

  it('should prevent duplicate grocery names', () => {
    const service = TestBed.inject(GroceryService);
    expect(service.add('Pain')).toBe(true);
    expect(service.add('  PAIN  ')).toBe(false);
    expect(service.total()).toBe(1);

    expect(service.add('Lait')).toBe(true);
    const [second, first] = service.visible();
    expect(service.rename(second.id, first.name)).toBe(false);
    expect(service.visible()[0].name).toBe('Lait');
  });

  it('should adjust quantity and drop the item when decremented below one', () => {
    const service = TestBed.inject(GroceryService);
    service.add('Pommes');
    const id = service.visible()[0].id;

    service.increment(id);
    expect(service.visible()[0].quantity).toBe(2);

    service.decrement(id);
    expect(service.visible()[0].quantity).toBe(1);

    service.decrement(id);
    expect(service.total()).toBe(0);
  });

  it('should suggest "beurre" when typing "beu" and add it on click', async () => {
    const fixture = TestBed.createComponent(GroceryListPage);
    await fixture.whenStable();

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Nouvel article"]',
    );
    input.value = 'beu';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const suggestionButtons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.suggestion'),
    );
    const beurreButton = suggestionButtons.find(
      (button) => button.textContent?.trim() === 'beurre',
    );
    expect(beurreButton).toBeTruthy();

    beurreButton!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const service = TestBed.inject(GroceryService);
    expect(service.visible().some((item) => item.name === 'beurre')).toBe(true);
  });
});
