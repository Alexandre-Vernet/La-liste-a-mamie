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

  it('should move checked items to the bottom while keeping others in order', () => {
    const service = TestBed.inject(GroceryService);
    service.add('Pain');
    service.add('Lait');
    service.add('Pommes');

    const [pommes, lait] = service.visible();
    service.toggle(lait.id);

    const names = service.visible().map((item) => item.name);
    expect(names).toEqual(['Pommes', 'Pain', 'Lait']);

    service.toggle(pommes.id);
    expect(service.visible().map((item) => item.name)).toEqual(['Pain', 'Pommes', 'Lait']);
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
      (button) => button.querySelector('.suggestion-name')?.textContent?.trim() === 'beurre',
    );
    expect(beurreButton).toBeTruthy();
    expect(beurreButton!.querySelector('.suggestion-icon')?.textContent?.trim()).toBe('🧈');

    beurreButton!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const service = TestBed.inject(GroceryService);
    expect(service.visible().some((item) => item.name === 'beurre')).toBe(true);
  });

  it('should suggest "fraise" when typing the 🍓 emoji and add it on click', async () => {
    const fixture = TestBed.createComponent(GroceryListPage);
    await fixture.whenStable();

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Nouvel article"]',
    );
    input.value = '🍓';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const suggestionButtons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.suggestion'),
    );
    const fraiseButton = suggestionButtons.find(
      (button) => button.querySelector('.suggestion-name')?.textContent?.trim() === 'fraise',
    );
    expect(fraiseButton).toBeTruthy();

    fraiseButton!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const service = TestBed.inject(GroceryService);
    expect(service.visible().some((item) => item.name === 'fraise')).toBe(true);
  });

  it('should group articles to buy by rayon, in catalog order', async () => {
    const service = TestBed.inject(GroceryService);
    service.add('bière');
    service.add('carotte');
    service.add('mon article perso');

    const fixture = TestBed.createComponent(GroceryListPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const headings: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.group-title'),
    );
    const titles = headings.map((heading) => heading.textContent?.trim());
    expect(titles).toEqual(['Fruits & légumes', 'Boissons', 'Autres']);
  });

  it('should list checked articles under "Acheté", separate from the rayon groups', async () => {
    const service = TestBed.inject(GroceryService);
    service.add('carotte');
    service.add('pomme');
    service.toggle(service.visible().find((grocery) => grocery.name === 'pomme')!.id);

    const fixture = TestBed.createComponent(GroceryListPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const headings: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.group-title'),
    );
    const titles = headings.map((heading) => heading.textContent?.trim());
    expect(titles).toEqual(['Fruits & légumes', 'Acheté']);
  });

  it('should show the empty message when the current filter has nothing to show', async () => {
    const service = TestBed.inject(GroceryService);
    service.add('carotte');
    service.filter.set('done');

    const fixture = TestBed.createComponent(GroceryListPage);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty')?.textContent).toContain(
      'Aucun article ici.',
    );
  });
});
