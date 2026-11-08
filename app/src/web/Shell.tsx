import { Command } from 'cmdk'
import { motion } from 'motion/react'
import { ChartColumn, ClipboardCheck, Download, House, Keyboard, LayoutGrid, ListChecks, MessageSquareText, Monitor, Moon, Pause, Play, Search, ShieldCheck, Smartphone, Sun, Upload, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Logo } from '../shared/Logo'
import { cn, downloadText, galleryHref, toCsv } from '../shared/util'
import { useCounts, useStore } from './store'
import { Kbd, Modal } from './ui'

export const ROUTES = ['home', 'desk', 'phone', 'review', 'imports', 'questions', 'routines', 'audit', 'insights'] as const
export type RouteId = (typeof ROUTES)[number]

export const NAV: { id: RouteId; label: string; icon: ReactNode; group: 'Today' | 'Setup' | 'Records'; key: string }[] = [
  { id: 'home', label: 'Home', icon: <House size={16} />, group: 'Today', key: 'h' },
  { id: 'desk', label: 'Desk board', icon: <LayoutGrid size={16} />, group: 'Today', key: 'd' },
  { id: 'phone', label: 'Phone check-ins', icon: <Smartphone size={16} />, group: 'Today', key: 'p' },
  { id: 'review', label: 'Review queue', icon: <Users size={16} />, group: 'Today', key: 'r' },
  { id: 'imports', label: 'Imports', icon: <Upload size={16} />, group: 'Today', key: 'i' },
  { id: 'questions', label: 'Question sets', icon: <MessageSquareText size={16} />, group: 'Setup', key: 'q' },
  { id: 'routines', label: 'Routines', icon: <ListChecks size={16} />, group: 'Setup', key: 'o' },
  { id: 'audit', label: 'Audit log', icon: <ShieldCheck size={16} />, group: 'Records', key: 'a' },
  { id: 'insights', label: 'Insights', icon: <ChartColumn size={16} />, group: 'Records', key: 'n' },
]

export type Theme = 'system' | 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  return [theme, setTheme] as const
}

