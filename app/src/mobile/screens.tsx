import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Building2, Camera, Check, CircleHelp, Clock, CreditCard, Heart, Lock, MapPin, Mic, Minus, Plus, Stethoscope, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../shared/util'
import { patient, questions, type Wording } from './content'
import { useCheckin } from './ctx'
import { questionNumber, type Screen } from './state'
import { Callout, Choices, Progress, Seg, WordingToggle } from './ui'

/* ---------- shared question frame ---------- */
function QuestionFrame({ screen, title, sub, children, lead }: { screen: Screen; title: string; sub?: string; children: React.ReactNode; lead?: React.ReactNode }) {
  const { s, dispatch, now } = useCheckin()
  const n = questionNumber(screen) ?? 1
  return (
    <div className="flex flex-col gap-4">
      <Progress n={n} />
      <WordingToggle value={s.wording} onChange={(w) => dispatch({ type: 'wording', wording: w, at: now() })} />
      <div>
        {lead}
        <h1 id="q-title" tabIndex={-1} className="text-[1.9rem] font-bold leading-[1.18] tracking-[-0.01em] text-ink focus:outline-none">
          {title}
        </h1>
        {sub && <p className="mt-2 text-[1.15rem] leading-snug text-fg-muted">{sub}</p>}
      </div>
      {children}
      <Nudge />
    </div>
  )
}

function Nudge() {
  const { s } = useCheckin()
  return (
    <AnimatePresence>
      {s.nudge > 0 && (
        <motion.p
          key={s.nudge}
          role="alert"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[1.1rem] bg-ink px-4 py-3 text-[1.08rem] font-bold leading-snug text-white"
        >
          Please choose an answer above, or tap “Get help from the desk”.
        </motion.p>
      )}
    </AnimatePresence>
  )
}

const t = (w: Wording, q: { simple: { title: string; sub: string }; medical: { title: string; sub: string } }) => q[w]

/* ---------- Arrival ---------- */
export function Arrival() {
  const { dispatch, now } = useCheckin()
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 tabIndex={-1} className="text-[2.15rem] font-bold leading-[1.12] tracking-[-0.01em] focus:outline-none">
          {greet}, {patient.first}
        </h1>
        <p className="mt-2 text-[1.25rem] leading-snug text-fg-muted">Let’s get you checked in for today’s visit.</p>
      </div>
      <section aria-label="Your visit" className="glass flex flex-col gap-3.5 rounded-[1.6rem] p-5 [.hc_&]:border-2 [.hc_&]:border-ink">
        {[
          { icon: <Clock size={22} strokeWidth={2.2} />, text: <span className="text-[1.5rem] font-bold">Today at {patient.visitTime}</span> },
          { icon: <Stethoscope size={22} strokeWidth={2.2} />, text: <span className="text-[1.22rem]">{patient.provider}</span> },
          { icon: <Building2 size={22} strokeWidth={2.2} />, text: <span className="text-[1.22rem]">{patient.place}</span> },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-hot-100 text-hot-700">
              {r.icon}
            </span>
            {r.text}
          </div>
        ))}
      </section>
      <Callout tone="teal" icon={<MapPin size={22} strokeWidth={2.2} />}>
        Your phone shows you’re at the clinic.
      </Callout>
      <p className="text-center text-[1.12rem] text-fg-muted">5 short questions · about 3 minutes</p>
      <button onClick={() => dispatch({ type: 'go', screen: 'desk', at: now() })} className="mx-auto min-h-12 px-3 text-[1.15rem] font-bold text-accent-fg underline decoration-2 underline-offset-4 hover:text-hot-800">
        I’d rather check in at the desk
      </button>
    </div>
  )
}

