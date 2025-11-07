import { test, expect } from '@playwright/test'

/**
 * Authentication E2E Tests
 * Tests the user login and registration flows
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/ACIL/)
    await expect(page.getByRole('heading', { name: /ACIL/i })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/.*login/)
    await expect(page.getByRole('heading', { name: /giriş/i })).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/.*register/)
    await expect(page.getByRole('heading', { name: /kayıt/i })).toBeVisible()
  })

  test('should show validation error for empty login', async ({ page }) => {
    await page.goto('/login')

    // Click submit without filling form
    await page.getByRole('button', { name: /giriş/i }).click()

    // Should show validation errors
    await expect(page.getByText(/gerekli/i).first()).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials
    await page.getByLabel(/e-posta/i).fill('invalid@example.com')
    await page.getByLabel(/şifre/i).fill('wrongpassword')
    await page.getByRole('button', { name: /giriş/i }).click()

    // Should show error message
    await expect(page.getByText(/hatalı/i)).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')

    // Click register link
    await page.getByRole('link', { name: /kayıt/i }).click()
    await expect(page).toHaveURL(/.*register/)

    // Click login link
    await page.getByRole('link', { name: /giriş/i }).click()
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Note: This test requires test user credentials
    // You should create a test user in your test database
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

    await page.goto('/login')

    await page.getByLabel(/e-posta/i).fill(TEST_EMAIL)
    await page.getByLabel(/şifre/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /giriş/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
  })
})
