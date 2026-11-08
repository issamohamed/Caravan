import { clsx, type ClassValue } from 'clsx'
import { useEffect, useState } from 'react'

export const cn = (...v: ClassValue[]) => clsx(v)

/** Link back to the gallery: the site root on the gallery site, or index.html next to the single-file copies in demo/. */
export const galleryHref = __SITE__ ? '../' : 'index.html'

/** The screen a file should open on: hash wins, then the per-file start value. */
export function startRoute<T extends string>(allowed: readonly T[], fallback: T): T {
  const fromHash = window.location.hash.replace(/^#\/?/, '').split('?')[0] as T
  if (allowed.includes(fromHash)) return fromHash
  const injected = (window as unknown as { __CARAVAN_START__?: string }).__CARAVAN_START__ as T | undefined
  if (injected && allowed.includes(injected)) return injected
  return fallback
}

/** A demo clock that starts at a fixed time today and then runs in real time. */
export function makeDemoClock(hours: number, minutes: number, seconds = 0) {
  const real0 = Date.now()
  const d = new Date()
  d.setHours(hours, minutes, seconds, 0)
  const demo0 = d.getTime()
  return () => new Date(demo0 + (Date.now() - real0))
}

export function useTicker(ms: number) {
  const [, setN] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setN((n) => n + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
}

export const fmtTime = (d: Date, withSeconds = false) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}) })

export const fmtClock24 = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

/* ---------- Readability: a Flesch–Kincaid grade estimate, good enough for live feedback ---------- */
function syllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  const groups = trimmed.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

export function readability(text: string) {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length)
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w))
  const wc = Math.max(1, words.length)
  const syl = words.reduce((s, w) => s + syllables(w), 0)
  const grade = 0.39 * (wc / sentences) + 11.8 * (syl / wc) - 15.59
  return { grade: Math.max(1, Math.round(grade * 10) / 10), words: words.length }
}

export function gradeLabel(g: number) {
  if (g <= 5) return { label: `Grade ${Math.round(g)}`, tone: 'done' as const, hint: 'Easy for most adults' }
  if (g <= 8) return { label: `Grade ${Math.round(g)}`, tone: 'review' as const, hint: 'OK, could be simpler' }
  return { label: `Grade ${Math.round(g)}`, tone: 'held' as const, hint: 'Too hard for simple wording' }
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  try {
    const blob = new Blob([text], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    return true
  } catch {
    return false
  }
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k] ?? '')).join(','))].join('\n')
}