/* ---------- Q1 Contact ---------- */
export function Contact() {
  const { s, dispatch } = useCheckin()
  const q = questions.contact
  const copy = t(s.wording, q)
  return (
    <QuestionFrame screen="contact" title={copy.title} sub={copy.sub}>
      <dl className="glass grid gap-3 rounded-[1.4rem] p-4 text-[1.15rem] [.hc_&]:border-2 [.hc_&]:border-ink">
        <div>
          <dt className="text-[1rem] font-bold text-fg-muted">Phone</dt>
          <dd className="mt-0.5 font-bold tabular">{patient.phone}</dd>
        </div>
        <div>
          <dt className="text-[1rem] font-bold text-fg-muted">Address</dt>
          <dd className="mt-0.5 font-bold">{patient.address}</dd>
        </div>
      </dl>
      <Choices name="contact" labelledBy="q-title" choices={q.choices} value={s.answers.contact} onChange={(v) => dispatch({ type: 'answer', patch: { contact: v as 'same' | 'changed' } })} wording={s.wording} />
      <AnimatePresence initial={false}>
        {s.answers.contact === 'changed' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <label htmlFor="contact-note" className="block text-[1.1rem] font-bold">
              What changed? <span className="font-normal text-fg-muted">(optional)</span>
            </label>
            <textarea
              id="contact-note"
              rows={2}
              value={s.answers.contactNote}
              onChange={(e) => dispatch({ type: 'answer', patch: { contactNote: e.target.value } })}
              placeholder="New phone number…"
              className="mt-2 w-full rounded-[1.1rem] border-2 border-[#8c5560] bg-white/85 px-4 py-3 text-[1.15rem] placeholder:text-[#7a5e64] focus:border-hot-700"
            />
            <p className="mt-2 text-[1.02rem] text-fg-muted">The desk will update it with you. You don’t need to type it all.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionFrame>
  )
}

/* ---------- Q2 Medicines: decides the wording ---------- */
export function Meds() {
  const { s, dispatch } = useCheckin()
  const q = questions.meds
  const copy = t(s.wording, q)
  const icon = (bg: string, fg: string, el: React.ReactNode) => (
    <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-full', bg, fg)}>
      {el}
    </span>
  )
  const picked = s.answers.meds
  const willBe: Wording | null = picked ? (s.wordingBy === 'patient' ? s.wording : picked === 'yes' ? 'medical' : 'simple') : null
  return (
    <QuestionFrame screen="meds" title={copy.title} sub={copy.sub}>
      <Choices
        name="meds"
        labelledBy="q-title"
        choices={q.choices}
        value={picked}
        onChange={(v) => dispatch({ type: 'answer', patch: { meds: v as 'yes' } })}
        wording={s.wording}
        icons={{
          yes: icon(picked === 'yes' ? 'bg-teal' : 'bg-mist', picked === 'yes' ? 'text-white' : 'text-teal-700', <Check size={21} strokeWidth={3} />),
          some: icon(picked === 'some' ? 'bg-[#c98a14]' : 'bg-amber-soft', picked === 'some' ? 'text-white' : 'text-amber-ink', <Minus size={21} strokeWidth={3} />),
          no: icon(picked === 'no' ? 'bg-hot-700' : 'bg-hot-100', picked === 'no' ? 'text-white' : 'text-hot-700', <CircleHelp size={21} strokeWidth={2.6} />),
          none: icon(picked === 'none' ? 'bg-ink' : 'bg-[#efe3e6]', picked === 'none' ? 'text-white' : 'text-ink-soft', <X size={21} strokeWidth={3} />),
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {picked && picked !== 'none' && willBe && (
          <motion.div key={willBe} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <Callout tone="white" live>
              <strong>Next:</strong> {willBe === 'medical' ? 'we’ll show your medication list from your record.' : 'one short question in simple words.'} <span className="text-fg-muted">You can switch wording any time.</span>
            </Callout>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionFrame>
  )
}

/* ---------- Q3a Simple: pill bottles ---------- */
export function Brought() {
  const { s, dispatch } = useCheckin()
  const q = questions.brought
  const reassure: Record<string, string> = {
    yes: 'Great. Keep them handy, and the nurse will look at them with you.',
    no: 'That’s fine. The nurse will go over your medicines with you.',
    someone: 'Good. Ask them to come in with you when your name is called.',
  }
  const v = s.answers.brought
  return (
    <QuestionFrame screen="brought" title={q.simple.title} lead={s.answers.meds && s.answers.meds !== 'yes' ? <p className="mb-1 text-[1.3rem] font-bold text-teal-700">That’s okay.</p> : null}>
      <Choices name="brought" labelledBy="q-title" choices={q.choices} value={v} onChange={(x) => dispatch({ type: 'answer', patch: { brought: x as 'yes' } })} wording="simple" />
      <AnimatePresence mode="wait" initial={false}>
        {v && (
          <motion.div key={v} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Callout tone="teal" icon={<Heart size={21} strokeWidth={2.4} />} live>
              {reassure[v]}
            </Callout>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionFrame>
  )
}

/* ---------- Q3b Medical: medication list ---------- */
export function MedList() {
  const { s, dispatch, setSheet } = useCheckin()
  const copy = t(s.wording, questions.medlist)
  const a = s.answers
  return (
    <QuestionFrame screen="medlist" title={copy.title} sub={copy.sub}>
      <ul className="flex flex-col gap-3">
        {a.medList.map((m) => {
          const st = a.medStatus[m.id] ?? 'taking'
          return (
            <motion.li
              layout
              key={m.id}
              initial={m.added ? { opacity: 0, scale: 0.96 } : false}
              animate={{ opacity: 1, scale: 1 }}
              className={cn('glass rounded-[1.4rem] p-4 [.hc_&]:border-2 [.hc_&]:border-ink', st !== 'taking' && '!border-2 !border-[#e8b867]')}
            >
              <p className="text-[1.25rem] font-bold leading-tight">
                {m.name} <span className="font-normal text-fg-muted">{m.dose}</span>
              </p>
              <p className="mt-1 text-[1.05rem] text-fg-muted">{m.sig[s.wording]}</p>
              <div className="mt-3">
                <Seg
                  label={`${m.name} status`}
                  value={st}
                  onChange={(v) => dispatch({ type: 'answer', patch: { medStatus: { ...a.medStatus, [m.id]: v } } })}
                  options={[
                    { id: 'taking', label: 'Taking' },
                    { id: 'stopped', label: 'Stopped' },
                    { id: 'changed', label: 'Changed' },
                  ]}
                />
              </div>
              {st === 'changed' && (
                <div className="mt-3">
                  <label htmlFor={`chg-${m.id}`} className="text-[1rem] font-bold">
                    What changed?
                  </label>
                  <input
                    id={`chg-${m.id}`}
                    value={a.medChange[m.id] ?? ''}
                    onChange={(e) => dispatch({ type: 'answer', patch: { medChange: { ...a.medChange, [m.id]: e.target.value } } })}
                    placeholder="e.g. now 20 mg"
                    className="mt-1.5 w-full rounded-full border-2 border-[#8c5560] bg-white/90 px-4 py-2.5 text-[1.1rem] placeholder:text-[#7a5e64] focus:border-hot-700"
                  />
                </div>
              )}
              {st === 'stopped' && <p className="mt-3 rounded-full bg-amber-soft px-4 py-2 text-[1rem] text-amber-ink">Your nurse will ask about this change.</p>}
            </motion.li>
          )
        })}
      </ul>
      <button onClick={() => setSheet('addMed')} className="glass-pill flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-hot text-[1.15rem] font-bold text-hot-700 hover:bg-white/80">
        <Plus size={20} strokeWidth={2.8} aria-hidden="true" /> Add a medicine
      </button>
    </QuestionFrame>
  )
}

/* ---------- Q4 Reason ---------- */
export function Reason() {
  const { s, dispatch, say } = useCheckin()
  const q = questions.reason
  const copy = t(s.wording, q)
  const [listening, setListening] = useState(false)
  useEffect(() => {
    if (!listening) return
    const id = window.setTimeout(() => {
      dispatch({ type: 'answer', patch: { reason: 'other', reasonText: 'My knee has been sore for about two weeks.' } })
      setListening(false)
      say('Got it. You can edit what we heard.')
    }, 2200)
    return () => window.clearTimeout(id)
  }, [listening, dispatch, say])
  return (
    <QuestionFrame screen="reason" title={copy.title} sub={copy.sub}>
      <Choices name="reason" labelledBy="q-title" columns={2} choices={q.choices} value={s.answers.reason} onChange={(v) => dispatch({ type: 'answer', patch: { reason: v } })} wording={s.wording} />
      <button
        onClick={() => setListening(true)}
        disabled={listening}
        aria-live="polite"
        className={cn(
          'flex min-h-14 items-center justify-center gap-2.5 rounded-full border-2 text-[1.15rem] font-bold transition-colors',
          listening ? 'border-teal bg-teal text-white' : 'glass-pill border-teal-700 text-teal-700 hover:bg-white/80',
        )}
      >
        <Mic size={21} strokeWidth={2.4} aria-hidden="true" className={listening ? 'animate-live-dot' : ''} />
        {listening ? 'Listening… go ahead and talk' : 'Say it instead'}
      </button>
      <AnimatePresence initial={false}>
        {s.answers.reason === 'other' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <label htmlFor="reason-text" className="block text-[1.1rem] font-bold">
              Tell us in your own words
            </label>
            <textarea
              id="reason-text"
              rows={3}
              value={s.answers.reasonText}
              onChange={(e) => dispatch({ type: 'answer', patch: { reasonText: e.target.value } })}
              className="mt-2 w-full rounded-[1.1rem] border-2 border-[#8c5560] bg-white/90 px-4 py-3 text-[1.15rem] focus:border-hot-700"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionFrame>
  )
}

/* ---------- Q5 Insurance ---------- */
export function Insurance() {
  const { s, dispatch, setSheet } = useCheckin()
  const q = questions.insurance
  const copy = t(s.wording, q)
  const v = s.answers.insurance
  return (
    <QuestionFrame screen="insurance" title={copy.title}>
      <div aria-label="Card on file" role="img" className="relative overflow-hidden rounded-[1.4rem] bg-teal-deep p-5 text-white shadow-[0_22px_40px_-22px_rgb(6_41_44/0.9)]">
        <span aria-hidden="true" className="absolute -right-10 -top-12 size-44 rounded-full border-[18px] border-white/10" />
        <span aria-hidden="true" className="absolute -bottom-16 right-10 size-36 rounded-full bg-hot/30 blur-2xl" />
        <p className="relative text-[1rem] font-bold text-teal-300">Card on file</p>
        <p className="relative mt-1 text-[1.35rem] font-bold">{patient.plan}</p>
        <div className="relative mt-5 flex items-end justify-between">
          <p className="text-[1.05rem]">
            Member ID ending <span className="font-mono text-[1.15rem] tracking-wider">{patient.memberEnd}</span>
          </p>
          <CreditCard size={28} aria-hidden="true" className="text-white/70" />
        </div>
      </div>
      <Choices name="insurance" labelledBy="q-title" choices={q.choices} value={v} onChange={(x) => dispatch({ type: 'answer', patch: { insurance: x as 'same' } })} wording={s.wording} />
      <AnimatePresence mode="wait" initial={false}>
        {v === 'new' && (
          <motion.div key="new" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {s.answers.cardPhoto ? (
              <Callout tone="teal" icon={<Check size={22} strokeWidth={3} />}>
                Photo of your new card added.{' '}
                <button onClick={() => setSheet('camera')} className="font-bold underline underline-offset-4">
                  Retake
                </button>
              </Callout>
            ) : (
              <button onClick={() => setSheet('camera')} className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-teal-deep text-[1.15rem] font-bold text-white shadow-solid hover:bg-teal-700">
                <Camera size={21} aria-hidden="true" /> Take a photo of the new card
              </button>
            )}
            <p className="mt-2 text-center text-[1.02rem] text-fg-muted">Or skip this. The desk can scan it.</p>
          </motion.div>
        )}
        {v === 'none' && (
          <motion.div key="none" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Callout tone="white">That’s okay. The desk will talk with you about payment options. You can still be seen today.</Callout>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionFrame>
  )
}

/* ---------- Review ---------- */
export function Review() {
  const { s, dispatch } = useCheckin()
  const a = s.answers
  const w = s.wording
  const medsSummary = () => {
    if (a.meds === 'none') return w === 'simple' ? 'I don’t take any' : 'No current medications'
    if (s.wording === 'medical' && a.meds === 'yes') {
      const ch = a.medList.filter((m) => (a.medStatus[m.id] ?? 'taking') !== 'taking')
      return ch.length ? ch.map((m) => `${m.name}: ${a.medStatus[m.id]}`).join(', ') : `${a.medList.length} medicines, no changes`
    }
    return questions.brought.choices.find((c) => c.id === a.brought)?.simple ?? 'Not answered'
  }
  const reason = a.reason === 'other' ? a.reasonText || 'Something else' : (questions.reason.choices.find((c) => c.id === a.reason)?.[w] ?? 'Not answered')
  const rows: { label: string; value: string; screen: Screen }[] = [
    { label: 'Phone and address', value: a.contact === 'changed' ? 'Something changed' : a.contact === 'same' ? 'No changes' : 'Not answered', screen: 'contact' },
    { label: 'Medicines', value: medsSummary(), screen: 'meds' },
    { label: 'Reason for visit', value: reason, screen: 'reason' },
    {
      label: 'Insurance card',
      value: a.insurance === 'new' ? (a.cardPhoto ? 'New card · photo added' : 'New card') : a.insurance === 'none' ? 'No insurance now' : a.insurance === 'same' ? 'Same card as before' : 'Not answered',
      screen: 'insurance',
    },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[1.05rem] font-bold text-fg-muted">Last step</p>
        <h1 tabIndex={-1} className="mt-1 text-[2rem] font-bold leading-tight focus:outline-none">
          Check your answers
        </h1>
        <p className="mt-1.5 text-[1.15rem] text-fg-muted">Tap Change to fix anything.</p>
      </div>
      <dl className="glass overflow-hidden rounded-[1.6rem] [.hc_&]:border-2 [.hc_&]:border-ink">
        {rows.map((r, i) => (
          <div key={r.label} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-3 pl-5 pr-3', i > 0 && 'border-t-2 border-white/70 [.hc_&]:border-ink/30')}>
            <dt className="col-start-1 text-[1rem] text-fg-muted">{r.label}</dt>
            <dd className="col-start-1 mt-0.5 text-[1.2rem] font-bold leading-snug">{r.value}</dd>
            <dd className="col-start-2 row-span-2 row-start-1">
              <button
                onClick={() => dispatch({ type: 'editFromReview', screen: r.screen })}
                className="min-h-12 shrink-0 rounded-full border-2 border-[#8c5560] bg-white/70 px-4 text-[1.02rem] font-bold hover:bg-white"
                aria-label={`Change ${r.label.toLowerCase()}`}
              >
                Change
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[1.05rem] text-fg-muted">
        Wording used: <strong className="text-ink">{w === 'simple' ? 'Simple words' : 'Medical terms'}</strong>
      </p>
      <Callout tone="pink" icon={<Lock size={21} strokeWidth={2.4} />}>
        Only your care team at Family Medicine sees these answers.
      </Callout>
    </div>
  )
}

/* ---------- Done ---------- */
export function Done() {
  const { s } = useCheckin()
  return (
    <div className="flex flex-col items-stretch gap-5 pt-3 text-center">
      <motion.span
        aria-hidden="true"
        className="mx-auto grid size-28 place-items-center rounded-full bg-teal shadow-[0_0_0_12px_rgb(210_238_239/0.9)]"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5 }} />
        </svg>
      </motion.span>
      <div>
        <h1 tabIndex={-1} className="text-[2.3rem] font-bold leading-[1.1] tracking-[-0.01em] focus:outline-none">
          You’re checked in.
        </h1>
        <p className="mt-2.5 text-[1.25rem] leading-snug text-fg-muted">Please have a seat. A nurse will call you by name.</p>
      </div>
      <section aria-label="Your check-in number" className="glass rounded-[1.6rem] px-5 py-4 [.hc_&]:border-2 [.hc_&]:border-ink">
        <p className="text-[1.1rem] font-bold text-fg-muted">Your check-in number</p>
        <p className="mt-1 font-read text-[4rem] font-bold leading-none tracking-[0.06em] tabular">{patient.checkinNo}</p>
        <p className="mt-2 text-[1.08rem] text-fg-muted">If anyone at the desk asks, show them this number.</p>
      </section>
      <p className="flex items-start justify-center gap-2 text-left text-[1.1rem] leading-snug text-teal-700">
        <Check size={22} strokeWidth={3} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>
          Sent to the Family Medicine front desk at {s.sentAt ? s.sentAt.replace(/:\d{2}(?=\s?[AP]M)/, '') : 'just now'}. Your visit is at {patient.visitTime} with Dr. Patel.
        </span>
      </p>
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="rounded-[1.3rem] bg-white/70 p-4 [.hc_&]:border-2 [.hc_&]:border-ink">
          <p className="text-[1rem] font-bold">Restroom</p>
          <p className="mt-1 text-[1rem] text-fg-muted">Past the elevators, on the left.</p>
        </div>
        <div className="rounded-[1.3rem] bg-white/70 p-4 [.hc_&]:border-2 [.hc_&]:border-ink">
          <p className="text-[1rem] font-bold">Feeling unwell?</p>
          <p className="mt-1 text-[1rem] text-fg-muted">Tap Get help. Someone will come to you.</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- Desk instead ---------- */
export function DeskInstead() {
  const { dispatch, now } = useCheckin()
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <h1 tabIndex={-1} className="text-[2.15rem] font-bold leading-tight focus:outline-none">
          No problem.
        </h1>
        <p className="mt-2 text-[1.25rem] leading-snug text-fg-muted">Head to the front desk and show them this screen. They already have your appointment.</p>
      </div>
      <section aria-label="Show this at the desk" className="rounded-[1.8rem] bg-teal-deep p-6 text-white shadow-[0_24px_44px_-22px_rgb(6_41_44/0.9)]">
        <p className="text-[1.05rem] font-bold text-teal-300">Front desk check-in</p>
        <p className="mt-2 text-[1.8rem] font-bold leading-tight">{patient.full}</p>
        <p className="mt-1 text-[1.15rem] text-white/80">
          {patient.visitTime} · {patient.provider}
        </p>
        <div className="mt-5 flex items-end justify-between border-t border-white/20 pt-4">
          <div>
            <p className="text-[1rem] text-white/70">Desk code</p>
            <p className="font-mono text-[2.4rem] font-medium leading-none tracking-[0.1em]">D-{patient.checkinNo}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[0.95rem] font-bold">2nd floor</span>
        </div>
      </section>
      <Callout tone="teal">We let the desk know you’re on your way. Take your time.</Callout>
      <button onClick={() => dispatch({ type: 'back' })} className="mx-auto min-h-12 px-3 text-[1.15rem] font-bold text-accent-fg underline decoration-2 underline-offset-4">
        Actually, I’ll try my phone
      </button>
      <span className="sr-only">{now()}</span>
    </div>
  )
}

export function NextLabel({ editing }: { editing: boolean }) {
  return (
    <>
      {editing ? 'Save and go back' : 'Next'}
      <ArrowRight size={22} strokeWidth={2.6} aria-hidden="true" />
    </>
  )
}
