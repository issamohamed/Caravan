import { AnimatePresence, motion } from 'motion/react'
import { HandHelping, Phone, Smartphone, Type } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../shared/util'
import type { PhoneCheckin } from '../data'
import { useStore } from '../store'
import { Button, Card, Chip, Dot, H2, PageHeader, Segmented, SidePanel } from '../ui'

type F = 'all' | 'help' | 'checked' | 'progress'

export function PhoneCheckins({ focus }: { focus?: string }) {
  const { s, dispatch, log } = useStore()
  const [filter, setFilter] = useState<F>('all')
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => {
    if (focus && s.phone.some((p) => p.id === focus)) setOpen(focus)
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const order: Record<PhoneCheckin['state'], number> = { help: 0, going: 1, progress: 2, checked: 3, idle: 4 }
  const list = [...s.phone].filter((p) => (filter === 'all' ? true : filter === 'help' ? p.state === 'help' || p.state === 'going' : p.state === filter)).sort((a, b) => order[a.state] - order[b.state])
  const count = (st: PhoneCheckin['state'][]) => s.phone.filter((p) => st.includes(p.state)).length
  const current = s.phone.find((p) => p.id === open)

  const going = (p: PhoneCheckin) => {
    dispatch({ type: 'phone', id: p.id, patch: { state: 'going', note: 'DS is walking over.' } })
    log('phone', `Answered a help request from ${p.name}`, 'Walked over to help')
    toast.success(`Thanks. ${p.name} can see that you’re on your way.`)
  }
  const helped = (p: PhoneCheckin) => {
    dispatch({ type: 'phone', id: p.id, patch: { state: 'progress', note: `Helped at the desk. Back on question ${p.q}.` } })
    log('phone', `Finished helping ${p.name}`, 'Patient continued on phone')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Family Medicine · Desk 2 and Desk 4"
        title="Phone check-ins"
        description="Patients check in on their own phones. You see where each one is, the wording they chose, and who needs a hand."
        actions={
          <span className="glass-pill inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] text-teal-fg">
            <Dot pulse={s.live} /> Connected to scheduling · FHIR R4 sandbox
          </span>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Filter phone check-ins"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: s.phone.length },
            { id: 'help', label: 'Needs help', count: count(['help', 'going']) },
            { id: 'progress', label: 'In progress', count: count(['progress']) },
            { id: 'checked', label: 'Checked in', count: count(['checked']) },
          ]}
        />
        <p className="text-[13px] text-fg-muted">{s.live ? 'Updating live. New check-ins appear on their own.' : 'Live updates paused.'}</p>
      </div>

      <motion.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <AnimatePresence initial={false}>
          {list.map((p) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 34 }}>
              <article className={cn('glass flex h-full flex-col gap-3 rounded-[26px] p-5', p.state === 'help' && '!border-2 !border-hot', p.state === 'going' && '!border-2 !border-teal')}>
                <div className="flex items-center justify-between gap-2">
                  {p.state === 'help' && (
                    <Chip tone="accent" className="animate-pulse-ring">
                      <HandHelping size={13} aria-hidden="true" /> Needs help
                    </Chip>
                  )}
                  {p.state === 'going' && <Chip tone="done">Staff on the way</Chip>}
                  {p.state === 'checked' && <Chip tone="done">Checked in · {p.at}</Chip>}
                  {p.state === 'progress' && <Chip tone="note">In progress · question {p.q} of 5</Chip>}
                  {p.state === 'idle' && <Chip tone="neutral">Not started</Chip>}
                  {p.number && <span className="font-mono text-[12px] text-fg-subtle">#{p.number}</span>}
                </div>
                <div>
                  <h3 className="font-display text-[19px] font-semibold tracking-[-0.01em]">{p.name}</h3>
                  <p className="text-[13px] text-fg-muted">
                    {p.time} · {p.provider}
                  </p>
                </div>
                <p className={cn('text-sm', p.note.includes('change') || p.note.includes('nurse') ? 'rounded-2xl bg-review-bg px-3 py-2 text-review-fg' : 'text-fg-muted')}>{p.note}</p>
                {(p.state === 'progress' || p.state === 'help' || p.state === 'going') && (
                  <div className="grid grid-cols-5 gap-1" aria-label={`Question ${p.q} of 5`} role="img">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="h-1.5 overflow-hidden rounded-full bg-surface-sunk ring-1 ring-inset ring-line">
                        <motion.span className={cn('block h-full rounded-full', i < p.q ? 'bg-hot' : i === p.q ? 'bg-teal dark:bg-teal-300' : '')} initial={false} animate={{ width: i <= p.q ? '100%' : '0%' }} />
                      </span>
                    ))}
                  </div>
                )}
                {p.state !== 'idle' && (
                  <div className="flex flex-wrap gap-1.5">
                    <Chip tone="info">{p.wording === 'simple' ? 'Simple words' : 'Medical terms'}</Chip>
                    {p.large && (
                      <Chip tone="info">
                        <Type size={12} aria-hidden="true" /> Large text
                      </Chip>
                    )}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {p.state === 'help' && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => going(p)} className="flex-1">
                        I’m going
                      </Button>
                      <Button size="sm" icon={<Phone size={14} aria-hidden="true" />} onClick={() => toast(`Calling ${p.name}… (demo)`)}>
                        Call
                      </Button>
                    </>
                  )}
                  {p.state === 'going' && (
                    <Button size="sm" variant="teal" onClick={() => helped(p)} className="flex-1">
                      Mark helped
                    </Button>
                  )}
                  {(p.state === 'checked' || p.state === 'progress') && (
                    <Button size="sm" onClick={() => setOpen(p.id)} className="flex-1">
                      {p.state === 'checked' ? 'Open answers' : 'See answers so far'}
                    </Button>
                  )}
                  {p.state === 'idle' && <p className="text-[13px] text-fg-subtle">Expect them at the counter.</p>}
                </div>
              </article>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <Card className="p-6">
        <H2>How a phone check-in reaches this screen</H2>
        <div role="region" aria-label="How a phone check-in reaches this screen" tabIndex={0} className="mt-4 overflow-x-auto focus-visible:outline-offset-[-3px]">
          <ol className="grid min-w-[820px] grid-cols-4 gap-3">
            {[
              { t: 'Patient taps “I’m at the clinic”', d: 'The phone’s location is a hint, never a requirement.', r: 'Appointment.status = arrived' },
              { t: 'Answers are saved to the visit', d: 'Each answer is written as it’s given, so help requests show the exact question.', r: 'QuestionnaireResponse' },
              { t: 'Help requests go to a desk', d: 'The nearest free desk gets it first. Anyone can pick it up.', r: 'Communication' },
              { t: 'It shows up here', d: 'With the patient’s wording choice, so staff can match it when they talk.', r: 'Subscription → web app', dark: true },
            ].map((x, i) => (
              <li key={x.t} className={cn('flex flex-col gap-2 rounded-[20px] p-4', x.dark ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'bg-surface-strong ring-1 ring-line')}>
                <span className={cn('font-display text-2xl font-semibold', x.dark ? 'text-hot-200 dark:text-hot' : 'text-accent-fg')}>{i + 1}</span>
                <span className="font-semibold">{x.t}</span>
                <span className={cn('text-[13px]', x.dark ? 'text-white/75 dark:text-ink/70' : 'text-fg-muted')}>{x.d}</span>
                <span className={cn('mt-auto self-start rounded-full px-2.5 py-1 font-mono text-[11px]', x.dark ? 'bg-white/15 dark:bg-ink/10' : 'bg-surface-solid text-accent-fg ring-1 ring-line')}>{x.r}</span>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <SidePanel
        open={!!current}
        onOpenChange={(o) => !o && setOpen(null)}
        title={current ? `${current.name}` : ''}
        description={current ? `${current.time} · ${current.provider} · ${current.state === 'checked' ? `checked in at ${current.at}` : 'in progress'}` : undefined}
        footer={
          <>
            <Button onClick={() => setOpen(null)}>Close</Button>
            <Button variant="dark" onClick={() => toast.success('Sent to the nurse’s worklist. (demo)')}>
              Send to nurse
            </Button>
          </>
        }
      >
        {current && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="info">
                <Smartphone size={12} aria-hidden="true" /> Phone check-in
              </Chip>
              <Chip tone="info">{current.wording === 'simple' ? 'Simple words' : 'Medical terms'}</Chip>
              {current.number && <Chip tone="done">#{current.number}</Chip>}
            </div>
            <dl className="divide-y divide-line overflow-hidden rounded-[20px] ring-1 ring-line">
              {current.answers.length ? (
                current.answers.map((a) => (
                  <div key={a.label} className={cn('px-4 py-3', a.flag && 'bg-review-bg/60')}>
                    <dt className="text-[12px] text-fg-muted">{a.label}</dt>
                    <dd className="mt-0.5 font-medium">{a.value}</dd>
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-fg-muted">No answers yet.</p>
              )}
            </dl>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Saved to the visit as</p>
              <pre tabIndex={0} aria-label="QuestionnaireResponse as JSON" className="mt-2 overflow-x-auto rounded-[18px] bg-ink p-4 font-mono text-[12px] leading-relaxed text-white/90 dark:bg-black/40">
                {JSON.stringify(
                  {
                    resourceType: 'QuestionnaireResponse',
                    status: current.state === 'checked' ? 'completed' : 'in-progress',
                    questionnaire: 'Questionnaire/return-visit|4',
                    subject: { display: current.name },
                    item: current.answers.map((a, i) => ({ linkId: `q${i + 1}`, text: a.label, answer: [{ valueString: a.value }] })),
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
