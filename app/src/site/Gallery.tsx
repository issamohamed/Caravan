import { ArrowRight, Compass } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../shared/util'
import { patientTour, clinicTour } from '../shared/tours'
import { SampleTag, Section, SiteFooter, SiteHeader } from './SiteChrome'
import { clinicTourPath, patientTourPath, SCREENS, screenPath, SHOT_SIZE, shotPath, type AppKind, type ScreenInfo } from './screens'

type Filter = 'all' | AppKind

const FILTERS: { id: Filter; label: string; count: number }[] = [
  { id: 'all', label: 'All screens', count: SCREENS.patient.length + SCREENS.clinic.length },
  { id: 'patient', label: 'Patient phone', count: SCREENS.patient.length },
  { id: 'clinic', label: 'Clinic web', count: SCREENS.clinic.length },
]

function readFilter(): Filter {
  const h = window.location.hash.replace('#', '')
  return h === 'patient' || h === 'clinic' ? h : 'all'
}

export function Gallery() {
  const [filter, setFilter] = useState<Filter>(readFilter)
  const choose = (f: Filter) => {
    setFilter(f)
    try {
      history.replaceState(null, '', f === 'all' ? window.location.pathname : `#${f}`)
    } catch {
      /* sandboxed preview */
    }
  }
  const shown = FILTERS.find((f) => f.id === filter)!

  return (
    <div className="ground-glow min-h-dvh font-sans text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-solid">
        Skip to content
      </a>
      <SiteHeader root="" current="gallery" />

      <main id="main" className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="pb-4 pt-12 sm:pt-16">
          <SampleTag />
          <h1 className="mt-5 font-logo text-[clamp(2.9rem,7.5vw,5.4rem)] font-normal leading-[0.98] tracking-[-0.015em]">The passenger seat of care.</h1>
          <p className="mt-5 max-w-[640px] text-[18px] leading-relaxed text-fg-muted">
            Caravan is a concept check-in system built from a front desk’s point of view: an age-friendly phone check-in for patients, and a web app for the desk that flags problems and lets people decide.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={patientTourPath} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-hot px-6 text-[15px] font-semibold text-white shadow-solid hover:bg-hot-600">
              <Compass size={18} aria-hidden="true" /> Take the patient tour
            </a>
            <a href={clinicTourPath} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-teal-deep px-6 text-[15px] font-semibold text-white shadow-solid hover:bg-teal-700">
              <Compass size={18} aria-hidden="true" /> Take the clinic tour
            </a>
            <a href="case-study/" className="glass-pill inline-flex min-h-12 items-center gap-2 rounded-full border border-line-strong/70 px-6 text-[15px] font-medium text-ink hover:bg-white/80">
              Read the case study <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <ul className="mt-7 flex flex-wrap gap-2 text-[14px]" aria-label="How to use this gallery">
            {['Every screen is the real, working app', 'Buttons, keys and forms all work', 'Wording follows answers, never age'].map((t) => (
              <li key={t} className="glass-pill rounded-full px-4 py-2">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <Section
          id="screens-h"
          title="Every screen"
          intro="Each card opens the working app on that screen, with believable answers already filled in. Go back and forth as much as you like: nothing is saved and no real patient is involved."
        >
          <fieldset className="mt-6">
            <legend className="sr-only">Show</legend>
            <div className="glass-pill inline-flex max-w-full flex-wrap gap-1 rounded-full p-1">
              {FILTERS.map((f) => {
                const on = filter === f.id
                return (
                  <label
                    key={f.id}
                    className={cn(
                      'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]',
                      on ? 'bg-ink text-white shadow-solid' : 'text-fg-muted hover:text-ink',
                    )}
                  >
                    <input type="radio" name="filter" value={f.id} checked={on} onChange={() => choose(f.id)} className="sr-only" />
                    {f.label}
                    <span className="tabular opacity-75">{f.count}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <p className="sr-only" aria-live="polite">
            Showing {shown.count} {filter === 'all' ? 'screens' : `${filter} screens`}.
          </p>

          {filter !== 'clinic' && (
            <ScreenGroup app="patient" title="For patients · phone" intro="One job: checking in on arrival. Wording follows the patient’s answers, never their age." gridClass="grid-cols-[repeat(auto-fill,minmax(178px,1fr))]" />
          )}
          {filter !== 'patient' && <ScreenGroup app="clinic" title="For clinics · web" intro="The desk’s side: every change has a reason, an audit entry and an Undo." gridClass="grid-cols-[repeat(auto-fill,minmax(290px,1fr))]" />}
        </Section>

        <Section id="tours-h" title="Guided tours" intro="Not sure where to start? A tour points at what to try, one step at a time. It waits for you; nothing moves on by itself.">
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TourCard title="Patient tour" href={patientTourPath} steps={patientTour.map((s) => s.title)} tone="hot" />
            <TourCard title="Clinic tour" href={clinicTourPath} steps={clinicTour.map((s) => s.title)} tone="teal" />
          </div>
        </Section>

        <section aria-labelledby="history-h" className="mt-16 rounded-[30px] bg-teal-deep p-7 text-white sm:p-9">
          <h2 id="history-h" className="font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold">
            Design history
          </h2>
          <p className="mt-2 max-w-[68ch] text-[16px] leading-relaxed text-white/85">How Caravan got here, from the first static mockups to the working apps. These pages are kept as they were.</p>
          <ul className="mt-4 flex flex-col gap-1.5 text-[15.5px]">
            <li>
              <a className="inline-flex min-h-11 items-center font-medium text-hot-200 underline underline-offset-4" href="design/brand.html">
                Brand: logo, color and type
              </a>
            </li>
            <li>
              <a className="inline-flex min-h-11 items-center font-medium text-hot-200 underline underline-offset-4" href="design/static-mockups/01-glass-combined/01-desk-board.html">
                Static mockups, round 1 (combined set)
              </a>
            </li>
            <li>
              <a className="inline-flex min-h-11 items-center font-medium text-hot-200 underline underline-offset-4" href="design/static-mockups/02-mobile-web-split/web-01-home.html">
                Static mockups, round 2 (mobile and web split)
              </a>
            </li>
          </ul>
        </section>
      </main>

      <SiteFooter root="" />
    </div>
  )
}

function ScreenGroup({ app, title, intro, gridClass }: { app: AppKind; title: string; intro: string; gridClass: string }) {
  const headingId = `${app}-h`
  return (
    <section aria-labelledby={headingId} className="mt-9">
      <h3 id={headingId} className="font-display text-[22px] font-semibold tracking-[-0.01em]">
        {title}
      </h3>
      <p className="mt-1 text-[15.5px] text-fg-muted">{intro}</p>
      <ul className={cn('mt-5 grid gap-4', gridClass)}>
        {SCREENS[app].map((sc) => (
          <li key={sc.id}>
            <ScreenCard app={app} sc={sc} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ScreenCard({ app, sc }: { app: AppKind; sc: ScreenInfo }) {
  const size = SHOT_SIZE[app]
  return (
    <a href={screenPath(app, sc.id)} className="glass group flex h-full flex-col overflow-hidden rounded-[26px] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span className={cn('block overflow-hidden border-b border-white/70 bg-blush-100', app === 'patient' ? 'aspect-[390/560]' : 'aspect-[16/10]')}>
        <img src={shotPath(app, sc.id)} alt="" width={size.width} height={size.height} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-4">
        <span className={cn('self-start rounded-full px-2.5 py-0.5 text-[12px] font-semibold text-white', app === 'patient' ? 'bg-ink' : 'bg-teal-deep')}>{sc.num}</span>
        <span className="font-display text-[17px] font-semibold leading-snug">{sc.title}</span>
        <span className="text-[14px] leading-snug text-fg-muted">{sc.desc}</span>
        <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-[13.5px] font-semibold text-accent-fg">
          Open this screen <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </a>
  )
}

function TourCard({ title, href, steps, tone }: { title: string; href: string; steps: string[]; tone: 'hot' | 'teal' }) {
  return (
    <article className="glass flex flex-col rounded-[26px] p-6">
      <h3 className="font-display text-[20px] font-semibold">{title}</h3>
      <p className="mt-1 text-[14.5px] text-fg-muted">{steps.length} short steps</p>
      <ol className="mt-4 flex flex-col gap-2 text-[15px]">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3">
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-white/80 text-[12px] font-semibold tabular text-ink">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <a
        href={href}
        className={cn(
          'mt-6 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full px-6 text-[15px] font-semibold text-white shadow-solid',
          tone === 'hot' ? 'bg-hot hover:bg-hot-600' : 'bg-teal-deep hover:bg-teal-700',
        )}
      >
        <Compass size={18} aria-hidden="true" /> Start the {title.toLowerCase()}
      </a>
    </article>
  )
}
