import { test, expect } from '@playwright/test'

/**
 * Patient Management E2E Tests
 * Tests patient CRUD operations and navigation
 */

test.describe('Patient Management', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

    // Login
    await page.goto('/login')
    await page.getByLabel(/e-posta/i).fill(TEST_EMAIL)
    await page.getByLabel(/şifre/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /giriş/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 })

    // Navigate to patients page
    await page.goto('/dashboard/patients')
  })

  test('should display patients page', async ({ page }) => {
    await expect(page).toHaveURL(/.*patients/)
    await expect(page.getByRole('heading', { name: /hasta/i })).toBeVisible()
  })

  test('should open add patient modal', async ({ page }) => {
    // Click add patient button
    await page.getByRole('button', { name: /yeni hasta/i }).click()

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/hasta ekle/i)).toBeVisible()
  })

  test('should create a new patient', async ({ page }) => {
    // Click add patient button
    await page.getByRole('button', { name: /yeni hasta/i }).click()

    // Fill patient form
    const randomName = `Test Patient ${Date.now()}`
    await page.getByLabel(/ad.*soyad/i).fill(randomName)
    await page.getByLabel(/yaş/i).fill('45')
    await page.getByLabel(/cinsiyet/i).selectOption('Erkek')

    // Submit form
    await page.getByRole('button', { name: /kaydet/i }).click()

    // Should show success message or redirect
    await expect(page.getByText(randomName)).toBeVisible({ timeout: 10000 })
  })

  test('should search for patients', async ({ page }) => {
    // Type in search box
    await page.getByPlaceholder(/ara/i).fill('test')

    // Results should filter
    await page.waitForTimeout(500) // Debounce delay

    // Should see search results
    const patientCards = page.getByRole('article').or(page.locator('[data-testid="patient-card"]'))
    await expect(patientCards.first()).toBeVisible()
  })

  test('should navigate to patient detail', async ({ page }) => {
    // Click first patient card
    const firstPatient = page.getByRole('article').or(page.locator('[data-testid="patient-card"]')).first()
    await firstPatient.click()

    // Should navigate to detail page
    await expect(page).toHaveURL(/.*patients\/[a-f0-9-]+/)

    // Should show patient details
    await expect(page.getByText(/demografi/i)).toBeVisible()
  })

  test('should display patient tabs', async ({ page }) => {
    // Navigate to first patient
    const firstPatient = page.getByRole('article').or(page.locator('[data-testid="patient-card"]')).first()
    await firstPatient.click()

    await page.waitForURL(/.*patients\/[a-f0-9-]+/)

    // Should see tabs
    await expect(page.getByRole('tab', { name: /genel/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /veri/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /test/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /analiz/i })).toBeVisible()
  })

  test('should delete patient', async ({ page }) => {
    // Click first patient card
    const firstPatient = page.getByRole('article').or(page.locator('[data-testid="patient-card"]')).first()
    const patientName = await firstPatient.textContent()

    await firstPatient.click()
    await page.waitForURL(/.*patients\/[a-f0-9-]+/)

    // Click delete button
    await page.getByRole('button', { name: /sil/i }).click()

    // Confirm deletion
    await page.getByRole('button', { name: /onayla/i }).click()

    // Should redirect back to list
    await expect(page).toHaveURL(/.*patients$/)

    // Patient should not be visible (soft deleted)
    if (patientName) {
      await expect(page.getByText(patientName)).not.toBeVisible()
    }
  })
})
