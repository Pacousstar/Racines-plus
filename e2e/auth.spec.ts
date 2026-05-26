import { test, expect } from '@playwright/test';

test.describe('Inscription', () => {
    test('affiche la page inscription avec le formulaire', async ({ page }) => {
        await page.goto('/onboarding');
        await expect(page.getByText('Créer mon compte')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('rejette un email invalide', async ({ page }) => {
        await page.goto('/onboarding');
        await page.locator('input[type="email"]').fill('invalide');
        await page.locator('button[type="submit"]').click();
        await expect(page.getByText('Email invalide')).toBeVisible();
    });
});

test.describe('Connexion', () => {
    test('affiche la page de connexion', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByText('Connexion')).toBeVisible();
    });

    test('rejette des identifiants vides', async ({ page }) => {
        await page.goto('/login');
        await page.locator('button[type="submit"]').click();
        await expect(page.getByText('obligatoire')).toBeVisible();
    });
});
