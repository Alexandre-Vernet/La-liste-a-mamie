import { TestBed } from '@angular/core/testing';
import { GroceryCatalogPage } from './grocery-catalog-page';
import { GroceryService } from '../grocery.service';

describe('GroceryCatalogPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [GroceryCatalogPage] }).compileComponents();
  });

  it('should list products grouped by category', async () => {
    const fixture = TestBed.createComponent(GroceryCatalogPage);
    await fixture.whenStable();

    const headings: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('h2'));
    const categoryTitles = headings.map((el) => el.textContent?.trim());

    expect(categoryTitles).toContain('Fruits & légumes');
    expect(categoryTitles.length).toBeGreaterThan(1);
  });

  it('should add a product to the list and mark it as added', async () => {
    const fixture = TestBed.createComponent(GroceryCatalogPage);
    await fixture.whenStable();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.product'),
    );
    const beurreButton = buttons.find(
      (button) => button.querySelector('.label')?.textContent?.trim() === 'beurre',
    );
    expect(beurreButton).toBeTruthy();
    expect(beurreButton!.disabled).toBe(false);

    beurreButton!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const service = TestBed.inject(GroceryService);
    expect(service.visible().some((item) => item.name === 'beurre')).toBe(true);
    expect(beurreButton!.disabled).toBe(true);
    expect(beurreButton!.classList.contains('added')).toBe(true);
  });
});
