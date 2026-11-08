// Builds one self-contained HTML file per screen from the two single-file builds.
// Usage: npm run demo            (writes to ../demo)
//        node scripts/export-demo.mjs <outDir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outDir = resolve(process.argv[2] ?? '../demo')
mkdirSync(outDir, { recursive: true })

const patient = readFileSync('dist-mobile/patient/index.html', 'utf8')
const clinic = readFileSync('dist-web/clinic/index.html', 'utf8')

// One list of screens, shared with the gallery and the tests.
const SCREENS = JSON.parse(readFileSync('src/site/screens.json', 'utf8'))

function make(src, start, title, app) {
  const inject = `<script>window.__CARAVAN_START__=${JSON.stringify(start)};</script>`
  const html = src.replace(/<title>.*?<\/title>/, `<title>${title} · Caravan ${app}</title>`).replace(/<meta charset="utf-8"\s*\/?>/i, (m) => `${m}\n${inject}`)
  if (!html.includes(inject)) throw new Error(`Could not inject start screen for ${title}`)
  return html
}

for (const sc of SCREENS.patient) writeFileSync(resolve(outDir, `${sc.file}.html`), make(patient, sc.id, sc.title, 'for patients'))
for (const sc of SCREENS.clinic) writeFileSync(resolve(outDir, `${sc.file}.html`), make(clinic, sc.id, sc.title, 'for clinics'))
console.log(`Wrote ${SCREENS.patient.length + SCREENS.clinic.length} screen files to ${outDir}`)
