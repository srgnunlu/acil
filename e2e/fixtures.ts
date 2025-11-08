import { test as base, Page } from '@playwright/test'

/**
 * Custom fixtures for authenticated tests
 * Provides reusable authentication state
 */

type AuthFixtures = {
  authenticatedPage: any
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }: { page: Page }, use: any) => {
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

    // Perform authentication
    await page.goto('/login')
    await page.getByLabel(/e-posta/i).fill(TEST_EMAIL)
    await page.getByLabel(/şifre/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /giriş/i }).click()

    // Wait for successful login
    await page.waitForURL(/.*dashboard/, { timeout: 10000 })

    // Use the authenticated page
    await use(page)
  },
})

export { expect } from '@playwright/test'
