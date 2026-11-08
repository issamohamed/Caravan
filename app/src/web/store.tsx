import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import { fmtClock24, makeDemoClock } from '../shared/util'
import {
  arrivals as seedArrivals,
  auditSeed,
  fieldMap as seedFieldMap,
  importRows as seedRows,
  phoneCheckins as seedPhone,
  questionSets as seedSets,
  queue as seedQueue,
  routines as seedRoutines,
  type Arrival,
  type AuditEntry,
  type AuditType,
  type ImportRow,
  type PhoneCheckin,
  type QItem,
  type QSet,
  type QueueItem,
  type Routine,
  type RoutineStep,
  type StepState,
} from './data'

export const clock = makeDemoClock(10, 41, 0)
export const nowHM = () => fmtClock24(clock())

export type ImportState = {
  file: string
  at: string
  stage: 'review' | 'committed'
  rows: ImportRow[]
  map: { source: string; target: string; rule: string; sensitive?: boolean }[]
  mapDirty: boolean
  recent: { file: string; meta: string; status: 'review' | 'committed' }[]
}

export type LiveEvent = { id: number; text: string; kind: 'checked' | 'help' | 'started'; phoneId?: string }

export type WebState = {
  arrivals: Arrival[]
  selected: string
  phone: PhoneCheckin[]
  imp: ImportState
  queue: QueueItem[]
  qsets: QSet[]
  routines: Routine[]
  audit: AuditEntry[]
  live: boolean
  tick: number
  lastSync: number
  liveEvent: LiveEvent | null
}

/** The demo's starting state. Exported for the tests. */
export const initial = (): WebState => ({
  arrivals: structuredClone(seedArrivals),
  selected: 'warsame',
  phone: structuredClone(seedPhone),
  imp: {
    file: 'referrals_week43.csv',
    at: '10:12',
    stage: 'review',
    rows: structuredClone(seedRows),
    map: structuredClone(seedFieldMap),
    mapDirty: false,
    recent: [
      { file: 'referrals_week43.csv', meta: '24 rows · today 10:12', status: 'review' },
      { file: 'adt_sample_batch.hl7', meta: '9 messages · today 08:30', status: 'committed' },
      { file: 'fhir_sandbox_patients.json', meta: '12 patients · Oct 27', status: 'committed' },
    ],
  },
  queue: structuredClone(seedQueue),
  qsets: structuredClone(seedSets),
  routines: structuredClone(seedRoutines),
  audit: structuredClone(auditSeed),
  live: true,
  tick: 0,
  lastSync: Date.now(),
  liveEvent: null,
})

export type Act =
  | { type: 'replace'; state: WebState }
  | { type: 'select'; id: string }
  | { type: 'step'; id: string; step: string; state: StepState; note?: string }
  | { type: 'arrival'; id: string; patch: Partial<Arrival> }
  | { type: 'phone'; id: string; patch: Partial<PhoneCheckin> }
  | { type: 'imp'; patch: Partial<ImportState> }
  | { type: 'row'; row: number; patch: Partial<ImportRow> }
  | { type: 'queue'; id: string; patch: Partial<QueueItem> }
  | { type: 'qitem'; set: string; item: string; patch: Partial<QItem> }
  | { type: 'publish'; set: string; what: string; by: string }
  | { type: 'routine'; id: string; patch: Partial<Routine> }
  | { type: 'rstep'; id: string; step: string; patch: Partial<RoutineStep> }
  | { type: 'audit'; entry: Omit<AuditEntry, 'id' | 'time'> }
  | { type: 'live'; on: boolean }
  | { type: 'tick' }
  | { type: 'sync' }

let auditId = 2000
let liveId = 1

function addAudit(s: WebState, e: Omit<AuditEntry, 'id' | 'time'>): WebState {
  return { ...s, audit: [{ ...e, id: auditId++, time: nowHM() }, ...s.audit] }
}

