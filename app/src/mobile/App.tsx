import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Activity, ArrowLeft, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Logo } from '../shared/Logo'
import { TourFloating, TourHighlight, TourPanel, useTour } from '../shared/Tour'
import { patientTour } from '../shared/tours'
import { cn, fmtTime, galleryHref, makeDemoClock, startRoute } from '../shared/util'
import { patient, questions } from './content'
import { CheckinCtx, type Sheets } from './ctx'
import { PhoneApp } from './PhoneApp'
import { preset, questionNumber, reducer, SCREENS, type Route, type State } from './state'

const clock = makeDemoClock(9, 18, 40)
const now = () => fmtTime(clock(), true)

const JUMPS: { route: Route; label: string; group: string }[] = [
  { route: 'arrival', label: 'Arrival', group: 'Start' },
  { route: 'desk', label: 'Check in at the desk instead', group: 'Start' },
  { route: 'contact', label: '1 · Phone and address', group: 'Questions' },
  { route: 'meds', label: '2 · Medicines (sets the wording)', group: 'Questions' },
  { route: 'brought', label: '3a · Simple words', group: 'Questions' },
  { route: 'medlist', label: '3b · Medical terms', group: 'Questions' },
  { route: 'reason', label: '4 · Reason for visit', group: 'Questions' },
  { route: 'insurance', label: '5 · Insurance card', group: 'Questions' },
  { route: 'review', label: 'Check answers', group: 'Finish' },
  { route: 'done', label: 'Checked in', group: 'Finish' },
  { route: 'help', label: 'Help requested', group: 'Finish' },
]

