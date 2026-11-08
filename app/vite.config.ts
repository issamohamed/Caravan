/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { cpSync, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const designDir = join(here, '..', 'design')

/** The site is one multi-page build. These two modes make the single-file copies used by `npm run demo`. */
const SINGLE_FILE: Record<string, string> = {
  mobile: 'patient/index.html',
  web: 'clinic/index.html',
}

/** Serves ../design at /design in dev and copies it into the build, so the gallery can link to the design history. */
function designHistory(): Plugin {
  const types: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
  return {
    name: 'caravan-design-history',
    configureServer(server) {
      server.middlewares.use('/design', (req, res, next) => {
        const file = normalize(join(designDir, decodeURIComponent((req.url ?? '/').split('?')[0])))
        if (!file.startsWith(designDir) || !existsSync(file) || !statSync(file).isFile()) return next()
        res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream')
        res.end(readFileSync(file))
      })
    },
    writeBundle(options) {
      if (existsSync(designDir) && options.dir) cpSync(designDir, join(options.dir, 'design'), { recursive: true })
    },
  }
}

export default defineConfig(({ mode }) => {
  const single = SINGLE_FILE[mode]
  if (single) {
    return {
      plugins: [react(), tailwindcss(), viteSingleFile({ removeViteModuleLoader: true })],
      define: { __SITE__: 'false' },
      build: {
        outDir: `dist-${mode}`,
        emptyOutDir: true,
        target: 'es2022',
        rollupOptions: { input: join(here, single) },
      },
    }
  }
  return {
    plugins: [react(), tailwindcss(), designHistory()],
    define: { __SITE__: 'true' },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'es2022',
      rollupOptions: {
        input: {
          gallery: join(here, 'index.html'),
          patient: join(here, 'patient/index.html'),
          clinic: join(here, 'clinic/index.html'),
          caseStudy: join(here, 'case-study/index.html'),
        },
      },
    },
    preview: { port: 4173, strictPort: true },
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node',
    },
  }
})
