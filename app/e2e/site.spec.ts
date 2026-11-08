import { expect, test } from '@playwright/test'
import { SCREENS, seriousViolations, settle, watchErrors } from './helpers'

const total = SCREENS.patient.length + SCREENS.clinic.length

test.describe('gallery', () => {
  test('lists every screen with a screenshot, and passes axe', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'The passenger seat of care.' })).toBeVisible()
    const cards = page.getByRole('main').locator('ul.grid > li > a')
    await expect(cards).toHaveCount(total)

    // Every screenshot loads.
    const imgs = page.locator('ul.grid img')
    for (let i = 0; i < (await imgs.count()); i++) await imgs.nth(i).scrollIntoViewIfNeeded()
    const broken = await imgs.evaluateAll((els) => els.filter((el) => !(el as HTMLImageElement).complete || (el as HTMLImageElement).naturalWidth === 0).map((el) => el.getAttribute('src')))
    expect(broken).toEqual([])

    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    expect(errors).toEqual([])
  })

  test('filters patient and clinic screens', async ({ page }) => {
    await page.goto('/')
    const cards = page.getByRole('main').locator('ul.grid > li > a')
    await page.locator('label', { hasText: 'Patient phone' }).click()
    await expect(page.getByRole('radio', { name: /Patient phone/ })).toBeChecked()
    await expect(cards).toHaveCount(SCREENS.patient.length)
    await expect(page).toHaveURL(/#patient$/)
    await page.locator('label', { hasText: 'Clinic web' }).click()
    await expect(cards).toHaveCount(SCREENS.clinic.length)
    await page.locator('label', { hasText: 'All screens' }).click()
    await expect(cards).toHaveCount(total)
  })

  test('a card opens the working app on that screen', async ({ page }) => {
    await page.goto('/#patient')
    await page.getByRole('link', { name: /Medical terms/ }).click()
    await expect(page).toHaveURL(/\/patient\/#medlist$/)
    await expect(page.getByRole('heading', { name: 'Your medication list' })).toBeVisible()
  })

  test('the apps link back to the gallery', async ({ page }) => {
    await page.goto('/clinic/#/home')
    await page.getByRole('link', { name: 'All screens' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'The passenger seat of care.' })).toBeVisible()
  })
})

test.describe('case study', () => {
  test('opens, loads its images, and passes axe', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/case-study/')
    await expect(page.getByRole('heading', { level: 1, name: /Check-in, redesigned/ })).toBeVisible()
    await expect(page.getByText('Numbers are sample figures until Stage 5')).toBeVisible()
    const imgs = page.locator('main img')
    for (let i = 0; i < (await imgs.count()); i++) await imgs.nth(i).scrollIntoViewIfNeeded()
    const broken = await imgs.evaluateAll((els) => els.filter((el) => (el as HTMLImageElement).naturalWidth === 0).map((el) => el.getAttribute('src')))
    expect(broken).toEqual([])
    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    expect(errors).toEqual([])
  })
})

test.describe('guided tours', () => {
  test('patient tour: points at what to try and waits for Next', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/patient/?tour#arrival')
    const tour = page.getByRole('complementary', { name: 'Guided tour' })
    await expect(tour).toContainText('step 1 of 8')

    await page.getByRole('button', { name: /I’m at the clinic, start/ }).click()
    await expect(tour).toContainText('Nice, that’s it.')
    // The tour never moves on by itself.
    await expect(tour).toContainText('step 1 of 8')
    await tour.getByRole('button', { name: 'Next' }).click()
    await expect(tour).toContainText('step 2 of 8')
    await expect(tour.getByRole('heading', { name: 'One question per screen' })).toBeVisible()

    await page.getByText('Yes, that’s right').click()
    await page.locator('#phone-main ~ footer').getByRole('button', { name: 'Next' }).click()
    await expect(tour).toContainText('Nice, that’s it.')

    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    await tour.getByRole('button', { name: 'End the tour' }).click()
    await expect(tour).toHaveCount(0)
    await expect(page).not.toHaveURL(/tour/)
    expect(errors).toEqual([])
  })

  test('clinic tour: notices when you reach the desk board', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/clinic/?tour#/home')
    const tour = page.getByRole('complementary', { name: 'Guided tour' })
    await expect(tour).toContainText('step 1 of 8')
    await tour.getByRole('button', { name: 'Next' }).click()
    await tour.getByRole('button', { name: 'Next' }).click()
    await expect(tour).toContainText('step 3 of 8')
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Desk board' }).click()
    await expect(page.getByRole('heading', { name: 'Arrivals' })).toBeVisible()
    await expect(tour).toContainText('Nice, that’s it.')
    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    expect(errors).toEqual([])
  })

  test('no tour unless asked for', async ({ page }) => {
    await page.goto('/patient/#arrival')
    await expect(page.getByRole('heading', { name: /Dorothy/ })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Guided tour' })).toHaveCount(0)
  })
})
