import { test, expect } from '@playwright/test';

test.describe('E2E Smoke Tests', () => {
  test('la aplicación responde y carga correctamente en el navegador', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });
});

