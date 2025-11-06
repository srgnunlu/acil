import { test, expect } from '@playwright/test'

/**
 * AI Features E2E Tests
 * Tests AI analysis and chat functionality
 */

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

    // Login
    await page.goto('/login')
    await page.getByLabel(/e-posta/i).fill(TEST_EMAIL)
    await page.getByLabel(/şifre/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /giriş/i }).click()

    await page.waitForURL(/.*dashboard/, { timeout: 10000 })
  })

  test('should trigger AI analysis', async ({ page }) => {
    // Navigate to a patient detail page
    await page.goto('/dashboard/patients')

    const firstPatient = page.getByRole('article').first()
    await firstPatient.click()

    await page.waitForURL(/.*patients\/[a-f0-9-]+/)

    // Navigate to AI Analysis tab
    await page.getByRole('tab', { name: /analiz/i }).click()

    // Click analyze button
    const analyzeButton = page.getByRole('button', { name: /analiz/i })
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click()

      // Should show loading state
      await expect(page.getByText(/yükleniyor/i)).toBeVisible()

      // Should show results (with timeout for AI response)
      await expect(page.getByText(/tanı/i)).toBeVisible({ timeout: 30000 })
    }
  })

  test('should open chat interface', async ({ page }) => {
    await page.goto('/dashboard/patients')

    const firstPatient = page.getByRole('article').first()
    await firstPatient.click()

    await page.waitForURL(/.*patients\/[a-f0-9-]+/)

    // Navigate to Chat tab or page
    const chatTab = page.getByRole('tab', { name: /chat/i })
    if (await chatTab.isVisible()) {
      await chatTab.click()

      // Should see chat interface
      await expect(page.getByPlaceholder(/soru/i)).toBeVisible()
    } else {
      // Try navigating to chat page directly
      const currentUrl = page.url()
      await page.goto(`${currentUrl}/chat`)

      await expect(page.getByPlaceholder(/soru/i)).toBeVisible()
    }
  })

  test('should send chat message', async ({ page }) => {
    await page.goto('/dashboard/patients')

    const firstPatient = page.getByRole('article').first()
    await firstPatient.click()

    await page.waitForURL(/.*patients\/[a-f0-9-]+/)

    // Navigate to chat
    const chatTab = page.getByRole('tab', { name: /chat/i })
    if (await chatTab.isVisible()) {
      await chatTab.click()
    } else {
      const currentUrl = page.url()
      await page.goto(`${currentUrl}/chat`)
    }

    // Type and send message
    const chatInput = page.getByPlaceholder(/soru/i)
    await chatInput.fill('Bu hastanın risk faktörleri nelerdir?')
    await page.getByRole('button', { name: /gönder/i }).click()

    // Should show user message
    await expect(page.getByText(/risk faktörleri/i)).toBeVisible()

    // Should show AI response (with timeout)
    await expect(page.locator('[data-role="assistant"]').first()).toBeVisible({
      timeout: 30000
    })
  })

  test('should display suggested questions', async ({ page }) => {
    await page.goto('/dashboard/patients')

    const firstPatient = page.getByRole('article').first()
    await firstPatient.click()

    await page.waitForURL(/.*patients\/[a-f0-9-]+/)

    // Navigate to chat
    const chatTab = page.getByRole('tab', { name: /chat/i })
    if (await chatTab.isVisible()) {
      await chatTab.click()

      // Should see suggested questions
      await expect(page.getByText(/örnek soru/i)).toBeVisible()
    }
  })
})