/** The scripted "live" morning: a few phone check-ins move along while you watch. */
function runTick(s0: WebState): WebState {
  let s = { ...s0, tick: s0.tick + 1, lastSync: Date.now() }
  const t = s.tick
  const upd = (id: string, patch: Partial<PhoneCheckin>) => {
    s = { ...s, phone: s.phone.map((p) => (p.id === id ? { ...p, ...patch } : p)) }
  }
  const osei = s.phone.find((p) => p.id === 'osei')
  if (osei && osei.state === 'progress') {
    if (t === 1) upd('osei', { q: 4, answers: [...osei.answers, { label: 'Medicines', value: 'Brought a list' }] })
    if (t === 2) upd('osei', { q: 5, answers: [...osei.answers, { label: 'Reason for visit', value: 'A check-up' }] })
    if (t === 3) {
      upd('osei', { state: 'checked', q: 5, number: '216', at: nowHM(), note: 'Brought a medicine list for the nurse.', answers: [...osei.answers, { label: 'Insurance', value: 'Same card as before' }] })
      s = addAudit(s, { type: 'phone', what: 'Linda Osei checked in by phone (#216)', who: 'Patient', reason: '—', where: 'Phone app' })
      s.liveEvent = { id: liveId++, text: 'Linda Osei just checked in by phone (#216).', kind: 'checked', phoneId: 'osei' }
    }
  }
  if (t === 4 && !s.phone.some((p) => p.id === 'holm')) {
    s = {
      ...s,
      phone: [...s.phone, { id: 'holm', name: 'Grace Holm', time: '11:00', provider: 'Dr. Shah', state: 'progress', q: 1, wording: 'simple', note: `Started on her phone at ${nowHM()}.`, at: nowHM(), answers: [] }],
    }
    s = addAudit(s, { type: 'phone', what: 'Grace Holm started checking in by phone', who: 'Patient', reason: '—', where: 'Phone app' })
    s.liveEvent = { id: liveId++, text: 'Grace Holm started checking in on her phone.', kind: 'started', phoneId: 'holm' }
  }
  const holm = s.phone.find((p) => p.id === 'holm')
  if (holm && holm.state === 'progress' && t === 5) upd('holm', { q: 2, answers: [{ label: 'Phone and address', value: 'Something changed', flag: true }] })
  if (holm && holm.state === 'progress' && t === 7) {
    upd('holm', { state: 'help', note: 'Asked for help on question 2. Near the elevators.' })
    s = addAudit(s, { type: 'phone', what: 'Grace Holm asked for help on question 2', who: 'Patient', reason: '—', where: 'Phone app' })
    s.liveEvent = { id: liveId++, text: 'Grace Holm is asking for help on question 2.', kind: 'help', phoneId: 'holm' }
  }
  return s
}

/** Exported for the tests. */
export function reducer(s: WebState, a: Act): WebState {
  switch (a.type) {
    case 'replace':
      return a.state
    case 'select':
      return { ...s, selected: a.id }
    case 'step':
      return {
        ...s,
        arrivals: s.arrivals.map((x) => (x.id === a.id ? { ...x, steps: { ...x.steps, [a.step]: a.state }, stepNotes: a.note !== undefined ? { ...x.stepNotes, [a.step]: a.note } : x.stepNotes } : x)),
      }
    case 'arrival':
      return { ...s, arrivals: s.arrivals.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) }
    case 'phone':
      return { ...s, phone: s.phone.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) }
    case 'imp':
      return { ...s, imp: { ...s.imp, ...a.patch } }
    case 'row':
      return { ...s, imp: { ...s.imp, rows: s.imp.rows.map((r) => (r.row === a.row ? { ...r, ...a.patch } : r)) } }
    case 'queue':
      return { ...s, queue: s.queue.map((q) => (q.id === a.id ? { ...q, ...a.patch } : q)) }
    case 'qitem':
      return { ...s, qsets: s.qsets.map((q) => (q.id === a.set ? { ...q, items: q.items.map((it) => (it.id === a.item ? { ...it, ...a.patch } : it)) } : q)) }
    case 'publish':
      return {
        ...s,
        qsets: s.qsets.map((q) =>
          q.id === a.set
            ? { ...q, status: 'live', version: q.version + 1, published: 'today', by: a.by, items: q.items.map((it) => ({ ...it, edited: false })), history: [{ v: q.version + 1, when: 'Today', by: a.by, what: a.what }, ...q.history] }
            : q,
        ),
      }
    case 'routine':
      return { ...s, routines: s.routines.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)) }
    case 'rstep':
      return { ...s, routines: s.routines.map((r) => (r.id === a.id ? { ...r, steps: r.steps.map((st) => (st.id === a.step ? { ...st, ...a.patch } : st)) } : r)) }
    case 'audit':
      return addAudit(s, a.entry)
    case 'live':
      return { ...s, live: a.on }
    case 'tick':
      return runTick(s)
    case 'sync':
      return { ...s, lastSync: Date.now() }
  }
}

