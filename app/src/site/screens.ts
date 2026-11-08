import data from './screens.json'

/** One list of screens for the gallery, the screenshot script, the smoke tests and `npm run demo`. */
export type AppKind = 'patient' | 'clinic'
export type ScreenInfo = { id: string; file: string; num: string; title: string; heading: string; desc: string }

export const SCREENS: Record<AppKind, ScreenInfo[]> = data

/** URL of a screen, relative to the site root. */
export const screenPath = (app: AppKind, id: string) => (app === 'patient' ? `patient/#${id}` : `clinic/#/${id}`)

/** Screenshot of a screen, relative to the site root. Made by `npm run shots`. */
export const shotPath = (app: AppKind | 'mockup', id: string) => `shots/${app}-${id}.jpg`

/** Pixel sizes the screenshots are taken at. */
export const SHOT_SIZE = { patient: { width: 390, height: 844 }, clinic: { width: 1280, height: 800 } } as const

export const patientTourPath = 'patient/?tour#arrival'
export const clinicTourPath = 'clinic/?tour#/home'
