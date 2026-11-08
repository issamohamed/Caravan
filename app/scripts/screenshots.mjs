// Takes the gallery's screenshots from the production build, with Playwright.
// Usage: npm run shots   (builds, runs this, then builds again so dist/ has the new images)
//
// Writes public/shots/<app>-<screen>.jpg for every screen in src/site/screens.json, one shot of the
// first desk board mockup for the case study, and docs/screenshots/site-gallery.png for the README.
// The images are committed, so the site build itself never needs a browser.
import { chromium } from '@playwright/test'
import { cpSync, mkdirSync, readFileSync } from 'node:fs'
import { preview } from 'vite'

const SCREENS = JSON.parse(readFileSync('src/site/screens.json', 'utf8'))
const OUT = 'public/shots'
const PORT = 4179
const BASE = `http://localhost:${PORT}/`
// A fixed morning, so greetings and clocks look the same on every run.
const MORNING = new Date('2026-10-28T09:20:00')

mkdirSync(OUT, { recursive: true })
const server = await preview({ preview: { port: PORT, strictPort: true, open: false }, logLevel: 'warn' })
const browser = await chromium.launch()

async function shoot(context, url, path, opts = {}) {
  const page = await context.newPage()
  await page.clock.setFixedTime(MORNING)
  await page.goto(url, { waitUntil: 'networkidle' })
  if (opts.heading) await page.getByRole('heading', { name: opts.heading }).first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  await page.screenshot({ path, type: path.endsWith('.png') ? 'png' : 'jpeg', ...(path.endsWith('.png') ? {} : { quality: 82 }), fullPage: !!opts.fullPage })
  await page.close()
  console.log(`  ${path}`)
}

try {
  console.log('Patient screens')
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' })
  for (const sc of SCREENS.patient) await shoot(phone, `${BASE}patient/#${sc.id}`, `${OUT}/patient-${sc.id}.jpg`, { heading: sc.heading })

  console.log('Clinic screens')
  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' })
  for (const sc of SCREENS.clinic) await shoot(desk, `${BASE}clinic/#/${sc.id}`, `${OUT}/clinic-${sc.id}.jpg`, { heading: sc.heading })
  await shoot(desk, `${BASE}design/static-mockups/01-glass-combined/01-desk-board.html`, `${OUT}/mockup-desk-board.jpg`)

  console.log('Gallery, for the README')
  cpSync(OUT, 'dist/shots', { recursive: true })
  const wide = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' })
  await shoot(wide, `${BASE}#patient`, '../docs/screenshots/site-gallery.png', { heading: 'The passenger seat of care.' })
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
