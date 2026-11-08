import { AnimatePresence, motion } from 'motion/react'
import { CalendarX, Check, CheckCircle2, EyeOff, FileQuestion, Users } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../shared/util'
import { compareFields, type QueueItem } from '../data'
import { useStore, type Act } from '../store'
import { isoToUS } from './Imports'
import { Button, Card, Chip, Field, H2, PageHeader, Segmented, inputCls } from '../ui'

const kindIcon: Record<QueueItem['kind'], ReactNode> = {
  duplicate: <Users size={18} />,
  mask: <EyeOff size={18} />,
  missing: <FileQuestion size={18} />,
  future: <CalendarX size={18} />,
}

export function ReviewQueue({ focus }: { focus?: string }) {
  const { s } = useStore()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [sel, setSel] = useState<string>(() => focus ?? s.queue.find((q) => q.status === 'open')?.id ?? s.queue[0].id)
  useEffect(() => {
    if (focus) {
      setSel(focus)
      setTab(s.queue.find((q) => q.id === focus)?.status ?? 'open')
    }
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = s.queue.filter((q) => q.status === tab)
  const item = s.queue.find((q) => q.id === sel) ?? s.queue[0]
  const advance = () => {
    const next = s.queue.find((q) => q.status === 'open' && q.id !== item.id)
    if (next) setSel(next.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Records waiting for a person" title="Review queue" description="Checks flag; people decide. Nothing in this queue changes a record until someone saves a decision with a reason." />
      <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <Card as="aside" aria-label="Queue" className="self-start p-3">
          <div className="p-2">
            <Segmented
              label="Show"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'open', label: 'Open', count: s.queue.filter((q) => q.status === 'open').length },
                { id: 'resolved', label: 'Resolved', count: s.queue.filter((q) => q.status === 'resolved').length },
              ]}
            />
          </div>
          <ul className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {list.map((q) => {
                const on = q.id === item.id
                return (
                  <motion.li key={q.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}>
                    <button
                      onClick={() => setSel(q.id)}
                      aria-current={on ? 'true' : undefined}
                      className={cn('flex w-full items-start gap-3 rounded-[20px] p-3 text-left transition-colors', on ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'hover:bg-surface-strong')}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'grid size-10 shrink-0 place-items-center rounded-full',
                          on ? 'bg-white/15 dark:bg-ink/10' : q.kind === 'duplicate' ? 'bg-hot-100 text-hot-700 dark:bg-hot/20 dark:text-hot-200' : 'bg-review-bg text-review-fg',
                        )}
                      >
                        {q.status === 'resolved' ? <Check size={18} /> : kindIcon[q.kind]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{q.title}</span>
                        <span className={cn('block text-[13px]', on ? 'opacity-80' : 'text-fg-muted')}>{q.who}</span>
                        <span className={cn('block truncate font-mono text-[11.5px]', on ? 'opacity-75' : 'text-fg-subtle')}>{q.status === 'resolved' ? q.decision : q.source}</span>
                      </span>
                      <span className={cn('text-[12px]', on ? 'opacity-70' : 'text-fg-subtle')}>{q.age}</span>
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
            {!list.length && <li className="px-3 py-8 text-center text-sm text-fg-muted">{tab === 'open' ? 'All clear. Nothing waiting.' : 'Nothing resolved yet.'}</li>}
          </ul>
        </Card>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={item.id + item.status} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="min-w-0">
            {item.status === 'resolved' ? <Resolved item={item} /> : item.kind === 'duplicate' ? <Duplicate item={item} onDone={advance} /> : <SimpleFix item={item} onDone={advance} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Resolved({ item }: { item: QueueItem }) {
  const { dispatch } = useStore()
  return (
    <Card className="flex flex-col items-start gap-4 p-8">
      <span className="grid size-14 place-items-center rounded-full bg-teal text-white dark:bg-teal-300 dark:text-teal-950">
        <CheckCircle2 size={28} aria-hidden="true" />
      </span>
      <div>
        <H2 className="text-2xl">Resolved: {item.title.toLowerCase()}</H2>
        <p className="mt-1 text-fg-muted">
          {item.who} · {item.decision}
        </p>
      </div>
      <p className="max-w-lg text-sm text-fg-muted">The decision and its reason are in the audit log. The import row was updated to match.</p>
      <Button size="sm" onClick={() => dispatch({ type: 'queue', id: item.id, patch: { status: 'open', decision: undefined } })}>
        Reopen (demo)
      </Button>
    </Card>
  )
}

function Duplicate({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const { s, undoable } = useStore()
  const [choice, setChoice] = useState<'same' | 'different' | 'unsure' | null>(null)
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const errChoice = tried && !choice ? 'Choose one of the three options.' : undefined
  const errReason = tried && reason.trim().length < 8 ? 'Add a short reason (a few words is enough).' : undefined
  const same = compareFields.filter((f) => f.result === 'same').length
  const close = compareFields.filter((f) => f.result === 'close').length

  const save = () => {
    setTried(true)
    if (!choice || reason.trim().length < 8) return
    const amina = s.arrivals.find((a) => a.id === 'warsame')
    const decision = { same: 'Linked to S-204118', different: 'Kept as two people', unsure: 'Sent to a supervisor' }[choice]
    const acts: Act[] = [
      { type: 'queue', id: item.id, patch: { status: 'resolved', decision } },
      {
        type: 'row',
        row: item.row,
        patch: {
          status: choice === 'unsure' ? 'review' : 'ready',
          finding: choice === 'same' ? 'Linked to existing record S-204118. Ready to commit.' : choice === 'different' ? 'Confirmed as a different person. A new record will be created.' : 'Sent to a supervisor for a second look.',
        },
      },
      {
        type: 'audit',
        entry: {
          type: 'records',
          what: choice === 'same' ? 'Linked import row 3 to record S-204118 (Amina Warsame)' : choice === 'different' ? 'Kept import row 3 and S-204118 as different people' : 'Sent possible duplicate (row 3 ↔ S-204118) to a supervisor',
          who: 'DS',
          reason: reason.trim(),
          where: 'Review queue',
        },
      },
    ]
    if (amina && choice !== 'unsure') acts.push({ type: 'arrival', id: 'warsame', patch: { checks: amina.checks.filter((c) => c.title !== 'Possible duplicate record') } })
    undoable(`Saved: ${decision.toLowerCase()}.`, acts, { description: 'Recorded in the audit log with your reason.' })
    onDone()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[12px] text-fg-subtle">{item.source}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[30px] font-semibold tracking-[-0.02em]">Is this the same person?</h2>
          <Chip tone="review">Review</Chip>
        </div>
        <p className="mt-1 max-w-2xl text-fg-muted">An imported referral may belong to someone who already has a record. Compare the details, then decide.</p>
      </div>

      <section aria-label="Match strength" className="relative overflow-hidden rounded-[28px] bg-teal-deep p-5 text-white dark:bg-[#05282b]">
        <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 size-60 rounded-full bg-hot/40 blur-3xl" />
        <div className="relative flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-xl font-semibold">Match strength: strong</p>
          <p className="text-sm text-white/80">
            {same} same · {close} close · 0 conflicting
          </p>
        </div>
        <ul className="relative mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {compareFields.map((f, i) => (
            <motion.li
              key={f.field}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn('rounded-[18px] px-4 py-3 text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]', f.result === 'same' ? 'bg-mist' : 'bg-amber-soft')}
            >
              <p className="text-[12px] text-ink-soft">{f.field}</p>
              <p className="font-display text-xl font-semibold">{f.result === 'same' ? 'Same' : 'Close'}</p>
            </motion.li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="overflow-hidden">
            <H2 className="border-b border-line px-6 py-4">Side by side</H2>
            <div role="region" aria-label="Side by side" tabIndex={0} className="overflow-x-auto focus-visible:outline-offset-[-3px]">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead>
                  <tr className="text-left align-bottom">
                    <th scope="col" className="w-32 py-3 pl-6 pr-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-muted">
                      Field
                    </th>
                    <th scope="col" className="px-3 py-3">
                      <span className="block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-muted">Incoming</span>
                      <span className="block font-mono text-[11.5px] font-normal text-fg-subtle">row {item.row}</span>
                    </th>
                    <th scope="col" className="px-3 py-3">
                      <span className="block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-muted">Existing record</span>
                      <span className="block font-mono text-[11.5px] font-normal text-fg-subtle">S-204118</span>
                    </th>
                    <th scope="col" className="py-3 pl-3 pr-6 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-muted">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareFields.map((f) => (
                    <tr key={f.field} className={cn('border-t border-line align-top', f.result === 'close' && 'bg-review-bg/40')}>
                      <th scope="row" className="py-3.5 pl-6 pr-3 text-left font-medium">
                        {f.field}
                      </th>
                      <td className="px-3 py-3.5 font-medium">
                        <Diff parts={f.incoming} highlight={f.result === 'close' ? 1 : -1} />
                      </td>
                      <td className="px-3 py-3.5 font-medium">
                        <Diff parts={f.existing} highlight={f.result === 'close' ? (f.field === 'Legal name' ? 0 : 1) : -1} />
                      </td>
                      <td className="py-3.5 pl-3 pr-6">
                        <span className={cn('block font-semibold', f.result === 'same' ? 'text-teal-fg' : 'text-review-fg')}>{f.result === 'same' ? 'Same' : 'Close'}</span>
                        {'why' in f && f.why && <span className="block text-[13px] text-fg-muted">{f.why}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="!bg-mist-bg p-6">
            <H2 className="text-[17px] !text-teal-fg">Why this was flagged</H2>
            <p className="mt-1.5 max-w-3xl text-sm text-teal-fg">
              A strict name match would have missed this pair and created a second chart. The duplicate check weighs date of birth, phone and insurance ID together, and treats known spelling variants as close rather than different. A name
              difference alone is a reason to look, never a reason to merge.
            </p>
          </Card>
        </div>

        <Card className="self-start p-6">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <fieldset aria-describedby={errChoice ? 'choice-err' : undefined}>
              <legend className="font-display text-[19px] font-semibold">Your decision</legend>
              <div className="mt-3 flex flex-col gap-2">
                {[
                  { id: 'same', t: 'Same person', d: 'Link to S-204118 and keep “Amina Warsame Abdi” as another name on the record.' },
                  { id: 'different', t: 'Different people', d: 'Keep both records. The flag closes with your reason.' },
                  { id: 'unsure', t: 'Not sure', d: 'Send to a supervisor with your notes.' },
                ].map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-[20px] p-3.5 ring-1 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]',
                      choice === o.id ? 'bg-hot-100 ring-2 ring-hot dark:bg-hot/15' : 'bg-surface-strong ring-line-strong/50 hover:ring-line-strong',
                    )}
                  >
                    <input type="radio" name="decision" value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id as 'same')} className="mt-1 size-4 accent-[#d3156b]" />
                    <span>
                      <span className="block font-semibold">{o.t}</span>
                      <span className="block text-[13px] text-fg-muted">{o.d}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errChoice && (
                <p id="choice-err" role="alert" className="mt-2 text-[13px] font-medium text-accent-fg">
                  {errChoice}
                </p>
              )}
            </fieldset>
            <div className="mt-4">
              <Field id="reason" label="Reason" hint="Required for every decision." error={errReason}>
                <textarea
                  id="reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-invalid={!!errReason}
                  aria-describedby={`reason-hint${errReason ? ' reason-err' : ''}`}
                  placeholder="e.g. Patient confirmed DOB and phone at the desk"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" variant="dark">
                Save decision
              </Button>
              <Button type="button" onClick={() => setReason('Patient confirmed DOB and phone at the desk')}>
                Use a common reason
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <H2>Audit trail for this item</H2>
        <div role="region" aria-label="Audit trail for this item" tabIndex={0} className="mt-4 overflow-x-auto focus-visible:outline-offset-[-3px]">
          <ol className="grid min-w-[640px] grid-cols-4">
            {[
              ['10:12', 'Imported by DS from referrals_week43.csv'],
              ['10:12', 'Flagged by duplicate check v0.3 (score 0.91)'],
              ['10:41', 'Opened by DS at Desk 4'],
              ['now', 'Waiting for your decision'],
            ].map(([t, w], i) => (
              <li key={w} className="relative flex flex-col gap-1 pr-4">
                {i < 3 && <span aria-hidden="true" className={cn('absolute left-4 right-0 top-[7px] h-0.5', i === 2 ? 'bg-teal' : 'bg-line-strong/40')} />}
                <span aria-hidden="true" className={cn('relative size-3.5 rounded-full', i === 3 ? 'bg-teal ring-2 ring-ink dark:ring-white' : 'bg-hot')} />
                <span className={cn('mt-1.5 font-mono text-[12px]', i === 3 ? 'font-semibold text-review-fg' : 'text-fg-muted')}>{t}</span>
                <span className={cn('text-sm', i === 3 && 'font-semibold text-review-fg')}>{w}</span>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </div>
  )
}

function Diff({ parts, highlight }: { parts: readonly string[]; highlight: number }) {
  return (
    <>
      {parts.map((p, i) =>
        i === highlight ? (
          <mark key={i} className="rounded-md bg-[#fce3b8] px-1 text-ink dark:bg-[#f6d39a]/30 dark:text-[#ffe7bf]">
            {p.trim()}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

function SimpleFix({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const { undoable } = useStore()
  const [opt, setOpt] = useState<string>(item.kind === 'mask' ? 'keep' : item.kind === 'missing' ? 'request' : 'suggested')
  const [date, setDate] = useState(item.kind === 'future' ? '1962-04-02' : '')
  const copy = {
    mask: {
      h: 'Confirm the masked number',
      p: 'A 9-digit number shaped like a Social Security number was found in the referral note and masked in the staged copy.',
      opts: [
        { id: 'keep', t: 'Keep it masked', d: 'Recommended. The note is saved with the number hidden.' },
        { id: 'remove', t: 'Remove the number entirely', d: 'The note is saved without the number at all.' },
      ],
    },
    missing: {
      h: 'Date of birth is missing',
      p: 'Without a date of birth the record can’t be matched safely, so the row is held.',
      opts: [
        { id: 'request', t: 'Ask the referring office', d: 'Caravan sends a request. The row stays held until they reply.' },
        { id: 'enter', t: 'Enter it now', d: 'Only if the patient or the referral confirms it.' },
      ],
    },
    future: {
      h: 'Date of birth is in the future',
      p: 'The referral says 04/02/2062. That’s probably a typo for 1962, but a person should confirm.',
      opts: [
        { id: 'suggested', t: 'Use 04/02/1962', d: 'Matches his existing record S-511876.' },
        { id: 'enter', t: 'Enter a different date', d: 'If 1962 isn’t right either.' },
      ],
    },
    duplicate: { h: '', p: '', opts: [] },
  }[item.kind]
  const save = () => {
    const decision =
      item.kind === 'mask'
        ? opt === 'keep'
          ? 'Kept masked'
          : 'Number removed'
        : item.kind === 'missing'
          ? opt === 'request'
            ? 'Asked the referring office'
            : `DOB entered: ${isoToUS(date)}`
          : `DOB corrected to ${opt === 'suggested' ? '04/02/1962' : isoToUS(date)}`
    const ready = !(item.kind === 'missing' && opt === 'request')
    undoable(`Saved: ${decision.toLowerCase()}.`, [
      { type: 'queue', id: item.id, patch: { status: 'resolved', decision } },
      { type: 'row', row: item.row, patch: ready ? { status: 'ready', finding: `${decision}. Ready to commit.` } : { requested: true } },
      {
        type: 'audit',
        entry: {
          type: item.kind === 'mask' ? 'check' : 'import',
          what: `${item.title} for ${item.who} (row ${item.row}): ${decision.toLowerCase()}`,
          who: 'DS',
          reason: item.kind === 'mask' ? 'ID numbers aren’t kept in notes' : 'Confirmed against the referral',
          where: 'Review queue',
        },
      },
    ])
    onDone()
  }
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[12px] text-fg-subtle">{item.source}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[30px] font-semibold tracking-[-0.02em]">{copy.h}</h2>
          <Chip tone={item.kind === 'mask' ? 'review' : 'held'}>{item.kind === 'mask' ? 'Review' : 'Held'}</Chip>
        </div>
        <p className="mt-1 max-w-2xl text-fg-muted">
          <strong className="text-fg">{item.who}.</strong> {copy.p}
        </p>
      </div>
      {item.kind === 'mask' && (
        <Card className="p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Referral note (staged copy)</p>
          <p className="mt-2 max-w-2xl font-mono text-[14px] leading-relaxed">
            Pt referred for imaging of L knee after fall on 10/18. SSN <mark className="rounded-md bg-ink px-1.5 py-0.5 text-white dark:bg-white dark:text-ink">•••-••-4821</mark> on file per pt. Please call daughter (507) 555-0139 with
            results.
          </p>
        </Card>
      )}
      <Card className="max-w-2xl p-6">
        <fieldset>
          <legend className="font-display text-[19px] font-semibold">Your decision</legend>
          <div className="mt-3 flex flex-col gap-2">
            {copy.opts.map((o) => (
              <label
                key={o.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-[20px] p-3.5 ring-1 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]',
                  opt === o.id ? 'bg-hot-100 ring-2 ring-hot dark:bg-hot/15' : 'bg-surface-strong ring-line-strong/50',
                )}
              >
                <input type="radio" name="fix" checked={opt === o.id} onChange={() => setOpt(o.id)} className="mt-1 size-4 accent-[#d3156b]" />
                <span>
                  <span className="block font-semibold">{o.t}</span>
                  <span className="block text-[13px] text-fg-muted">{o.d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <AnimatePresence initial={false}>
          {opt === 'enter' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 max-w-xs">
                <Field id="dob" label="Date of birth">
                  <input id="dob" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-5">
          <Button variant="dark" disabled={opt === 'enter' && !date} onClick={save}>
            Save decision
          </Button>
        </div>
      </Card>
    </div>
  )
}
