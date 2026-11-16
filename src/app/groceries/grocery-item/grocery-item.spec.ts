import { TestBed } from '@angular/core/testing';
import { GroceryItem } from './grocery-item';
import { Grocery } from '../grocery.model';

function createGrocery(overrides: Partial<Grocery> = {}): Grocery {
  return { id: '1', name: 'shampoing', quantity: 1, done: false, ...overrides };
}

function touchEvent(type: string, clientX: number, clientY: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', { value: [{ clientX, clientY }] });
  return event;
}

describe('GroceryItem', () => {
  async function createFixture(grocery: Grocery) {
    const fixture = TestBed.createComponent(GroceryItem);
    fixture.componentRef.setInput('grocery', grocery);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('should expand the compact quantity badge on tap and collapse it again', async () => {
    const fixture = await createFixture(createGrocery({ quantity: 3 }));
    const qty: HTMLElement = fixture.nativeElement.querySelector('.qty');
    const badge: HTMLButtonElement = fixture.nativeElement.querySelector('.qty-badge');

    expect(qty.classList.contains('expanded')).toBe(false);
    expect(badge.textContent?.trim()).toBe('×3');

    badge.click();
    fixture.detectChanges();
    expect(qty.classList.contains('expanded')).toBe(true);

    const value: HTMLElement = fixture.nativeElement.querySelector('.qty-value');
    value.click();
    fixture.detectChanges();
    expect(qty.classList.contains('expanded')).toBe(false);
  });

  it('should collapse the expanded quantity when clicking elsewhere on the page', async () => {
    const fixture = await createFixture(createGrocery({ quantity: 2 }));
    const qty: HTMLElement = fixture.nativeElement.querySelector('.qty');
    const badge: HTMLButtonElement = fixture.nativeElement.querySelector('.qty-badge');

    badge.click();
    fixture.detectChanges();
    expect(qty.classList.contains('expanded')).toBe(true);

    document.body.click();
    fixture.detectChanges();
    expect(qty.classList.contains('expanded')).toBe(false);
  });

  it('should keep the quantity expanded when clicking the stepper buttons themselves', async () => {
    const fixture = await createFixture(createGrocery({ quantity: 2 }));
    const qty: HTMLElement = fixture.nativeElement.querySelector('.qty');
    const badge: HTMLButtonElement = fixture.nativeElement.querySelector('.qty-badge');

    badge.click();
    fixture.detectChanges();

    const incrementButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.step[aria-label="Augmenter la quantité"]',
    );
    incrementButton.click();
    fixture.detectChanges();

    expect(qty.classList.contains('expanded')).toBe(true);
  });

  it('should open the editor on a single click of the name', async () => {
    const fixture = await createFixture(createGrocery());

    const name: HTMLElement = fixture.nativeElement.querySelector('.name');
    name.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.editor')).toBeTruthy();
  });

  it('should save the new name when pressing Enter', async () => {
    const fixture = await createFixture(createGrocery());
    const renamed = vi.fn();
    fixture.componentInstance.renamed.subscribe(renamed);

    fixture.nativeElement.querySelector('.name').click();
    fixture.detectChanges();

    const editor: HTMLInputElement = fixture.nativeElement.querySelector('.editor');
    editor.value = 'shampooing';
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(renamed).toHaveBeenCalledWith('shampooing');
    expect(fixture.nativeElement.querySelector('.editor')).toBeNull();
  });

  it('should save the new name when clicking elsewhere while editing', async () => {
    const fixture = await createFixture(createGrocery());
    const renamed = vi.fn();
    fixture.componentInstance.renamed.subscribe(renamed);

    fixture.nativeElement.querySelector('.name').click();
    fixture.detectChanges();

    const editor: HTMLInputElement = fixture.nativeElement.querySelector('.editor');
    editor.value = 'shampooing';
    editor.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(renamed).toHaveBeenCalledWith('shampooing');
    expect(fixture.nativeElement.querySelector('.editor')).toBeNull();
  });

  it('should remove the article when swiped far enough to the left', async () => {
    const fixture = await createFixture(createGrocery());
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);

    const row: HTMLElement = fixture.nativeElement.querySelector('.row');
    row.dispatchEvent(touchEvent('touchstart', 200, 50));
    row.dispatchEvent(touchEvent('touchmove', 100, 50));
    row.dispatchEvent(new Event('touchend', { bubbles: true }));
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 220));

    expect(removed).toHaveBeenCalled();
  });

  it('should snap back without removing when the swipe does not reach the threshold', async () => {
    const fixture = await createFixture(createGrocery());
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);

    const row: HTMLElement = fixture.nativeElement.querySelector('.row');
    row.dispatchEvent(touchEvent('touchstart', 200, 50));
    row.dispatchEvent(touchEvent('touchmove', 180, 50));
    row.dispatchEvent(new Event('touchend', { bubbles: true }));
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 220));

    expect(removed).not.toHaveBeenCalled();
    expect(row.style.transform).toBe('translateX(0px)');
  });

  it('should ignore a predominantly vertical drag so page scrolling keeps working', async () => {
    const fixture = await createFixture(createGrocery());
    const row: HTMLElement = fixture.nativeElement.querySelector('.row');

    row.dispatchEvent(touchEvent('touchstart', 200, 50));
    row.dispatchEvent(touchEvent('touchmove', 190, 150));
    fixture.detectChanges();

    expect(row.style.transform).toBe('translateX(0px)');
  });

  it('should clamp the drag distance so the row never slides past the delete action width', async () => {
    const fixture = await createFixture(createGrocery());
    const row: HTMLElement = fixture.nativeElement.querySelector('.row');

    row.dispatchEvent(touchEvent('touchstart', 200, 50));
    row.dispatchEvent(touchEvent('touchmove', -1000, 50));
    fixture.detectChanges();

    expect(row.style.transform).toBe('translateX(-88px)');
  });
});
