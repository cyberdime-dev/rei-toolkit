import { test, expect } from '@playwright/test'

test.describe('Calculator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator/standard')
  })

  test('should display standard calculator', async ({ page }) => {
    // Check if calculator display is visible
    await expect(page.locator('v-text-field')).toBeVisible()
    
    // Check if calculator buttons are present
    const buttons = page.locator('v-btn')
    await expect(buttons).toHaveCount(17) // 16 calculator buttons + 1 clear button
  })

  test('should perform basic addition', async ({ page }) => {
    // Click 2 + 3 =
    await page.click('v-btn:has-text("2")')
    await page.click('v-btn:has-text("+")')
    await page.click('v-btn:has-text("3")')
    await page.click('v-btn:has-text("=")')
    
    // Check if result is displayed
    const display = page.locator('v-text-field input')
    await expect(display).toHaveValue('5')
  })

  test('should perform basic subtraction', async ({ page }) => {
    // Click 7 - 2 =
    await page.click('v-btn:has-text("7")')
    await page.click('v-btn:has-text("-")')
    await page.click('v-btn:has-text("2")')
    await page.click('v-btn:has-text("=")')
    
    // Check if result is displayed
    const display = page.locator('v-text-field input')
    await expect(display).toHaveValue('5')
  })

  test('should perform basic multiplication', async ({ page }) => {
    // Click 3 * 4 =
    await page.click('v-btn:has-text("3")')
    await page.click('v-btn:has-text("*")')
    await page.click('v-btn:has-text("4")')
    await page.click('v-btn:has-text("=")')
    
    // Check if result is displayed
    const display = page.locator('v-text-field input')
    await expect(display).toHaveValue('12')
  })

  test('should perform basic division', async ({ page }) => {
    // Click 8 / 2 =
    await page.click('v-btn:has-text("8")')
    await page.click('v-btn:has-text("/")')
    await page.click('v-btn:has-text("2")')
    await page.click('v-btn:has-text("=")')
    
    // Check if result is displayed
    const display = page.locator('v-text-field input')
    await expect(display).toHaveValue('4')
  })

  test('should clear display', async ({ page }) => {
    // Enter some numbers
    await page.click('v-btn:has-text("5")')
    await page.click('v-btn:has-text("3")')
    
    // Check if numbers are displayed
    const display = page.locator('v-text-field input')
    await expect(display).toHaveValue('53')
    
    // Click Clear
    await page.click('v-btn:has-text("Clear")')
    
    // Check if display is cleared
    await expect(display).toHaveValue('')
  })

  test('should handle keyboard input', async ({ page }) => {
    const display = page.locator('v-text-field input')
    
    // Focus on the display
    await display.click()
    
    // Type using keyboard
    await page.keyboard.type('5+3=')
    
    // Check if result is displayed
    await expect(display).toHaveValue('8')
  })

  test('should show error for invalid expressions', async ({ page }) => {
    // Try to calculate invalid expression
    await page.click('v-btn:has-text("5")')
    await page.click('v-btn:has-text("+")')
    await page.click('v-btn:has-text("=")')
    
    // Check if error is displayed
    const display = page.locator('v-text-field input')
    await expect(display).toHaveValue('Error')
  })

  test('should display mortgage calculator', async ({ page }) => {
    // Navigate to mortgage calculator
    await page.goto('/calculator/mortgage')
    
    // Check if mortgage calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Home Price')).toBeVisible()
    await expect(page.locator('text=Down Payment')).toBeVisible()
    await expect(page.locator('text=Interest Rate')).toBeVisible()
  })

  test('should display fix and flip calculator', async ({ page }) => {
    // Navigate to fix and flip calculator
    await page.goto('/calculator/fix-flip')
    
    // Check if fix and flip calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Purchase Price')).toBeVisible()
    await expect(page.locator('text=Repair Costs')).toBeVisible()
    await expect(page.locator('text=ARV')).toBeVisible()
  })

  test('should display buy and hold calculator', async ({ page }) => {
    // Navigate to buy and hold calculator
    await page.goto('/calculator/buy-hold')
    
    // Check if buy and hold calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Purchase Price')).toBeVisible()
    await expect(page.locator('text=Monthly Rent')).toBeVisible()
    await expect(page.locator('text=Monthly Expenses')).toBeVisible()
  })

  test('should display BRRR calculator', async ({ page }) => {
    // Navigate to BRRR calculator
    await page.goto('/calculator/brrr')
    
    // Check if BRRR calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Purchase Price')).toBeVisible()
    await expect(page.locator('text=Repair Costs')).toBeVisible()
    await expect(page.locator('text=ARV')).toBeVisible()
  })

  test('should display wholesale calculator', async ({ page }) => {
    // Navigate to wholesale calculator
    await page.goto('/calculator/wholesale')
    
    // Check if wholesale calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Purchase Price')).toBeVisible()
    await expect(page.locator('text=Assignment Fee')).toBeVisible()
  })

  test('should display NOI calculator', async ({ page }) => {
    // Navigate to NOI calculator
    await page.goto('/calculator/noi')
    
    // Check if NOI calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Gross Income')).toBeVisible()
    await expect(page.locator('text=Operating Expenses')).toBeVisible()
  })

  test('should display cash-on-cash calculator', async ({ page }) => {
    // Navigate to cash-on-cash calculator
    await page.goto('/calculator/cash-on-cash')
    
    // Check if cash-on-cash calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Annual Cash Flow')).toBeVisible()
    await expect(page.locator('text=Total Cash Invested')).toBeVisible()
  })

  test('should display cashflow calculator', async ({ page }) => {
    // Navigate to cashflow calculator
    await page.goto('/calculator/cashflow')
    
    // Check if cashflow calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Monthly Income')).toBeVisible()
    await expect(page.locator('text=Monthly Expenses')).toBeVisible()
  })

  test('should display cap rate calculator', async ({ page }) => {
    // Navigate to cap rate calculator
    await page.goto('/calculator/cap-rate')
    
    // Check if cap rate calculator is displayed
    await expect(page.locator('v-text-field')).toHaveCount(6) // Should have multiple input fields
    
    // Check if specific fields are present
    await expect(page.locator('text=Net Operating Income')).toBeVisible()
    await expect(page.locator('text=Property Value')).toBeVisible()
  })
})
