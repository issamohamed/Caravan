import { Check, ChevronLeft, ChevronRight, Compass, Minus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from './util'

/**
 * A small guided tour for the gallery. It points at what to try and says when you've done it,
 * but it never moves on by itself: the visitor always presses Next.
 * Start it with `?tour` in the URL, for example /patient/?tour#arrival.
 */
export type TourStep = {
  title: string
  body: string
  /** CSS selector for the element to point at. */
  target?: string
  /** Returns true once the visitor has done what the step asks. Checked a few times a second. */
  done?: () => boolean
  doneText?: string
  /** A link shown on the last step. */
  cta?: { label: string; href: string }
}

export type TourApi = ReturnType<typeof useTour>

export function tourRequested() {
  try {
    return new URLSearchParams(window.location.search).has('tour')
  } catch {
    return false
  }
}

type Box = { top: number; left: number; width: number; height: number }
const sameBox = (a: Box | null, b: Box | null) => a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height)

function safe(fn?: () => boolean) {
  try {
    return fn ? fn() : false
  } catch {
    return false
  }
}

export function useTour(name: string, steps: TourStep[]) {
  const [active, setActive] = useState(tourRequested)
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [done, setDone] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const step = steps[i]

  useEffect(() => {
    if (!active) return
    const measure = () => {
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null
      const r = el?.getBoundingClientRect()
      const next = r && r.width > 0 && r.height > 0 ? { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) } : null
      setBox((prev) => (sameBox(prev, next) ? prev : next))
      setDone(safe(step.done))
    }
    measure()
    const id = window.setInterval(measure, 250)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [active, step])

  // When a step is done, open the panel again so the visitor sees the check mark and Next.
  useEffect(() => {
    if (done) setCollapsed(false)
  }, [done])

  // Bring the thing to try into view when a step starts.
  useEffect(() => {
    if (!active || !step.target) return
    const id = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(step.target!)
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) {
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' })
      }
    }, 120)
    return () => window.clearTimeout(id)
  }, [active, step])

  const end = useCallback(() => {
    setActive(false)
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('tour')
      history.replaceState(null, '', url)
    } catch {
      /* sandboxed preview */
    }
  }, [])

  return {
    name,
    active,
    i,
    n: steps.length,
    step,
    box,
    done,
    collapsed,
    setCollapsed,
    next: () => setI((x) => Math.min(steps.length - 1, x + 1)),
    back: () => setI((x) => Math.max(0, x - 1)),
    end,
  }
}

/** A ring drawn around the element the current step points at. */
export function TourHighlight({ tour }: { tour: TourApi }) {
  if (!tour.active || !tour.box) return null
  const b = tour.box
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[90] rounded-[24px] shadow-[0_0_0_4px_#d3156b,0_0_0_10px_rgb(211_21_107/0.22)] transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
      style={{ top: b.top - 6, left: b.left - 6, width: b.width + 12, height: b.height + 12 }}
    />
  )
}

/** The step card. Used inline (in a layout column) or inside TourFloating. */
export function TourPanel({ tour, className }: { tour: TourApi; className?: string }) {
  const { step, i, n, done } = tour
  const last = i === n - 1
  if (!tour.active) return null
  return (
    <aside aria-label="Guided tour" className={cn('rounded-[26px] bg-ink p-5 font-sans text-white shadow-[0_30px_60px_-24px_rgb(0_0_0/0.65)] ring-1 ring-white/15', className)}>
      <div className="flex items-center gap-2">
        <Compass size={16} aria-hidden="true" className="shrink-0 text-hot-200" />
        <p className="flex-1 text-[12.5px] font-semibold text-hot-200">
          {tour.name} · step {i + 1} of {n}
        </p>
        <button onClick={() => tour.setCollapsed(true)} className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white" aria-label="Hide the tour for now">
          <Minus size={17} />
        </button>
        <button onClick={tour.end} className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white" aria-label="End the tour">
          <X size={17} />
        </button>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <h2 className="mt-2 font-display text-[18px] font-semibold leading-snug">{step.title}</h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/85">{step.body}</p>
        {done && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-300 px-3 py-1 text-[13px] font-semibold text-teal-950">
            <Check size={15} strokeWidth={3} aria-hidden="true" /> {step.doneText ?? 'Nice, that’s it.'}
          </p>
        )}
        {step.target && !tour.box && !done && <p className="mt-3 text-[13px] text-white/70">Can’t see it? It may be on another screen, or hidden at this window size.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={tour.back}
          disabled={i === 0}
          className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Back
        </button>
        {last ? (
          <>
            {step.cta && (
              <a href={step.cta.href} className="inline-flex h-11 items-center gap-1 rounded-full bg-hot px-4 text-sm font-semibold text-white hover:bg-hot-600">
                {step.cta.label} <ChevronRight size={16} aria-hidden="true" />
              </a>
            )}
            <button onClick={tour.end} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/10">
              End tour
            </button>
          </>
        ) : (
          <button onClick={tour.next} className="inline-flex h-11 items-center gap-1 rounded-full bg-hot px-5 text-sm font-semibold text-white hover:bg-hot-600">
            Next <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  )
}

/**
 * The step card pinned to the window. It sits at the bottom left, and moves to the top
 * when the thing to try is low on the screen, so it never covers what it points at.
 */
export function TourFloating({ tour, className }: { tour: TourApi; className?: string }) {
  if (!tour.active) return null
  const b = tour.box
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const low = !!b && b.top + b.height / 2 > vh * 0.5
  if (tour.collapsed) {
    return (
      <button
        onClick={() => tour.setCollapsed(false)}
        className={cn('fixed right-3 top-1/2 z-[95] flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2.5 font-sans text-[13px] font-semibold text-white shadow-solid ring-1 ring-white/20', className)}
      >
        <Compass size={16} aria-hidden="true" className="text-hot-200" />
        Tour {tour.i + 1}/{tour.n}
        <span className="sr-only">: show the tour</span>
      </button>
    )
  }
  return (
    <div className={cn('fixed inset-x-3 z-[95] sm:inset-x-auto sm:left-4 sm:w-[360px]', low ? 'top-3' : 'bottom-3 sm:bottom-4', className)}>
      <TourPanel tour={tour} />
    </div>
  )
}