export function App() {
  const initialRoute = useMemo(() => startRoute(SCREENS, 'arrival'), [])
  const [s, dispatch] = useReducer(reducer, undefined, () => preset(initialRoute, now()))
  const [sheet, setSheet] = useState<Sheets>('none')
  const [scale, setScale] = useState<0 | 1 | 2>(0)
  const [contrast, setContrast] = useState(false)
  const [calm, setCalm] = useState(false)
  const [phoneEl, setPhoneEl] = useState<HTMLElement | null>(null)
  const [activeJump, setActiveJump] = useState<Route>(initialRoute)
  const tour = useTour('Patient tour', patientTour)

  useEffect(() => {
    document.documentElement.style.fontSize = ['100%', '112.5%', '125%'][scale]
  }, [scale])

  const say = useCallback((msg: string) => window.dispatchEvent(new CustomEvent('caravan:say', { detail: msg })), [])
  const jump = useCallback((r: string) => {
    const route = r as Route
    dispatch({ type: 'load', state: preset(route, now()) })
    setSheet('none')
    setActiveJump(route)
    try {
      history.replaceState(null, '', `#${route}`)
    } catch {
      /* sandboxed preview */
    }
  }, [])

  const ctx = { s, dispatch, now, sheet, setSheet, scale, setScale, contrast, setContrast, calm, setCalm, say, jump, phoneEl }

  return (
    <MotionConfig reducedMotion={calm ? 'always' : 'user'}>
      <CheckinCtx.Provider value={ctx}>
        <div className="mobile-stage min-h-dvh text-white">
          <a href="#phone-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
            Skip to the check-in
          </a>
          <header className="hidden items-center justify-between gap-6 px-8 pt-6 md:flex">
            <div className="flex items-baseline gap-3">
              <Logo size="text-[2.1rem]" dot="text-hot-200" className="text-white" />
              <span className="font-display text-[0.95rem] font-medium text-teal-300">for patients</span>
            </div>
            <p className="hidden font-logo text-[1.2rem] text-white/80 lg:block">The passenger seat of care.</p>
            <div className="flex items-center gap-2 font-sans">
              <span className="glass-dark rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium text-hot-200">Interactive demo · sample data, no real patients</span>
              <a href={galleryHref} className="flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[0.86rem] font-medium text-white/90 hover:bg-white/10">
                <ArrowLeft size={15} aria-hidden="true" /> All screens
              </a>
            </div>
          </header>

          <div className="md:flex md:items-start md:justify-center md:gap-8 md:px-6 md:pb-10 md:pt-6">
            {tour.active && !tour.collapsed && (
              <div className="hidden w-[260px] shrink-0 self-stretch pt-2 md:block">
                <TourPanel tour={tour} className="sticky top-6" />
              </div>
            )}
            <aside aria-label="Demo controls" className={cn('hidden w-[250px] shrink-0 flex-col gap-4 pt-2 font-sans', tour.active && !tour.collapsed ? '' : 'xl:flex')}>
              <nav aria-labelledby="jump-h" className="glass-dark rounded-[24px] p-4">
                <h2 id="jump-h" className="px-2 font-display text-[1rem] font-semibold">
                  Jump to a screen
                </h2>
                {['Start', 'Questions', 'Finish'].map((g) => (
                  <div key={g} className="mt-3">
                    <p className="px-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-teal-300">{g}</p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {JUMPS.filter((j) => j.group === g).map((j) => {
                        const on = activeJump === j.route
                        return (
                          <li key={j.route}>
                            <button
                              onClick={() => jump(j.route)}
                              aria-current={on ? 'true' : undefined}
                              className={cn('flex min-h-9 w-full items-center rounded-full px-3 text-left text-[0.86rem] transition-colors', on ? 'bg-white text-ink' : 'text-white/85 hover:bg-white/10')}
                            >
                              {j.label}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
              <div className="glass-dark rounded-[24px] p-4 text-[0.86rem] leading-relaxed text-white/80">
                <p className="font-display text-[1rem] font-semibold text-white">Try this</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4">
                  <li>On question 2, pick “Not really”, then “Yes”. The next question changes.</li>
                  <li>Flip the Wording switch on any question.</li>
                  <li>Tap Get help and watch the desk panel.</li>
                  <li>Open Text size for large text and high contrast.</li>
                </ul>
              </div>
            </aside>

            <div ref={setPhoneEl} className="relative h-dvh w-full overflow-hidden md:h-[844px] md:w-[390px] md:shrink-0 md:rounded-[48px] md:shadow-[0_0_0_10px_#141112,0_0_0_11px_rgb(255_255_255/0.18),0_40px_80px_-30px_rgb(0_0_0/0.75)]">
              <PhoneApp />
            </div>

            <DeskMirror s={s} wideOnly={tour.active && !tour.collapsed} />
          </div>
        </div>
        <TourHighlight tour={tour} />
        <TourFloating tour={tour} className={tour.collapsed ? '' : 'md:hidden'} />
      </CheckinCtx.Provider>
    </MotionConfig>
  )
}

function DeskMirror({ s, wideOnly }: { s: State; wideOnly?: boolean }) {
  const n = questionNumber(s.screen)
  const a = s.answers
  const status =
    s.help !== 'off'
      ? { label: 'Needs help', cls: 'bg-hot text-white' }
      : s.screen === 'done'
        ? { label: `Checked in · #${patient.checkinNo}`, cls: 'bg-teal-300 text-teal-950' }
        : s.screen === 'desk'
          ? { label: 'Coming to the desk', cls: 'bg-amber-soft text-amber-ink' }
          : n
            ? { label: `In progress · question ${n} of 5`, cls: 'bg-white/15 text-white' }
            : s.screen === 'review'
              ? { label: 'Checking answers', cls: 'bg-white/15 text-white' }
              : { label: 'Visit today · not started', cls: 'bg-white/10 text-white/80' }
  const flags: string[] = []
  const changed = a.medList.filter((m) => (a.medStatus[m.id] ?? 'taking') !== 'taking')
  if (s.wording === 'medical' && a.meds === 'yes' && changed.length) flags.push(`Medicine change: ${changed.map((m) => `${m.name} ${a.medStatus[m.id]}`).join(', ')}`)
  if (a.brought === 'yes') flags.push('Brought pill bottles: nurse to review')
  if (a.contact === 'changed') flags.push('Contact info needs an update')
  if (a.insurance === 'new') flags.push(a.cardPhoto ? 'New insurance card · photo attached' : 'New insurance card · scan at desk')
  if (a.insurance === 'none') flags.push('No insurance: talk about payment options')
  if (a.reason) flags.push(`Reason: ${a.reason === 'other' ? a.reasonText || 'Something else' : questions.reason.choices.find((c) => c.id === a.reason)?.medical}`)
  const progress = s.screen === 'done' ? 5 : s.screen === 'review' ? 5 : n ? n - 1 : 0

  return (
    <aside aria-label="What the front desk sees" className={cn('hidden w-[350px] shrink-0 flex-col gap-4 pt-2 font-sans', wideOnly ? 'xl:flex' : 'lg:flex')}>
      <section className="glass-dark rounded-[24px] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-[1.02rem] font-semibold">
            <span aria-hidden="true" className="size-2 animate-live-dot rounded-full bg-hot-200" /> Live at the front desk
          </h2>
          <span className="text-[0.75rem] text-white/60">Desk 2</span>
        </div>
        <motion.div layout className={cn('mt-4 rounded-[20px] bg-white/[0.07] p-4 ring-1', s.help !== 'off' ? 'ring-2 ring-hot' : 'ring-white/10')}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className={cn('inline-flex rounded-full px-2.5 py-1 text-[0.74rem] font-semibold', status.cls)}>
              {status.label}
            </motion.span>
          </AnimatePresence>
          <p className="mt-2.5 font-display text-[1.25rem] font-semibold leading-tight">{patient.full}</p>
          <p className="text-[0.84rem] text-white/65">
            {patient.visitTime} · {patient.provider}
          </p>
          <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <motion.span className="block h-full rounded-full bg-teal-300" initial={false} animate={{ width: i <= progress ? '100%' : '0%' }} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-hot-200/20 px-2.5 py-1 text-[0.74rem] font-semibold text-hot-200">{s.wording === 'simple' ? 'Simple words' : 'Medical terms'}</span>
            {s.wordingBy === 'patient' && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.74rem] text-white/80">chosen by patient</span>}
          </div>
          {flags.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-3 text-[0.82rem] text-white/85">
              <AnimatePresence initial={false}>
                {flags.map((f) => (
                  <motion.li key={f} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-300" />
                    {f}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          {s.help !== 'off' && (
            <div className="mt-3 flex gap-2">
              <span className="flex-1 rounded-full bg-hot py-2 text-center text-[0.8rem] font-semibold">Maria is going</span>
            </div>
          )}
        </motion.div>
      </section>

      <section className="glass-dark rounded-[24px] p-5">
        <h2 className="flex items-center gap-2 font-display text-[1.02rem] font-semibold">
          <Activity size={16} aria-hidden="true" className="text-teal-300" /> What Caravan sends
        </h2>
        <p className="mt-1 text-[0.78rem] text-white/60">Simulated writes to the clinic’s system (FHIR R4)</p>
        <ol className="mt-3 flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
          <AnimatePresence initial={false}>
            {s.events.slice(0, 12).map((e) => (
              <motion.li key={e.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[14px] bg-white/[0.06] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-[0.68rem] font-semibold uppercase tracking-[0.08em]', e.kind === 'help' ? 'text-hot-200' : e.kind === 'fhir' ? 'text-teal-300' : 'text-white/55')}>
                    {e.kind === 'fhir' ? 'Record' : e.kind === 'help' ? 'Help' : 'Note'}
                  </span>
                  <span className="font-mono text-[0.7rem] text-white/50">{e.at}</span>
                </div>
                <p className="mt-0.5 text-[0.84rem] leading-snug">{e.text}</p>
                {e.resource && <p className="mt-0.5 font-mono text-[0.7rem] text-teal-300/90">{e.resource}</p>}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </section>
      <p className="flex items-center gap-1.5 px-2 text-[0.76rem] text-white/55">
        <Smartphone size={13} aria-hidden="true" className="shrink-0" /> Patients use their own phone. Staff use the clinic web app.
      </p>
    </aside>
  )
}
