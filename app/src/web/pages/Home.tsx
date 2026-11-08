import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ChartColumn, LayoutGrid, ListChecks, MessageSquareText, Search, ShieldCheck, Smartphone, Upload, Users } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn, fmtDay, useTicker } from '../../shared/util'
import { clock, useCounts, useStore } from '../store'
import { Button, Card, Chip, Dot, H2, Kbd } from '../ui'

type Need = { id: string; tone: 'held' | 'review' | 'accent'; tag: string; title: string; body: string; primary?: boolean; action: string; run: () => void }

export function Home({ openPalette }: { openPalette: () => void }) {
  const { s, dispatch, go, log } = useStore()
  const c = useCounts()
  useTicker(5000)
  const now = clock()
  const h = now.getHours()
  const greet = h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.'
  const syncedAgo = Math.max(1, Math.round((Date.now() - s.lastSync) / 1000))

  const needs: Need[] = [
    ...s.phone
      .filter((p) => p.state === 'help')
      .map<Need>((p) => ({
        id: `help-${p.id}`,
        tone: 'accent',
        tag: 'Help',
        title: `${p.name} asked for help`,
        body: p.note,
        primary: true,
        action: 'I’m going',
        run: () => {
          dispatch({ type: 'phone', id: p.id, patch: { state: 'going', note: 'DS is walking over.' } })
          log('phone', `Answered a help request from ${p.name}`, 'Walked over to help')
        },
      })),
    ...s.queue
      .filter((q) => q.status === 'open')
      .slice(0, 2)
      .map<Need>((q) => ({ id: q.id, tone: 'review', tag: 'Review', title: q.title, body: `${q.who} · ${q.source}`, action: q.kind === 'duplicate' ? 'Compare records' : 'Open', run: () => go('review', q.id) })),
    ...s.arrivals
      .filter((a) => a.checks.some((ch) => ch.tone === 'held') && a.status !== 'checked-in')
      .map<Need>((a) => ({
        id: `held-${a.id}`,
        tone: 'held',
        tag: 'Held',
        title: a.checks.find((ch) => ch.tone === 'held')!.title,
        body: `${a.name} · ${a.time}`,
        action: 'Open check-in',
        run: () => (dispatch({ type: 'select', id: a.id }), go('desk')),
      })),
  ]

  const tiles: { id: string; title: string; body: string; icon: ReactNode; color: string; chip: ReactNode; cta: string; tint?: boolean }[] = [
    {
      id: 'desk',
      title: 'Run the desk',
      body: 'Arrivals, check-in routines and checks for the patient in front of you.',
      icon: <LayoutGrid size={22} />,
      color: 'bg-hot',
      chip: <Chip tone="info">{c.checkedToday} of 42 checked in</Chip>,
      cta: 'Desk board',
    },
    {
      id: 'phone',
      title: 'Phone check-ins',
      body: 'Who checked in on their phone, which wording they chose, and who needs a hand.',
      icon: <Smartphone size={22} />,
      color: 'bg-teal',
      chip: c.help ? <Chip tone="held">{c.help} needs help</Chip> : <Chip tone="done">All good</Chip>,
      cta: 'Open',
    },
    {
      id: 'review',
      title: 'Review queue',
      body: 'Possible duplicates and held records, each waiting for a person to decide.',
      icon: <Users size={22} />,
      color: 'bg-ink dark:bg-white/15',
      chip: <Chip tone="review">{c.reviewOpen} waiting</Chip>,
      cta: 'Review',
    },
    {
      id: 'imports',
      title: 'Bring data in',
      body: 'Drop a CSV, FHIR bundle, HL7 message or referral PDF. Every row is checked first.',
      icon: <Upload size={22} />,
      color: 'bg-hot',
      chip: <Chip tone={s.imp.stage === 'committed' ? 'done' : 'review'}>{s.imp.stage === 'committed' ? 'Import committed' : '1 import in review'}</Chip>,
      cta: 'Imports',
    },
    {
      id: 'questions',
      title: 'Question sets',
      body: 'Edit what the phone app asks, in simple words and medical terms. No app update needed.',
      icon: <MessageSquareText size={22} />,
      color: 'bg-teal',
      chip: <Chip tone="done">Return visit v{s.qsets[0].version} · live</Chip>,
      cta: 'Edit',
    },
    {
      id: 'routines',
      title: 'Routines',
      body: 'The step lists the desk repeats every day, and which steps happen before arrival.',
      icon: <ListChecks size={22} />,
      color: 'bg-ink dark:bg-white/15',
      chip: <Chip tone="info">{s.routines.length} routines</Chip>,
      cta: 'Build',
    },
    {
      id: 'audit',
      title: 'Audit log',
      body: 'Every merge, override and question change: who did it, when, and why.',
      icon: <ShieldCheck size={22} />,
      color: 'bg-hot',
      chip: <Chip tone="info">{s.audit.length} entries today</Chip>,
      cta: 'View',
    },
    {
      id: 'insights',
      title: 'Insights',
      body: 'Where patients drop off, who needs help most, and whether the wording rule is fair.',
      icon: <ChartColumn size={22} />,
      color: 'bg-teal',
      chip: <Chip tone="done">38% faster (sample)</Chip>,
      cta: 'See results',
      tint: true,
    },
  ]

  const pills = [
    { n: c.arrivalsToday, label: 'arrivals today', cls: '' },
    { n: c.checkedToday, label: 'checked in', cls: '' },
    { n: c.byPhone, label: 'checked in by phone', cls: 'bg-mist-bg text-teal-fg' },
    { n: c.reviewOpen, label: 'waiting for review', cls: 'bg-review-bg text-review-fg' },
    { n: c.help, label: c.help === 1 ? 'patient asking for help' : 'patients asking for help', cls: c.help ? 'bg-held-bg text-held-fg' : '' },
  ]

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-fg-muted">{fmtDay(now)} · Family Medicine · Desk 4</p>
          <h1 tabIndex={-1} data-page-title className="mt-1 font-logo text-[clamp(2.8rem,6vw,4.4rem)] font-normal leading-[0.98] tracking-[-0.015em] focus:outline-none">
            {greet}
          </h1>
          <p className="mt-2 text-[16px] text-fg-muted">Everything the desk does in Caravan starts here.</p>
        </div>
        <button onClick={openPalette} className="glass-pill flex h-14 w-full items-center gap-3 rounded-full border border-line-strong/70 px-5 text-left text-[15px] text-fg-subtle transition-transform hover:-translate-y-0.5 sm:w-[440px]">
          <Search size={18} aria-hidden="true" className="text-fg-muted" />
          <span className="flex-1">Search patients, imports, question sets</span>
          <span className="flex gap-1" aria-hidden="true">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </section>

      <ul aria-label="Today at a glance" className="flex flex-wrap gap-2.5">
        {pills.map((p) => (
          <motion.li layout key={p.label} className={cn('glass flex items-baseline gap-2.5 rounded-full px-5 py-3', p.cls)}>
            <motion.span key={p.n} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-[28px] font-semibold leading-none tabular">
              {p.n}
            </motion.span>
            <span className="text-sm opacity-85">{p.label}</span>
          </motion.li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="tools-h">
          <H2 id="tools-h">What do you need to do?</H2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tiles.map((t, i) => (
              <motion.li key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                <button onClick={() => go(t.id)} className={cn('glass group flex h-full w-full flex-col gap-3 rounded-[26px] p-5 text-left transition-transform duration-200 hover:-translate-y-1', t.tint && '!bg-mist-bg')}>
                  <span aria-hidden="true" className={cn('grid size-12 place-items-center rounded-full text-white shadow-solid', t.color)}>
                    {t.icon}
                  </span>
                  <span className="font-display text-[20px] font-semibold tracking-[-0.01em]">{t.title}</span>
                  <span className="text-sm leading-relaxed text-fg-muted">{t.body}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-2">
                    {t.chip}
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-accent-fg">
                      {t.cta} <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4 xl:pt-11" aria-label="Needs attention">
          <Card className="overflow-hidden">
            <div className="px-5 pb-3 pt-5">
              <H2>Needs you now</H2>
              <p className="text-[13px] text-fg-muted">{needs.length ? `${needs.length} items · most urgent first` : 'Nothing waiting. Nice.'}</p>
            </div>
            <ul aria-live="polite">
              <AnimatePresence initial={false}>
                {needs.map((n) => (
                  <motion.li key={n.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-line">
                    <div className="flex flex-col gap-2 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={n.tone}>{n.tag}</Chip>
                        <span className="font-semibold">{n.title}</span>
                      </div>
                      <p className="text-sm text-fg-muted">{n.body}</p>
                      <div>
                        <Button size="sm" variant={n.primary ? 'primary' : 'glass'} onClick={n.run}>
                          {n.action}
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Card>

          <Card className="!bg-mist-bg p-5">
            <H2 className="text-[17px] !text-teal-fg">Connections</H2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-teal-fg">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5">
                  <Dot pulse={s.live} />
                </span>
                <span>
                  <strong>Scheduling</strong> (FHIR R4 sandbox) · synced {syncedAgo < 60 ? `${syncedAgo}s` : `${Math.round(syncedAgo / 60)} min`} ago
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5">
                  <Dot />
                </span>
                <span>
                  <strong>Phone app</strong> · {c.byPhone} check-ins today · question set v{s.qsets[0].version}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5">
                  <Dot />
                </span>
                <span>
                  <strong>Imports</strong> · last file {s.imp.at} this morning
                </span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
