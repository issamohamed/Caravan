import { createContext, useContext } from 'react'
import type { Action, State } from './state'

export type Sheets = 'none' | 'display' | 'addMed' | 'camera'

export type Ctx = {
  s: State
  dispatch: (a: Action) => void
  now: () => string
  sheet: Sheets
  setSheet: (s: Sheets) => void
  scale: 0 | 1 | 2
  setScale: (n: 0 | 1 | 2) => void
  contrast: boolean
  setContrast: (b: boolean) => void
  calm: boolean
  setCalm: (b: boolean) => void
  say: (msg: string) => void
  jump: (route: string) => void
  phoneEl: HTMLElement | null
}

export const CheckinCtx = createContext<Ctx | null>(null)
export const useCheckin = () => {
  const c = useContext(CheckinCtx)
  if (!c) throw new Error('CheckinCtx missing')
  return c
}