export function Shell({ route, children, theme, setTheme, openPalette, openShortcuts }: { route: RouteId; children: ReactNode; theme: Theme; setTheme: (t: Theme) => void; openPalette: () => void; openShortcuts: () => void }) {
  const { s, dispatch, go } = useStore()
  const c = useCounts()
  const badge: Partial<Record<RouteId, number>> = { phone: c.help, review: c.reviewOpen, imports: c.heldRows }
  const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
  const themeIcon = { system: <Monitor size={17} />, light: <Sun size={17} />, dark: <Moon size={17} /> }[theme]

  return (
    <div className="ground-glow min-h-dvh font-sans text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-solid">
        Skip to content
      </a>
      <div className="sticky top-0 z-40">
        <header className="on-chrome bg-chrome text-white">
          <div className="mx-auto flex h-16 max-w-[1520px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => go('home')} className="flex items-baseline gap-2.5 rounded-full pr-2" aria-label="Caravan for clinics, home">
              <Logo size="text-[1.85rem]" dot="text-hot-200" />
              <span className="hidden font-display text-[13px] font-medium text-teal-300 sm:inline">for clinics</span>
            </button>
            <div className="flex-1" />
            <button data-tour="palette" onClick={openPalette} className="glass-dark flex h-10 items-center gap-2.5 rounded-full pl-3.5 pr-2.5 text-[13px] text-white/80 transition-colors hover:bg-white/15 md:w-[320px]">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only md:not-sr-only md:flex-1 md:text-left">Search or jump to</span>
              <span className="sr-only"> (Control K)</span>
              <span className="hidden items-center gap-1 md:flex" aria-hidden="true">
                <kbd className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[11px] text-white">⌘K</kbd>
              </span>
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'live', on: !s.live })
                toast(s.live ? 'Live demo paused.' : 'Live demo resumed.', { duration: 2000 })
              }}
              aria-pressed={s.live}
              className="glass-dark hidden h-10 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium sm:flex"
            >
              {s.live ? <span aria-hidden="true" className="size-2 animate-live-dot rounded-full bg-hot-200" /> : <Pause size={14} aria-hidden="true" />}
              {s.live ? 'Live' : 'Paused'}
              <span className="sr-only"> demo updates</span>
            </button>
            <button onClick={() => setTheme(nextTheme[theme])} className="grid size-10 place-items-center rounded-full text-white/85 hover:bg-white/10" aria-label={`Theme: ${theme}. Switch to ${nextTheme[theme]}`}>
              {themeIcon}
            </button>
            <button onClick={openShortcuts} className="hidden size-10 place-items-center rounded-full text-white/85 hover:bg-white/10 sm:grid" aria-label="Keyboard shortcuts">
              <Keyboard size={18} />
            </button>
            <span className="grid size-10 place-items-center rounded-full bg-chrome-2 text-[13px] font-semibold ring-1 ring-white/25" role="img" aria-label="Signed in as DS at Desk 4">
              DS
            </span>
          </div>
        </header>
        <nav aria-label="Main" className="border-b border-line bg-[color-mix(in_oklab,var(--ground)_72%,transparent)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1520px] items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none sm:px-6 lg:px-8">
            {NAV.map((n, i) => {
              const on = route === n.id
              const sep = i > 0 && NAV[i - 1].group !== n.group
              const b = badge[n.id]
              return (
                <div key={n.id} className="flex items-center">
                  {sep && <span aria-hidden="true" className="mx-2 h-5 w-px bg-line-strong/50" />}
                  <button
                    data-tour={`nav-${n.id}`}
                    onClick={() => go(n.id)}
                    aria-current={on ? 'page' : undefined}
                    className={cn('relative flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-medium transition-colors', on ? 'text-white dark:text-ink' : 'text-fg-muted hover:bg-surface hover:text-fg')}
                  >
                    {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-ink shadow-solid dark:bg-white" transition={{ type: 'spring', stiffness: 460, damping: 36 }} />}
                    <span className="relative flex items-center gap-2" aria-hidden="true">
                      {n.icon}
                    </span>
                    <span className="relative">{n.label}</span>
                    {!!b && (
                      <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-hot px-1.5 text-[11px] font-semibold text-white tabular">
                        {b}
                        <span className="sr-only"> waiting</span>
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </nav>
      </div>
      <main id="main" data-route={route} className="mx-auto max-w-[1520px] px-4 pb-24 pt-7 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-3 px-4 pb-8 text-[12px] text-fg-subtle sm:px-6 lg:px-8">
        <span>
          Caravan · interactive concept demo · synthetic data, no real patients ·{' '}
          <a href={galleryHref} className="inline-flex min-h-6 items-center font-medium text-accent-fg underline underline-offset-2">
            All screens
          </a>
        </span>
        <span className="font-logo text-[14px] text-fg-muted">The passenger seat of care.</span>
      </footer>
    </div>
  )
}

/* ---------- Command palette ---------- */
export function CommandPalette({ open, setOpen, theme, setTheme, openShortcuts }: { open: boolean; setOpen: (o: boolean) => void; theme: Theme; setTheme: (t: Theme) => void; openShortcuts: () => void }) {
  const { s, dispatch, go } = useStore()
  const run = (fn: () => void) => {
    setOpen(false)
    window.setTimeout(fn, 10)
  }
  const item = 'flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm text-fg data-[selected=true]:bg-hot-100 data-[selected=true]:text-ink dark:data-[selected=true]:bg-white/10 dark:data-[selected=true]:text-white'
  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search pages, patients and actions"
      overlayClassName="fixed inset-0 z-[60] bg-ink/35 backdrop-blur-[2px] dark:bg-black/55"
      contentClassName="fixed left-1/2 top-[12vh] z-[61] w-[calc(100vw-24px)] max-w-[620px] -translate-x-1/2 overflow-hidden rounded-[26px] bg-surface-solid text-fg shadow-[0_40px_90px_-30px_rgb(60_10_30/0.6)] ring-1 ring-line"
    >
      <div className="flex items-center gap-3 border-b border-line px-5">
        <Search size={18} aria-hidden="true" className="text-fg-subtle" />
        <Command.Input placeholder="Search pages, patients and actions…" className="h-14 flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none" />
        <Kbd>esc</Kbd>
      </div>
      <Command.List className="max-h-[min(60vh,460px)] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-fg-subtle">
        <Command.Empty className="px-3 py-8 text-center text-sm text-fg-muted">No matches. Try a patient name or a page.</Command.Empty>
        <Command.Group heading="Go to">
          {NAV.map((n) => (
            <Command.Item key={n.id} value={`page ${n.label}`} onSelect={() => run(() => go(n.id))} className={item}>
              <span className="text-fg-muted" aria-hidden="true">
                {n.icon}
              </span>
              <span className="flex-1">{n.label}</span>
              <span className="flex gap-1" aria-hidden="true">
                <Kbd>g</Kbd>
                <Kbd>{n.key}</Kbd>
              </span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Patients today">
          {s.arrivals.map((a) => (
            <Command.Item
              key={a.id}
              value={`patient ${a.name} ${a.mrn}`}
              onSelect={() =>
                run(() => {
                  dispatch({ type: 'select', id: a.id })
                  go('desk')
                })
              }
              className={item}
            >
              <UserRound size={16} aria-hidden="true" className="text-fg-muted" />
              <span className="flex-1">{a.name}</span>
              <span className="text-[12px] text-fg-subtle">
                {a.time} · {a.visit.split(' · ')[0]}
              </span>
            </Command.Item>
          ))}
          {s.phone
            .filter((p) => !s.arrivals.some((a) => a.name === p.name))
            .map((p) => (
              <Command.Item key={p.id} value={`patient ${p.name} phone`} onSelect={() => run(() => go('phone', p.id))} className={item}>
                <Smartphone size={16} aria-hidden="true" className="text-fg-muted" />
                <span className="flex-1">{p.name}</span>
                <span className="text-[12px] text-fg-subtle">Phone check-in</span>
              </Command.Item>
            ))}
        </Command.Group>
        <Command.Group heading="Actions">
          <Command.Item value="action commit import rows" onSelect={() => run(() => go('imports'))} className={item}>
            <ClipboardCheck size={16} aria-hidden="true" className="text-fg-muted" /> Review and commit today’s import
          </Command.Item>
          <Command.Item value="action review duplicate amina" onSelect={() => run(() => go('review', 'q-dup'))} className={item}>
            <Users size={16} aria-hidden="true" className="text-fg-muted" /> Compare the possible duplicate record
          </Command.Item>
          <Command.Item
            value="action download audit log csv"
            onSelect={() =>
              run(() => {
                downloadText('caravan-audit-log.csv', toCsv(s.audit.map(({ id, ...r }) => ({ id, ...r }))))
                toast.success('Audit log downloaded as CSV.')
              })
            }
            className={item}
          >
            <Download size={16} aria-hidden="true" className="text-fg-muted" /> Download the audit log (CSV)
          </Command.Item>
          <Command.Item value="action toggle theme dark light" onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))} className={item}>
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />} Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </Command.Item>
          <Command.Item value="action pause resume live demo" onSelect={() => run(() => dispatch({ type: 'live', on: !s.live }))} className={item}>
            {s.live ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />} {s.live ? 'Pause' : 'Resume'} the live demo
          </Command.Item>
          <Command.Item value="action keyboard shortcuts help" onSelect={() => run(openShortcuts)} className={item}>
            <Keyboard size={16} aria-hidden="true" className="text-fg-muted" /> Keyboard shortcuts
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

export function ShortcutsDialog({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const rows: [string[], string][] = [
    [['⌘', 'K'], 'Search or jump anywhere'],
    [['/'], 'Search'],
    [['?'], 'Show this list'],
    [['g', 'h'], 'Go to Home (d desk · p phone · r review · i imports · q questions · o routines · a audit · n insights)'],
    [['1', '…', '6'], 'Desk board: mark a check-in step done or not done'],
    [['j', 'k'], 'Desk board: next or previous patient'],
    [['esc'], 'Close any panel'],
  ]
  return (
    <Modal open={open} onOpenChange={setOpen} title="Keyboard shortcuts" description="Built for a desk that runs on repetition." wide>
      <ul className="flex flex-col divide-y divide-line">
        {rows.map(([keys, what]) => (
          <li key={what} className="flex items-center gap-4 py-3 text-sm">
            <span className="flex w-24 shrink-0 gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
            <span className="text-fg-muted">{what}</span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

/** Global keys: ⌘K, /, ?, and g-then-letter navigation. */
export function useGlobalKeys(openPalette: () => void, openShortcuts: () => void) {
  const { go } = useStore()
  const pendingG = useRef<number | null>(null)
  const map = useMemo(() => Object.fromEntries(NAV.map((n) => [n.key, n.id])), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') {
        e.preventDefault()
        openPalette()
      } else if (e.key === '?') {
        openShortcuts()
      } else if (pendingG.current && map[e.key]) {
        window.clearTimeout(pendingG.current)
        pendingG.current = null
        go(map[e.key])
      } else if (e.key === 'g') {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 900)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, map, openPalette, openShortcuts])
}
