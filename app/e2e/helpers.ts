import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

export type ScreenInfo = { id: string; file: string; num: string; title: string; heading: string; desc: string }
export const SCREENS: { patient: ScreenInfo[]; clinic: ScreenInfo[] } = JSON.parse(readFileSync(new URL('../src/site/screens.json', import.meta.url), 'utf8'))

/** Collects console errors and uncaught exceptions from the moment it's called. */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

/** Serious and critical WCAG 2.2 A/AA violations, as short readable lines. */
export async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} → ${v.nodes
          .slice(0, 4)
          .map((n) => n.target.join(' '))
          .join(' | ')}`,
    )
}

/** Lets entrance animations finish so contrast is measured on the final colors. */
export const settle = (page: Page) => page.waitForTimeout(700)
