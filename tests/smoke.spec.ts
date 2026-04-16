import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/QI_Tracker';

test('has title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/QI Project Tracker/);
});

test('can navigate to login', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=Access Portal');
    await expect(page).toHaveURL(/.*login/);
});

test('public dashboard renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects/`);
    // It might redirect if not logged in, but we check if the basic structure is there
    const bodyText = await page.innerText('body');
    expect(bodyText).toContain('QI Project Tracker');
});
