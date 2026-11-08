import { expect, test } from '@playwright/test'
import { SCREENS, seriousViolations, settle, watchErrors } from './helpers'

// One smoke test per screen: it opens with the right heading, axe finds no serious
// accessibility violations, and nothing is logged to the console as an error.

for (const sc of SCREENS.patient) {
  test(`patient · ${sc.num} ${sc.title}`, async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(`/patient/#${sc.id}`)
    await expect(page.getByRole('heading', { name: sc.heading }).first()).toBeVisible()
    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    expect(errors).toEqual([])
  })
}

for (const sc of SCREENS.clinic) {
  test(`clinic · ${sc.num} ${sc.title}`, async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(`/clinic/#/${sc.id}`)
    await expect(page.getByRole('heading', { name: sc.heading }).first()).toBeVisible()
    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    expect(errors).toEqual([])
  })
}

test('clinic · dark mode has no serious violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  const errors = watchErrors(page)
  await page.goto('/clinic/#/desk')
  await expect(page.getByRole('heading', { name: 'Arrivals' })).toBeVisible()
  await settle(page)
  expect(await seriousViolations(page)).toEqual([])
  expect(errors).toEqual([])
})
