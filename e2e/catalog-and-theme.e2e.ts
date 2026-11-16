import { expect, test } from '@playwright/test';

test('ajouter un produit depuis le catalogue et le retrouver dans la liste', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Produits' }).click();
  await expect(page).toHaveURL(/\/produits$/);

  await page.getByLabel('Chercher un produit').fill('beurre');
  // Repéré par son libellé exact (« petit-beurre » contient aussi « beurre »).
  const product = page
    .locator('.product')
    .filter({ has: page.locator('.label', { hasText: /^\s*beurre\s*$/ }) });
  await product.click();
  await expect(product).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('link', { name: 'Ma liste' }).click();
  await expect(page.locator('app-grocery-item').filter({ hasText: 'beurre' })).toBeVisible();
});

test('retirer un produit du catalogue en recliquant dessus, avec annulation', async ({ page }) => {
  await page.goto('/produits');

  await page.getByLabel('Chercher un produit').fill('beurre');
  // Repéré par son libellé exact (« petit-beurre » contient aussi « beurre »).
  const product = page
    .locator('.product')
    .filter({ has: page.locator('.label', { hasText: /^\s*beurre\s*$/ }) });

  await product.click();
  await expect(product).toHaveAttribute('aria-pressed', 'true');

  await product.click();
  await expect(product).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('« beurre » supprimé')).toBeVisible();

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(product).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('link', { name: 'Ma liste' }).click();
  await expect(page.locator('app-grocery-item').filter({ hasText: 'beurre' })).toBeVisible();
});

test('basculer entre thème clair et sombre, et garder le choix après rechargement', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: /Thème clair/ }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: /Thème sombre/ }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test('démarrer sur le thème du système au premier lancement', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
