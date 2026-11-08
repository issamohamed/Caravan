import '@fontsource/gloock/latin-400.css'
import '@fontsource-variable/outfit/wght.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import './site.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Gallery } from './Gallery'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
)
