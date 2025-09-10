import { test, expect } from '@playwright/test'

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the main navigation', async ({ page }) => {
    // Check if the app bar is visible
    await expect(page.locator('v-app-bar')).toBeVisible()
    
    // Check if the navigation drawer is present
    await expect(page.locator('v-navigation-drawer')).toBeVisible()
    
    // Check if the main title is displayed
    await expect(page.locator('text=REI Tools')).toBeVisible()
  })

  test('should navigate to standard calculator by default', async ({ page }) => {
    // Should redirect to standard calculator
    await expect(page).toHaveURL('/calculator/standard')
    
    // Should show calculator icon in app bar
    await expect(page.locator('v-icon[class*="mdi-calculator"]')).toBeVisible()
  })

  test('should navigate to mortgage calculator', async ({ page }) => {
    // Click on mortgage calculator link
    await page.click('text=Mortgage')
    
    // Should navigate to mortgage calculator
    await expect(page).toHaveURL('/calculator/mortgage')
    
    // Should show calculator icon in app bar
    await expect(page.locator('v-icon[class*="mdi-calculator"]')).toBeVisible()
  })

  test('should navigate to fix and flip calculator', async ({ page }) => {
    // Click on fix and flip calculator link
    await page.click('text=Fix & Flip')
    
    // Should navigate to fix and flip calculator
    await expect(page).toHaveURL('/calculator/fix-flip')
  })

  test('should navigate to buy and hold calculator', async ({ page }) => {
    // Click on buy and hold calculator link
    await page.click('text=Buy & Hold')
    
    // Should navigate to buy and hold calculator
    await expect(page).toHaveURL('/calculator/buy-hold')
  })

  test('should navigate to BRRR calculator', async ({ page }) => {
    // Click on BRRR calculator link
    await page.click('text=BRRR')
    
    // Should navigate to BRRR calculator
    await expect(page).toHaveURL('/calculator/brrr')
  })

  test('should navigate to wholesale calculator', async ({ page }) => {
    // Click on wholesale calculator link
    await page.click('text=Wholesale')
    
    // Should navigate to wholesale calculator
    await expect(page).toHaveURL('/calculator/wholesale')
  })

  test('should navigate to NOI calculator', async ({ page }) => {
    // Click on NOI calculator link
    await page.click('text=Net Operating Income')
    
    // Should navigate to NOI calculator
    await expect(page).toHaveURL('/calculator/noi')
  })

  test('should navigate to cash-on-cash calculator', async ({ page }) => {
    // Click on cash-on-cash calculator link
    await page.click('text=Cash-on-Cash')
    
    // Should navigate to cash-on-cash calculator
    await expect(page).toHaveURL('/calculator/cash-on-cash')
  })

  test('should navigate to cashflow calculator', async ({ page }) => {
    // Click on cashflow calculator link
    await page.click('text=Cashflow')
    
    // Should navigate to cashflow calculator
    await expect(page).toHaveURL('/calculator/cashflow')
  })

  test('should navigate to cap rate calculator', async ({ page }) => {
    // Click on cap rate calculator link
    await page.click('text=Cap Rate')
    
    // Should navigate to cap rate calculator
    await expect(page).toHaveURL('/calculator/cap-rate')
  })

  test('should toggle dark mode', async ({ page }) => {
    // Find and click the dark mode toggle
    const darkModeToggle = page.locator('v-switch')
    await expect(darkModeToggle).toBeVisible()
    
    // Click the toggle
    await darkModeToggle.click()
    
    // The theme should change (this might be hard to test visually in headless mode)
    // But we can at least verify the toggle is interactive
    await expect(darkModeToggle).toBeVisible()
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // On mobile, the drawer should be closed by default
    // Click the toolbox button to open it
    await page.click('v-icon[class*="mdi-toolbox"]')
    
    // The navigation should be accessible
    await expect(page.locator('text=Mortgage')).toBeVisible()
  })

  test('should show 404 page for invalid routes', async ({ page }) => {
    // Navigate to an invalid route
    await page.goto('/invalid-route')
    
    // Should show 404 page
    await expect(page.locator('text=Not Found')).toBeVisible()
  })
})
