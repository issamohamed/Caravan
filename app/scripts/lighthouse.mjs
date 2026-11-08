// Runs Lighthouse's accessibility audit on every page of the production build.
// Usage: npm run build:site && npm run lighthouse
//
// Lighthouse isn't a project dependency: it runs through npx, with the Chrome installed on this machine
// (set CHROME_PATH to use another one).
// Fails if any page scores below 95 (the Stage 1 target).
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { preview } from 'vite'

const PORT = 4181
const BASE = `http://localhost:${PORT}`
const MIN = 95
const PAGES = ['/', '/case-study/', '/patient/#arrival', '/patient/#review', '/clinic/#/home', '/clinic/#/desk', '/clinic/#/review', '/clinic/#/insights']

// Async on purpose: the preview server runs in this process and must keep answering while Lighthouse loads pages.
const run = promisify(execFile)
const server = await preview({ preview: { port: PORT, strictPort: true, open: false }, logLevel: 'warn' })
let failed = false
try {
  for (const path of PAGES) {
    for (const preset of ['mobile', 'desktop']) {
      const { stdout: out } = await run(
        'npx',
        ['--yes', 'lighthouse@13.6.0', BASE + path, '--only-categories=accessibility', '--output=json', '--output-path=stdout', '--quiet', '--chrome-flags=--headless=new', ...(preset === 'desktop' ? ['--preset=desktop'] : [])],
        { maxBuffer: 64 * 1024 * 1024 },
      )
      const lhr = JSON.parse(out)
      const score = Math.round(lhr.categories.accessibility.score * 100)
      const misses = Object.values(lhr.audits)
        .filter((a) => a.score === 0 && a.scoreDisplayMode === 'binary')
        .map((a) => a.id)
      if (score < MIN) failed = true
      console.log(`${score >= MIN ? 'ok  ' : 'FAIL'} ${String(score).padStart(3)}  ${preset.padEnd(7)} ${path}${misses.length ? `   (${misses.join(', ')})` : ''}`)
    }
  }
} finally {
  await new Promise((resolve) => server.httpServer.close(resolve))
}
if (failed) {
  console.error(`\nAt least one page scored below ${MIN}.`)
  process.exit(1)
}
