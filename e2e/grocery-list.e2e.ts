import { expect, Locator, Page, test } from '@playwright/test';

async function addGrocery(page: Page, name: string): Promise<void> {
  const input = page.getByLabel('Nouvel article');

  await input.fill(name);
  await input.press('Enter');
}

function groceryRow(page: Page, name: string): Locator {
  return page.locator('app-grocery-item').filter({ hasText: name });
}

// Beyond the component's delete threshold (SWIPE_DELETE_THRESHOLD_PX = -64).
const SWIPE_DISTANCE_PX = 120;
// Below the threshold: the row must snap back to its place.
const SHORT_SWIPE_DISTANCE_PX = 30;
const SWIPE_STEPS = 5;

async function swipeLeft(page: Page, target: Locator, distance: number): Promise<void> {
  const box = await target.boundingBox();

  if (!box) {
    throw new Error('Élément à swiper introuvable');
  }

  const startX = box.x + box.width - 20;
  const y = box.y + box.height / 2;
  const touchAt = (x: number) => [{ identifier: 0, clientX: x, clientY: y }];

  await target.dispatchEvent('touchstart', { touches: touchAt(startX) });

  for (let step = 1; step <= SWIPE_STEPS; step++) {
    await target.dispatchEvent('touchmove', {
      touches: touchAt(startX - (distance * step) / SWIPE_STEPS),
    });
  }

  await target.dispatchEvent('touchend', { touches: [] });
  await page.waitForTimeout(50);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ajouter, cocher, vider puis annuler, et tout retrouver après rechargement', async ({
  page,
}) => {
  await addGrocery(page, 'pain');
  await addGrocery(page, 'lait');
  await addGrocery(page, 'carotte');
  await expect(page.locator('.summary')).toHaveText('3 articles restants');

  // `.click()` rather than `.check()`: checking an item moves it from the active `@for` block
  // to the completed one, so the checkbox node itself is destroyed as a side effect of the
  // click — `.check()`'s built-in "did it become checked" verification would race that DOM
  // move. The assertions below already verify the outcome.
  await page.getByLabel('Marquer « lait » comme acheté').click({ force: true });
  await page.getByLabel('Marquer « pain » comme acheté').click({ force: true });
  await expect(page.locator('.summary')).toHaveText('1 article restant');

  await page.getByRole('button', { name: 'Vider les articles achetés (2)' }).click();
  await expect(page.locator('app-grocery-item')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('2 articles achetés retirés');

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.locator('app-grocery-item')).toHaveCount(3);

  await page.reload();
  await expect(page.locator('app-grocery-item')).toHaveCount(3);
  await expect(page.locator('.summary')).toHaveText('1 article restant');
});

test('refuser un doublon, même avec une casse différente', async ({ page }) => {
  await addGrocery(page, 'Pain');
  await addGrocery(page, '  PAIN ');

  await expect(page.getByText('Cet article est déjà dans la liste.')).toBeVisible();
  await expect(page.locator('app-grocery-item')).toHaveCount(1);
});

test('ajouter un article depuis une suggestion', async ({ page }) => {
  await page.getByLabel('Nouvel article').fill('beu');

  const suggestion = page.getByRole('button', { name: 'beurre', exact: true });
  await expect(suggestion).toContainText('🧈');
  await suggestion.click();

  await expect(groceryRow(page, 'beurre')).toBeVisible();
  await expect(page.getByLabel('Nouvel article')).toHaveValue('');
});

test('grouper les articles à acheter par rayon, dans l’ordre du magasin', async ({ page }) => {
  await addGrocery(page, 'bière');
  await addGrocery(page, 'carotte');
  await addGrocery(page, 'mon article perso');

  await expect(page.locator('.group-title')).toHaveText(['Fruits & légumes', 'Boissons', 'Autres']);
});

test('renommer un article en cliquant sur son nom', async ({ page }) => {
  await addGrocery(page, 'pain');

  await groceryRow(page, 'pain').locator('.name').click();
  const editor = page.locator('app-grocery-item .editor');
  await editor.fill('pain complet');
  await editor.press('Enter');

  await expect(groceryRow(page, 'pain complet')).toBeVisible();
});

test('supprimer un article puis annuler la suppression', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur tactile, la suppression passe par un swipe (test dédié).');
  await addGrocery(page, 'pain');

  await groceryRow(page, 'pain').getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.locator('app-grocery-item')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('« pain » supprimé');

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(groceryRow(page, 'pain')).toBeVisible();
});

test('supprimer un article par swipe vers la gauche puis annuler', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Le swipe n’existe que sur tactile.');
  await addGrocery(page, 'pain');

  await swipeLeft(page, groceryRow(page, 'pain').locator('.row'), SWIPE_DISTANCE_PX);
  await expect(page.locator('app-grocery-item')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('« pain » supprimé');

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(groceryRow(page, 'pain')).toBeVisible();
});

test('un swipe trop court ne supprime pas l’article', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Le swipe n’existe que sur tactile.');
  await addGrocery(page, 'pain');

  await swipeLeft(page, groceryRow(page, 'pain').locator('.row'), SHORT_SWIPE_DISTANCE_PX);

  await expect(groceryRow(page, 'pain')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('démarrer sans planter avec une liste enregistrée corrompue', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem('groceries', JSON.stringify([{ name: 'pain' }, null, { id: 'x' }])),
  );
  await page.reload();

  await expect(page.locator('app-grocery-item')).toHaveCount(1);
  await expect(groceryRow(page, 'pain')).toBeVisible();
});
