import { expect, test } from '@playwright/test'

test('halaman awal termuat tanpa galat console dan tanpa scroll horizontal di 360 px', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SIP SMKN 1 Selayar' })).toBeVisible()

  const scrollWidth = await page.evaluate<number>('document.documentElement.scrollWidth')
  expect(scrollWidth).toBeLessThanOrEqual(360)
  expect(errors).toEqual([])
})
