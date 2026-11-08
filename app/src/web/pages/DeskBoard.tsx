import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, CreditCard, Languages, Minus, ScanLine, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn, fmtClock24, useTicker } from '../../shared/util'
import { improvements, type Arrival, type StepState } from '../data'
import { clock, nowHM, useCounts, useStore } from '../store'
import { Button, Card, Chip, H2, Kbd, Modal, Segmented } from '../ui'

type Filter = 'all' | 'waiting' | 'attention'

function statusChip(a: Arrival) {
  switch (a.status) {
    case 'checked-in':
      return <Chip tone="done">Checked in</Chip>
    case 'waiting':
      return <Chip tone="note">Waiting {a.waitMin} min</Chip>
    case 'at-desk':
      return <Chip tone="accent">At desk</Chip>
    case 'held':
      return <Chip tone="held">Held</Chip>
    default:
      return <span className="text-xs text-fg-subtle">Expected</span>
  }
}

export function DeskBoard() {
  const { s, dispatch, undoable, log } = useStore()
  const counts = useCounts()
  const [filter, setFilter] = useState<Filter>('all')
  const [scanOpen, setScanOpen] = useState(false)
  const selected = s.arrivals.find((a) => a.id === s.selected) ?? s.arrivals[0]
  const routine = s.routines.find((r) => r.id === selected.routine)!
  const steps = routine.steps.map((st) => ({ ...st, state: (selected.steps[st.id] ?? 'todo') as StepState, note: selected.stepNotes?.[st.id] }))
  const attention = (a: Arrival) => a.status === 'held' || a.checks.some((c) => c.tone !== 'note')
  const list = s.arrivals.filter((a) => (filter === 'all' ? true : filter === 'waiting' ? a.status === 'waiting' || a.status === 'at-desk' : attention(a)))
  useTicker(1000)
  const now = clock()
  const nowStr = fmtClock24(now)

  const toggleStep = (i: number) => {
    const st = steps[i]
    if (!st) return
    const next: StepState = st.state === 'desk' || st.state === 'early' || st.state === 'skipped' ? 'todo' : 'desk'
    dispatch({ type: 'step', id: selected.id, step: st.id, state: next, note: next === 'desk' ? `At desk · ${nowHM()}` : '' })
    if (next === 'desk') log('checkin', `Marked “${st.label}” done for ${selected.name}`)
  }

  const moveSel = (dir: 1 | -1) => {
    const idx = s.arrivals.findIndex((a) => a.id === selected.id)
    const n = s.arrivals[(idx + dir + s.arrivals.length) % s.arrivals.length]
    dispatch({ type: 'select', id: n.id })
  }

  const keyRef = useRef({ toggleStep, moveSel })
  keyRef.current = { toggleStep, moveSel }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[1-9]$/.test(e.key)) keyRef.current.toggleStep(Number(e.key) - 1)
      else if (e.key === 'j') keyRef.current.moveSel(1)
      else if (e.key === 'k') keyRef.current.moveSel(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openIdx = steps.findIndex((st) => st.state === 'open')
  const nextIdx = openIdx >= 0 ? openIdx : steps.findIndex((st) => st.state === 'todo')
  const doneCount = steps.filter((st) => st.state === 'desk' || st.state === 'early').length
  const earlyCount = steps.filter((st) => st.state === 'early').length
  const remaining = steps.filter((st) => st.state === 'open' || st.state === 'todo').length

  const complete = () => {
    const nextSel = s.arrivals.find((a) => a.id !== selected.id && a.status !== 'checked-in')
    undoable(
      `${selected.name} is checked in.`,
      [
        { type: 'arrival', id: selected.id, patch: { status: 'checked-in', arrivedAt: selected.arrivedAt ?? nowHM() } },
        {
          type: 'audit',
          entry: { type: 'checkin', what: `Completed check-in for ${selected.name} (${routine.name})${remaining ? `, ${remaining} step${remaining > 1 ? 's' : ''} sent to follow-up` : ''}`, who: 'DS', reason: '—', where: 'Desk 4' },
        },
        ...(nextSel ? [{ type: 'select' as const, id: nextSel.id }] : []),
      ],
      { description: remaining && routine.rules.followUp ? `${remaining} open step${remaining > 1 ? 's' : ''} moved to the clinic’s follow-up list.` : undefined },
    )
  }

  const selfPay = () => {
    undoable(`Marked ${selected.name} as self-pay for today.`, [
      { type: 'step', id: selected.id, step: steps[nextIdx].id, state: 'desk', note: 'Self-pay today' },
      { type: 'arrival', id: selected.id, patch: { checks: selected.checks.filter((c) => c.tone !== 'held') } },
      { type: 'audit', entry: { type: 'override', what: `Marked ${selected.name} as self-pay for today’s visit`, who: 'DS', reason: 'No current card at the desk', where: 'Desk 4' } },
    ])
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Arrivals timeline */}
      <section aria-labelledby="arrivals-h">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 id="arrivals-h" tabIndex={-1} data-page-title className="font-logo text-[clamp(2.2rem,4vw,3.1rem)] font-normal leading-none tracking-[-0.01em] focus:outline-none">
              Arrivals
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              Desk 4 · {counts.checkedToday} of 42 checked in · <Kbd>j</Kbd> <Kbd>k</Kbd> to move between patients
            </p>
          </div>
          <Segmented
            label="Filter arrivals"
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All', count: s.arrivals.length },
              { id: 'waiting', label: 'Waiting', count: s.arrivals.filter((a) => a.status === 'waiting' || a.status === 'at-desk').length },
              { id: 'attention', label: 'Needs attention', count: s.arrivals.filter(attention).length },
            ]}
          />
        </div>
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <ol className="flex w-max gap-3">
            <AnimatePresence initial={false}>
              {list.map((a, i) => {
                const on = a.id === selected.id
                const flags = a.checks.filter((c) => c.tone !== 'note').length
                const showNow = a.time <= nowStr && (list[i + 1]?.time ?? '99:99') > nowStr
                return (
                  <motion.li key={a.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex items-stretch gap-3">
                    <div className="flex flex-col">
                      <div className="relative h-7">
                        <span aria-hidden="true" className="absolute inset-x-0 top-3 h-0.5 rounded bg-line-strong/40" />
                        <span
                          aria-hidden="true"
                          className={cn('absolute left-0 top-[7px] size-3 rounded-full ring-2', on ? 'bg-hot ring-ink dark:ring-white' : a.status === 'checked-in' ? 'bg-teal ring-transparent' : 'bg-surface-solid ring-line-strong')}
                        />
                        <span className="absolute left-5 top-0.5 rounded-full bg-surface-strong px-2 font-mono text-[12px] text-fg-muted">{a.time}</span>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'select', id: a.id })}
                        aria-pressed={on}
                        className={cn(
                          'mt-1.5 flex min-h-[112px] w-[216px] flex-col gap-0.5 rounded-[22px] p-4 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5',
                          on ? 'bg-ink text-white shadow-[0_20px_40px_-18px_rgb(35_31_32/0.8)] dark:bg-white dark:text-ink' : 'glass',
                        )}
                      >
                        <span className="flex items-center gap-1.5 font-display text-[16px] font-semibold">
                          {a.name}
                          {a.channel === 'phone' && <Smartphone size={13} aria-label="Checked in by phone" className={on ? 'text-hot-200 dark:text-hot' : 'text-teal-fg'} />}
                        </span>
                        <span className={cn('text-[13px]', on ? 'text-white/75 dark:text-ink/70' : 'text-fg-muted')}>{a.visit}</span>
                        <span className="mt-auto flex items-center justify-between gap-2 pt-2">
                          {on && a.status === 'at-desk' ? <Chip className="bg-hot-200 text-ink">At desk</Chip> : statusChip(a)}
                          {flags > 0 && (
                            <span className={cn('text-xs font-semibold', on ? 'text-hot-200 dark:text-hot-700' : 'text-accent-fg')}>
                              {flags} check{flags > 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                      </button>
                    </div>
                    {showNow && (
                      <div className="flex flex-col items-center" aria-label={`Now, ${nowStr}`} role="img">
                        <span className="grid h-7 place-items-center rounded-full bg-teal px-2.5 text-[12px] font-semibold text-white tabular dark:bg-teal-300 dark:text-teal-950">Now {nowStr}</span>
                        <span aria-hidden="true" className="mt-1.5 w-0.5 flex-1 rounded bg-teal dark:bg-teal-300" />
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ol>
        </div>
      </section>

      {/* Improvements band */}
      <ImprovementsBand />

      {/* Patient + routine + checks */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="pt-h" className="flex min-w-0 flex-col gap-4">
          <Card className="p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] text-fg-muted">
                    {selected.status === 'at-desk' ? 'At the desk now' : selected.status === 'checked-in' ? 'Checked in' : 'Selected'} · {selected.time} {selected.visit} · {selected.provider}
                  </p>
                  <h2 id="pt-h" className="mt-1 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em]">
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">
                    {selected.legalName && <>Legal name {selected.legalName} · </>}
                    {selected.pronouns && <>{selected.pronouns} · </>}
                    DOB {selected.dob} ({selected.age}) · <span className="font-mono text-[13px]">{selected.mrn}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'at-desk' && <AtDeskTimer />}
                  {selected.interpreter && (
                    <Chip tone="info" className="!py-1.5 !text-[13px]">
                      <Languages size={14} aria-hidden="true" /> {selected.interpreter}
                    </Chip>
                  )}
                  <Chip tone={selected.channel === 'phone' ? 'done' : 'neutral'} className="!py-1.5 !text-[13px]">
                    {selected.channel === 'phone' ? 'Checked in by phone' : 'Desk check-in'}
                    {selected.arrivedAt && ` · ${selected.arrivedAt}`}
                  </Chip>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>

          <Card className="overflow-hidden" data-tour="steps">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
              <div>
                <H2>{routine.name} check-in</H2>
                <p className="text-[13px] text-fg-muted">
                  {doneCount} of {steps.length} done · {earlyCount} settled before arrival · press <Kbd>1</Kbd>–<Kbd>{Math.min(steps.length, 9)}</Kbd> to mark a step
                </p>
              </div>
              <Segmented
                size="sm"
                label="Routine"
                value={selected.routine}
                onChange={(r) => {
                  dispatch({ type: 'arrival', id: selected.id, patch: { routine: r, steps: {}, stepNotes: {} } })
                }}
                options={s.routines.map((r) => ({ id: r.id, label: r.name }))}
              />
            </div>

            <div className="overflow-x-auto">
              <ol className="grid min-w-[720px] px-6 pb-4 pt-7" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                {steps.map((st, i) => {
                  const meta = {
                    desk: { ring: 'bg-teal text-white dark:bg-teal-300 dark:text-teal-950', label: st.note || 'At desk', lc: 'text-teal-fg', icon: <Check size={18} strokeWidth={3} /> },
                    early: { ring: 'bg-hot text-white', label: 'Before arrival', lc: 'text-accent-fg', icon: <Check size={18} strokeWidth={3} /> },
                    open: { ring: 'bg-review-bg text-review-fg ring-2 ring-[#c98a14]', label: st.note || 'Needs attention', lc: 'text-review-fg font-semibold', icon: <span className="text-base font-bold">!</span> },
                    todo: { ring: 'bg-surface-strong text-fg-muted ring-1 ring-line-strong', label: 'To do', lc: 'text-fg-subtle', icon: <span className="text-sm font-semibold">{i + 1}</span> },
                    skipped: { ring: 'bg-transparent text-fg-subtle ring-1 ring-dashed ring-line-strong border border-dashed border-line-strong', label: 'Not needed', lc: 'text-fg-subtle', icon: <Minus size={16} /> },
                  }[st.state]
                  const nextDone = i < steps.length - 1 && ['desk', 'early'].includes(steps[i + 1].state)
                  return (
                    <li key={st.id} className="relative flex flex-col items-center px-1.5 text-center">
                      {i < steps.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute left-[calc(50%+26px)] right-[calc(-50%+26px)] top-[21px] h-[3px] rounded-full',
                            ['desk', 'early'].includes(st.state) && nextDone ? (st.state === 'early' ? 'bg-hot/70' : 'bg-teal/70') : 'bg-line-strong/30',
                          )}
                        />
                      )}
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleStep(i)}
                        aria-label={`Step ${i + 1}, ${st.label}: ${meta.label}. Press to ${['desk', 'early', 'skipped'].includes(st.state) ? 'mark not done' : 'mark done'}.`}
                        className={cn('relative z-10 grid size-11 place-items-center rounded-full transition-colors', meta.ring)}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span key={st.state} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="grid place-items-center">
                            {meta.icon}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                      <span className="mt-2.5 flex items-center gap-1.5 text-[14px] font-semibold">
                        <Kbd className="hidden sm:inline-flex">{i + 1}</Kbd>
                        {st.label}
                      </span>
                      <span className={cn('mt-0.5 text-[12px] leading-snug', meta.lc)}>{meta.label}</span>
                    </li>
                  )
                })}
              </ol>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {nextIdx >= 0 && selected.status !== 'checked-in' ? (
                <motion.div
                  key={`${selected.id}-${nextIdx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'mx-6 mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[22px] px-5 py-4',
                    steps[nextIdx].state === 'open' ? 'bg-review-bg/80 ring-1 ring-[#e8c48a] dark:ring-[#f6d39a]/30' : 'bg-surface-strong ring-1 ring-line',
                  )}
                >
                  <div>
                    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', steps[nextIdx].state === 'open' ? 'text-review-fg' : 'text-fg-subtle')}>
                      {steps[nextIdx].state === 'open' ? 'Open' : 'Next'} · step {nextIdx + 1}
                    </p>
                    <p className="mt-0.5 font-semibold">{steps[nextIdx].label}</p>
                    <p className="text-sm text-fg-muted">
                      {steps[nextIdx].note ? `${steps[nextIdx].note}. ` : ''}Check: {steps[nextIdx].check.toLowerCase()}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {steps[nextIdx].id === 'insurance' ? (
                      <>
                        <Button size="md" onClick={selfPay}>
                          Mark self-pay
                        </Button>
                        <Button size="md" variant="primary" icon={<ScanLine size={16} aria-hidden="true" />} onClick={() => setScanOpen(true)}>
                          Scan new card
                        </Button>
                      </>
                    ) : (
                      <>
                        {!steps[nextIdx].required && (
                          <Button size="md" onClick={() => dispatch({ type: 'step', id: selected.id, step: steps[nextIdx].id, state: 'skipped' })}>
                            Not needed
                          </Button>
                        )}
                        <Button size="md" variant="primary" icon={<Check size={16} aria-hidden="true" />} onClick={() => toggleStep(nextIdx)}>
                          Mark done
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-sunk px-6 py-4">
              <p className="max-w-md text-[13px] text-fg-muted">
                {selected.status === 'checked-in'
                  ? `${selected.name} is checked in. Pick another patient from the timeline.`
                  : remaining
                    ? `${remaining} step${remaining > 1 ? 's' : ''} left. ${routine.rules.followUp ? 'Completing now moves them to the follow-up list, so the visit isn’t held up.' : 'This routine holds the visit until every step is done.'}`
                    : 'Every step is done.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={selected.status === 'checked-in' || selected.status === 'held'}
                  onClick={() => {
                    dispatch({ type: 'arrival', id: selected.id, patch: { status: 'held' } })
                    log('checkin', `Held ${selected.name}’s check-in for a supervisor`, 'Needs a second look')
                    toast(`${selected.name} is held for a supervisor.`)
                  }}
                >
                  Hold for supervisor
                </Button>
                <Button variant="dark" disabled={selected.status === 'checked-in' || (!routine.rules.followUp && remaining > 0)} onClick={complete} iconRight={<ArrowRight size={16} aria-hidden="true" />}>
                  Complete check-in
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <ChecksPanel a={selected} />
      </div>

      <ScanModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        onSave={() => {
          setScanOpen(false)
          undoable(
            'New insurance card saved.',
            [
              { type: 'step', id: selected.id, step: steps[nextIdx].id, state: 'desk', note: `Card scanned · ${nowHM()}` },
              { type: 'arrival', id: selected.id, patch: { checks: selected.checks.filter((c) => c.tone !== 'held') } },
              { type: 'audit', entry: { type: 'checkin', what: `Scanned a new insurance card for ${selected.name}`, who: 'DS', reason: 'Previous card ended', where: 'Desk 4' } },
            ],
            { description: 'Northstar Health Plan · member ID ending 7731 · valid through 12/2027' },
          )
        }}
      />
    </div>
  )
}

function AtDeskTimer() {
  const start = useMemo(() => Date.now() - 112_000, [])
  useTicker(1000)
  const sec = Math.floor((Date.now() - start) / 1000)
  return (
    <Chip tone="review" className="!py-1.5 !text-[13px] tabular">
      At desk {Math.floor(sec / 60)}m {String(sec % 60).padStart(2, '0')}s
    </Chip>
  )
}

function ChecksPanel({ a }: { a: Arrival }) {
  const { go } = useStore()
  const held = a.checks.filter((c) => c.tone === 'held').length
  const review = a.checks.filter((c) => c.tone === 'review').length
  const note = a.checks.filter((c) => c.tone === 'note').length
  const total = held + review + note + a.passed.length || 1
  return (
    <aside aria-labelledby="checks-h" className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 pb-4 pt-5">
          <H2 id="checks-h">Checks for {a.name.split(' ')[0]}</H2>
          <p className="text-[13px] text-fg-muted">
            {held} held · {review} to review · {note} note · {a.passed.length} passed
          </p>
          <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
            {held > 0 && <motion.span layout className="bg-ink dark:bg-white" style={{ flex: held / total }} />}
            {review > 0 && <motion.span layout className="bg-[#e8a33d]" style={{ flex: review / total }} />}
            {note > 0 && <motion.span layout className="bg-line-strong/70" style={{ flex: note / total }} />}
            <motion.span layout className="bg-teal dark:bg-teal-300" style={{ flex: a.passed.length / total }} />
          </div>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {a.checks.map((c) => (
              <motion.li key={c.title} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2 border-b border-line px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={c.tone}>{c.tone === 'held' ? 'Held' : c.tone === 'review' ? 'Review' : 'Note'}</Chip>
                  <span className="font-semibold">{c.title}</span>
                </div>
                <p className="text-sm text-fg-muted">{c.body}</p>
                {c.link && (
                  <div>
                    <Button size="sm" variant="outline" onClick={() => go(c.link!.to, 'q-dup')} iconRight={<ArrowRight size={14} aria-hidden="true" />}>
                      {c.link.label}
                    </Button>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
          <li className="flex flex-col gap-1.5 px-5 py-4">
            <div className="flex items-center gap-2">
              <Chip tone="done">Passed</Chip>
              <span className="font-semibold">{a.passed.length} checks passed</span>
            </div>
            <p className="text-[13px] text-fg-muted">{a.passed.join(' · ')}</p>
          </li>
        </ul>
      </Card>
      <Card className="!bg-mist-bg p-5">
        <H2 className="text-[17px] !text-teal-fg">How checks work</H2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-teal-fg">
          <li>Checks flag; people decide.</li>
          <li>Nothing is merged, changed or deleted automatically.</li>
          <li>Every decision is logged with who, when and why.</li>
          <li>Names are compared with spelling variants and naming customs in mind, so an unfamiliar name isn’t treated as a mistake.</li>
        </ul>
      </Card>
    </aside>
  )
}

function ImprovementsBand() {
  const ref = useRef<HTMLUListElement>(null)
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 336, behavior: 'smooth' })
  const tones: Record<string, string> = {
    white: 'bg-white/92 text-ink',
    pink: 'bg-hot-100/95 text-ink',
    mist: 'bg-mist/95 text-ink',
    blush: 'bg-blush-100/95 text-ink',
  }
  return (
    <section aria-labelledby="improve-h" className="relative overflow-hidden rounded-[34px] bg-teal-deep px-0 py-10 text-white dark:bg-[#05282b]">
      <span aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-hot/35 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-teal/70 blur-3xl" />
      <div className="relative px-6 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-hot-200">Desk 4 · last 30 days vs. the 30 before · sample figures</p>
        <h2 id="improve-h" className="mt-2 font-logo text-[clamp(2.2rem,4.5vw,3.6rem)] font-normal leading-[1.02]">
          How intake got better
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[15px] text-white/80">Each card is one change at the desk: where it stands now, where it was, and what made the difference.</p>
      </div>
      <ul ref={ref} aria-label="Improvements" tabIndex={0} className="relative mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 scrollbar-none [scroll-padding-inline:24px]">
        {improvements.map((m, i) => (
          <motion.li
            key={m.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.05 }}
            className={cn('flex w-[310px] shrink-0 snap-start flex-col gap-3 rounded-[24px] p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_24px_44px_-22px_rgb(0_0_0/0.55)]', tones[m.tone])}
          >
            <p className="text-sm font-semibold">{m.title}</p>
            <p className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-display text-[42px] font-semibold leading-none tracking-[-0.02em]">{m.now}</span>
              <span className="text-sm text-ink-soft">was {m.was}</span>
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <motion.div className="h-full rounded-full bg-ink/30" initial={{ width: 0 }} whileInView={{ width: `${m.wasPct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <motion.div className="h-full rounded-full bg-ink" initial={{ width: 0 }} whileInView={{ width: `${m.nowPct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }} />
              </div>
            </div>
            <span className="self-start rounded-full bg-ink px-3 py-1 text-[13px] font-semibold text-white">{m.delta}</span>
            <p className="text-sm text-ink-soft">{m.why}</p>
          </motion.li>
        ))}
      </ul>
      <div className="relative mt-4 flex items-center justify-center gap-3 px-6">
        <button onClick={() => scroll(-1)} aria-label="Scroll improvements left" className="grid size-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[13px] text-white/90">{improvements.length} improvements · scroll for more</span>
        <button onClick={() => scroll(1)} aria-label="Scroll improvements right" className="grid size-11 place-items-center rounded-full bg-hot text-white shadow-solid hover:bg-hot-600">
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}

function ScanModal({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: () => void }) {
  const [phase, setPhase] = useState<'scan' | 'read'>('scan')
  useEffect(() => {
    if (!open) return
    setPhase('scan')
    const id = window.setTimeout(() => setPhase('read'), 1700)
    return () => window.clearTimeout(id)
  }, [open])
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Scan the new insurance card"
      description="Hold the card under the desk scanner. Demo: the scan is simulated."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={phase !== 'read'} onClick={onSave}>
            Save to record
          </Button>
        </>
      }
    >
      <div className="relative grid aspect-[1.6] place-items-center overflow-hidden rounded-[22px] bg-teal-deep text-white">
        <AnimatePresence mode="wait">
          {phase === 'scan' ? (
            <motion.div key="scan" exit={{ opacity: 0 }} className="absolute inset-6 rounded-2xl border-2 border-dashed border-white/40">
              <span className="absolute inset-x-2 top-2 h-0.5 animate-scan bg-hot-200 shadow-[0_0_14px_2px_rgb(249_198_212/0.8)]" />
              <span className="absolute inset-0 grid place-items-center text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <CreditCard size={18} aria-hidden="true" /> Reading card…
                </span>
              </span>
            </motion.div>
          ) : (
            <motion.dl key="read" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="grid w-full gap-3 p-6 text-sm" aria-live="polite">
              <div className="flex items-center gap-2 text-teal-300">
                <Check size={16} aria-hidden="true" /> Card read
              </div>
              <div>
                <dt className="text-white/60">Plan</dt>
                <dd className="text-lg font-semibold">Northstar Health Plan</dd>
              </div>
              <div className="flex gap-8">
                <div>
                  <dt className="text-white/60">Member ID</dt>
                  <dd className="font-mono">•••• 7731</dd>
                </div>
                <div>
                  <dt className="text-white/60">Valid through</dt>
                  <dd>12/2027</dd>
                </div>
              </div>
            </motion.dl>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
