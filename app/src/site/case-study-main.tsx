import '@fontsource/gloock/latin-400.css'
import '@fontsource-variable/outfit/wght.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './site.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CaseStudy } from './CaseStudy'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CaseStudy />
  </StrictMode>,
)