type StoreCtx = {
  s: WebState
  dispatch: (a: Act) => void
  /** Run a change and offer Undo in a toast. */
  undoable: (message: string, acts: Act[], opts?: { description?: string }) => void
  log: (type: AuditType, what: string, reason?: string, where?: string) => void
  go: (route: string, focus?: string) => void
}

const Ctx = createContext<StoreCtx | null>(null)

export function StoreProvider({ children, go }: { children: ReactNode; go: (route: string, focus?: string) => void }) {
  const [s, dispatch] = useReducer(reducer, undefined, initial)
  const ref = useRef(s)
  ref.current = s

  useEffect(() => {
    if (!s.live) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 9000)
    return () => window.clearInterval(id)
  }, [s.live])

  useEffect(() => {
    const e = s.liveEvent
    if (!e) return
    if (e.kind === 'help' && e.phoneId) {
      const pid = e.phoneId
      toast(e.text, {
        description: 'A staff member should go to them.',
        duration: 9000,
        action: {
          label: 'I’m going',
          onClick: () => {
            dispatch({ type: 'phone', id: pid, patch: { state: 'going', note: 'DS is walking over.' } })
            dispatch({ type: 'audit', entry: { type: 'phone', what: `Answered a help request from ${ref.current.phone.find((p) => p.id === pid)?.name}`, who: 'DS', reason: 'Walked over to help', where: 'Desk 4' } })
          },
        },
      })
    } else toast(e.text, { duration: 4500 })
  }, [s.liveEvent])

  const undoable = useCallback((message: string, acts: Act[], opts?: { description?: string }) => {
    const before = ref.current
    acts.forEach(dispatch)
    toast.success(message, {
      description: opts?.description,
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: () => {
          dispatch({ type: 'replace', state: { ...before, live: ref.current.live, tick: ref.current.tick } })
          toast('Undone.', { duration: 2200 })
        },
      },
    })
  }, [])

  const log = useCallback((type: AuditType, what: string, reason = '—', where = 'Desk 4') => dispatch({ type: 'audit', entry: { type, what, who: 'DS', reason, where } }), [])

  const value = useMemo(() => ({ s, dispatch, undoable, log, go }), [s, undoable, log, go])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}

/* ---------- derived counts used across pages ---------- */
export function useCounts() {
  const { s } = useStore()
  return useMemo(() => {
    const help = s.phone.filter((p) => p.state === 'help').length
    const reviewOpen = s.queue.filter((q) => q.status === 'open').length
    const checkedToday = 10 + s.arrivals.filter((a) => a.status === 'checked-in').length + s.phone.filter((p) => p.state === 'checked').length
    const byPhone = 4 + s.phone.filter((p) => p.state === 'checked').length
    const heldRows = s.imp.rows.filter((r) => r.status === 'held').length
    const readyRows = s.imp.rows.filter((r) => r.status === 'ready').length
    const reviewRows = s.imp.rows.filter((r) => r.status === 'review').length
    return { help, reviewOpen, checkedToday, byPhone, heldRows, readyRows, reviewRows, arrivalsToday: 42 }
  }, [s])
}
