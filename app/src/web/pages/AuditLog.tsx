import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Download, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cn, downloadText, toCsv } from '../../shared/util'
import type { AuditEntry, AuditType, Tone } from '../data'
import { useStore } from '../store'
import { Button, Card, Chip, H2, PageHeader, SidePanel } from '../ui'

const types: { id: AuditType | 'all'; label: string; tone: Tone }[] = [
  { id: 'all', label: 'All', tone: 'neutral' },
  { id: 'records', label: 'Records', tone: 'accent' },
  { id: 'checkin', label: 'Check-in', tone: 'note' },
  { id: 'phone', label: 'Phone', tone: 'done' },
  { id: 'check', label: 'Checks', tone: 'held' },
  { id: 'override', label: 'Overrides', tone: 'held' },
  { id: 'import', label: 'Imports', tone: 'review' },
  { id: 'qset', label: 'Question sets', tone: 'info' },
  { id: 'routine', label: 'Routines', tone: 'info' },
]
const toneOf = (t: AuditType) => types.find((x) => x.id === t)!.tone
const labelOf = (t: AuditType) => types.find((x) => x.id === t)!.label

export function AuditLog() {
  const { s } = useStore()
  const [type, setType] = useState<AuditType | 'all'>('all')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const [limit, setLimit] = useState(14)
  const [open, setOpen] = useState<AuditEntry | null>(null)
  const [range, setRange] = useState('today')

  const filtered = useMemo(() => {
    const needle = dq.trim().toLowerCase()
    return s.audit.filter((e) => (type === 'all' || e.type === type) && (!needle || `${e.what} ${e.who} ${e.reason} ${e.where}`.toLowerCase().includes(needle)))
  }, [s.audit, type, dq])

  const overrides = s.audit.filter((e) => e.type === 'override').length
  const merges = s.audit.filter((e) => e.type === 'records' && /Linked/.test(e.what)).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Records"
        title="Audit log"
        description="Every change Caravan makes or records. Entries can’t be edited or deleted."
        actions={
          <Button
            icon={<Download size={16} aria-hidden="true" />}
            onClick={() => {
              const ok = downloadText('caravan-audit-log.csv', toCsv(filtered.map((e) => ({ time: e.time, type: labelOf(e.type), what: e.what, who: e.who, reason: e.reason, where: e.where }))))
              if (ok) toast.success(`Downloaded ${filtered.length} entries as CSV.`)
            }}
          >
            Download CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Filter by type" className="flex flex-wrap gap-1.5">
          {types.map((t) => {
            const on = type === t.id
            const n = t.id === 'all' ? s.audit.length : s.audit.filter((e) => e.type === t.id).length
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={on}
                onClick={() => setType(t.id)}
                className={cn('h-10 rounded-full px-4 text-[13px] font-medium transition-colors', on ? 'bg-ink text-white shadow-solid dark:bg-white dark:text-ink' : 'glass-pill text-fg-muted hover:text-fg')}
              >
                {t.label} <span className="ml-1 tabular opacity-70">{n}</span>
              </button>
            )
          })}
        </div>
        <div className="glass-pill flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-full px-4">
          <Search size={15} aria-hidden="true" className="text-fg-subtle" />
          <label htmlFor="audit-q" className="sr-only">
            Search the audit log
          </label>
          <input
            id="audit-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by person, record or file"
            className="h-full flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
        </div>
        <div className="relative">
          <label htmlFor="range" className="sr-only">
            Date range
          </label>
          <select
            id="range"
            value={range}
            onChange={(e) => (setRange(e.target.value), e.target.value !== 'today' && toast('The demo only has today’s entries.'))}
            className="glass-pill h-10 appearance-none rounded-full pl-4 pr-9 text-[13px] font-medium text-fg"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
          </select>
          <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden">
          <div role="region" aria-label="Audit entries" tabIndex={0} className="overflow-x-auto focus-visible:outline-offset-[-3px]">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <caption className="sr-only">Audit entries, newest first. Select a row for details.</caption>
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-[0.06em] text-fg-muted">
                  <th scope="col" className="py-3.5 pl-6 pr-3 font-semibold">
                    Time
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">
                    What happened
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">
                    Who
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">
                    Reason given
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 font-semibold">
                    Where
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.slice(0, limit).map((e) => (
                    <motion.tr
                      key={e.id}
                      layout
                      initial={{ opacity: 0, backgroundColor: 'rgba(211,21,107,0.12)' }}
                      animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                      transition={{ duration: 1.2 }}
                      className="group border-t border-line align-top"
                    >
                      <td className="py-3.5 pl-6 pr-3 font-mono text-[13px] tabular">{e.time}</td>
                      <td className="px-3 py-3.5">
                        <Chip tone={toneOf(e.type)}>{labelOf(e.type)}</Chip>
                      </td>
                      <td className="px-3 py-3.5">
                        <button onClick={() => setOpen(e)} className="text-left font-medium underline-offset-4 group-hover:underline">
                          {e.what}
                        </button>
                      </td>
                      <td className="px-3 py-3.5">{e.who}</td>
                      <td className="px-3 py-3.5 text-fg-muted">{e.reason}</td>
                      <td className="py-3.5 pl-3 pr-6 text-fg-muted">{e.where}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {!filtered.length && <p className="px-6 py-10 text-center text-sm text-fg-muted">No entries match. Try a different filter or search.</p>}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-sunk px-6 py-3 text-[13px] text-fg-muted">
            <span>
              Showing {Math.min(limit, filtered.length)} of {filtered.length} entries
            </span>
            {filtered.length > limit && (
              <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 14)}>
                Show more
              </Button>
            )}
          </div>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <H2 className="text-[17px]">Today</H2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                [s.audit.length, 'entries'],
                [overrides, 'overrides'],
                [merges, 'links'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-[20px] bg-surface-strong p-3 ring-1 ring-line">
                  <motion.p key={String(n)} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl font-semibold tabular">
                    {n}
                  </motion.p>
                  <p className="text-[12px] text-fg-muted">{l}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <H2 className="text-[17px]">What gets logged</H2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
              <li>Every record link or merge, with the reason</li>
              <li>Every skipped step or overridden check</li>
              <li>Every import, row by row</li>
              <li>Every question-set edit and publish</li>
              <li>Every phone check-in and help request</li>
            </ul>
          </Card>
          <Card className="!bg-mist-bg p-5">
            <H2 className="text-[17px] !text-teal-fg">Why reasons are required</H2>
            <p className="mt-1.5 text-sm text-teal-fg">A reason turns “someone changed it” into something a supervisor can check later. It also shows which rules staff keep working around, so the clinic can fix the rule.</p>
          </Card>
        </aside>
      </div>

      <SidePanel open={!!open} onOpenChange={(o) => !o && setOpen(null)} title="Audit entry" description={open ? `${open.time} today · ${labelOf(open.type)}` : undefined}>
        {open && (
          <div className="flex flex-col gap-5">
            <p className="text-lg font-medium leading-snug">{open.what}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Who', open.who],
                ['Where', open.where],
                ['Reason', open.reason],
                ['Entry ID', `AE-${open.id}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[18px] bg-surface-strong p-3 ring-1 ring-line">
                  <dt className="text-[12px] text-fg-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Stored as</p>
              <pre tabIndex={0} aria-label="AuditEvent as JSON" className="mt-2 overflow-x-auto rounded-[18px] bg-ink p-4 font-mono text-[12px] leading-relaxed text-white/90 dark:bg-black/40">
                {JSON.stringify(
                  {
                    resourceType: 'AuditEvent',
                    id: `ae-${open.id}`,
                    recorded: `${new Date().toISOString().slice(0, 10)}T${open.time}:00-05:00`,
                    action: open.type === 'records' || open.type === 'override' ? 'U' : open.type === 'import' ? 'C' : 'E',
                    outcome: '0',
                    agent: [{ who: { display: open.who }, requestor: open.who !== 'System' }],
                    source: { observer: { display: `Caravan · ${open.where}` } },
                    purposeOfEvent: [{ text: open.reason }],
                    entity: [{ what: { display: open.what } }],
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
