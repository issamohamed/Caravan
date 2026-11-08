import { starterMeds, type Med, type MedStatus, type Wording } from './content'

export const SCREENS = ['arrival', 'contact', 'meds', 'brought', 'medlist', 'reason', 'insurance', 'review', 'done', 'desk', 'help'] as const
export type Route = (typeof SCREENS)[number]
export type Screen = Exclude<Route, 'help'>

export type Answers = {
  contact: 'same' | 'changed' | null
  contactNote: string
  meds: 'yes' | 'some' | 'no' | 'none' | null
  brought: 'yes' | 'no' | 'someone' | null
  medStatus: Record<string, MedStatus>
  medChange: Record<string, string>
  medList: Med[]
  reason: string | null
  reasonText: string
  insurance: 'same' | 'new' | 'none' | null
  cardPhoto: boolean
}

export type HelpMode = 'off' | 'open' | 'min'
export type DeskEvent = { id: number; at: string; kind: 'fhir' | 'help' | 'info'; text: string; resource?: string }

export type State = {
  screen: Screen
  history: Screen[]
  wording: Wording
  wordingBy: 'default' | 'answer' | 'patient'
  answers: Answers
  editingFromReview: boolean
  help: HelpMode
  helpStartedAt: number | null
  sentAt: string | null
  nudge: number
  events: DeskEvent[]
}

export const emptyAnswers = (): Answers => ({
  contact: null,
  contactNote: '',
  meds: null,
  brought: null,
  medStatus: Object.fromEntries(starterMeds.map((m) => [m.id, 'taking' as MedStatus])),
  medChange: {},
  medList: [...starterMeds],
  reason: null,
  reasonText: '',
  insurance: null,
  cardPhoto: false,
})

let eventId = 1
const ev = (at: string, kind: DeskEvent['kind'], text: string, resource?: string): DeskEvent => ({ id: eventId++, at, kind, text, resource })

export function questionNumber(s: Screen): number | null {
  return ({ contact: 1, meds: 2, brought: 3, medlist: 3, reason: 4, insurance: 5 } as Partial<Record<Screen, number>>)[s] ?? null
}

/* ---------- Presets: each per-screen file opens with believable answers already in place ---------- */
export function preset(route: Route, at: string): State {
  const base: State = {
    screen: 'arrival',
    history: [],
    wording: 'simple',
    wordingBy: 'default',
    answers: emptyAnswers(),
    editingFromReview: false,
    help: 'off',
    helpStartedAt: null,
    sentAt: null,
    nudge: 0,
    events: [ev(at, 'info', 'Visit found for today · 9:30 AM with Dr. Patel', 'Appointment/apt-0930')],
  }
  const a = base.answers
  const arrived = () => base.events.unshift(ev(at, 'fhir', 'Patient tapped “I’m at the clinic”', 'Appointment.status = arrived'))

  switch (route) {
    case 'arrival':
      return base
    case 'contact':
      arrived()
      return { ...base, screen: 'contact', history: ['arrival'] }
    case 'meds':
    case 'help':
      arrived()
      a.contact = 'same'
      base.events.unshift(ev(at, 'fhir', 'Answered question 1 · contact info unchanged', 'QuestionnaireResponse item 1'))
      if (route === 'help') base.events.unshift(ev(at, 'help', 'Help requested on question 2', 'Communication → Desk 2'))
      return { ...base, screen: 'meds', history: ['arrival', 'contact'], help: route === 'help' ? 'open' : 'off', helpStartedAt: route === 'help' ? Date.now() : null }
    case 'brought':
      arrived()
      a.contact = 'same'
      a.meds = 'some'
      return { ...base, screen: 'brought', history: ['arrival', 'contact', 'meds'], wording: 'simple', wordingBy: 'answer' }
    case 'medlist':
      arrived()
      a.contact = 'same'
      a.meds = 'yes'
      a.medStatus.ato = 'stopped'
      return { ...base, screen: 'medlist', history: ['arrival', 'contact', 'meds'], wording: 'medical', wordingBy: 'answer' }
    case 'reason':
    case 'insurance':
    case 'review':
    case 'done': {
      arrived()
      a.contact = 'same'
      a.meds = 'some'
      a.brought = 'yes'
      const hist: Screen[] = ['arrival', 'contact', 'meds', 'brought']
      if (route === 'reason') return { ...base, screen: 'reason', history: hist, wordingBy: 'answer' }
      a.reason = 'bp'
      if (route === 'insurance') return { ...base, screen: 'insurance', history: [...hist, 'reason'], wordingBy: 'answer' }
      a.insurance = 'same'
      if (route === 'review') return { ...base, screen: 'review', history: [...hist, 'reason', 'insurance'], wordingBy: 'answer' }
      base.events.unshift(ev(at, 'fhir', 'Check-in sent to the front desk', 'QuestionnaireResponse.status = completed'))
      return { ...base, screen: 'done', history: [], wordingBy: 'answer', sentAt: at }
    }
    case 'desk':
      return { ...base, screen: 'desk', history: ['arrival'] }
  }
}

/* ---------- Reducer ---------- */
export type Action =
  | { type: 'go'; screen: Screen; at: string }
  | { type: 'back' }
  | { type: 'answer'; patch: Partial<Answers> }
  | { type: 'wording'; wording: Wording; at: string }
  | { type: 'next'; at: string }
  | { type: 'editFromReview'; screen: Screen }
  | { type: 'help'; mode: HelpMode; at: string }
  | { type: 'helpCancel'; at: string }
  | { type: 'send'; at: string }
  | { type: 'load'; state: State }
  | { type: 'log'; event: Omit<DeskEvent, 'id'> }

const push = (s: State, to: Screen): State => ({ ...s, history: [...s.history, s.screen], screen: to, nudge: 0 })

function nextScreen(s: State): { to: Screen | null; patch?: Partial<State>; log?: string } {
  const a = s.answers
  const fromReview = (to: Screen) => (s.editingFromReview ? 'review' : to)
  switch (s.screen) {
    case 'arrival':
      return { to: 'contact', log: 'Patient tapped “I’m at the clinic”' }
    case 'contact':
      if (!a.contact) return { to: null }
      return { to: fromReview('meds'), log: `Answered question 1 · ${a.contact === 'same' ? 'contact info unchanged' : 'contact info needs an update'}` }
    case 'meds': {
      if (!a.meds) return { to: null }
      const auto: Wording = a.meds === 'yes' ? 'medical' : 'simple'
      const wording = s.wordingBy === 'patient' ? s.wording : auto
      const patch: Partial<State> = { wording, wordingBy: s.wordingBy === 'patient' ? 'patient' : 'answer' }
      if (a.meds === 'none') return { to: fromReview('reason'), patch, log: 'Answered question 2 · no current medications' }
      return { to: wording === 'medical' ? 'medlist' : 'brought', patch, log: `Answered question 2 · wording set to ${wording === 'medical' ? 'medical terms' : 'simple words'}` }
    }
    case 'brought':
      if (!a.brought) return { to: null }
      return { to: fromReview('reason'), log: 'Answered question 3 · medicines' }
    case 'medlist': {
      const changed = Object.entries(a.medStatus).filter(([, v]) => v !== 'taking').length
      return { to: fromReview('reason'), log: `Answered question 3 · ${changed ? `${changed} medicine change${changed > 1 ? 's' : ''}` : 'no medicine changes'}` }
    }
    case 'reason':
      if (!a.reason) return { to: null }
      return { to: fromReview('insurance'), log: 'Answered question 4 · reason for visit' }
    case 'insurance':
      if (!a.insurance) return { to: null }
      return { to: 'review', log: 'Answered question 5 · insurance' }
    default:
      return { to: null }
  }
}

export function reducer(s: State, act: Action): State {
  switch (act.type) {
    case 'load':
      return act.state
    case 'go':
      return push(s, act.screen)
    case 'back': {
      if (!s.history.length) return s
      const prev = s.history[s.history.length - 1]
      return { ...s, screen: prev, history: s.history.slice(0, -1), nudge: 0, editingFromReview: prev === 'review' ? false : s.editingFromReview }
    }
    case 'answer':
      return { ...s, answers: { ...s.answers, ...act.patch }, nudge: 0 }
    case 'wording': {
      let screen = s.screen
      if (screen === 'brought' && act.wording === 'medical') screen = 'medlist'
      else if (screen === 'medlist' && act.wording === 'simple') screen = 'brought'
      return {
        ...s,
        wording: act.wording,
        wordingBy: 'patient',
        screen,
        events: [ev(act.at, 'info', `Patient switched wording to ${act.wording === 'medical' ? 'medical terms' : 'simple words'}`), ...s.events],
      }
    }
    case 'next': {
      const r = nextScreen(s)
      if (!r.to) return { ...s, nudge: s.nudge + 1 }
      const after = { ...push({ ...s, ...r.patch }, r.to), editingFromReview: r.to === 'review' ? false : s.editingFromReview }
      if (r.to === 'review') after.history = after.history.filter((h) => h !== 'review')
      const resource = s.screen === 'arrival' ? 'Appointment.status = arrived' : `QuestionnaireResponse item ${questionNumber(s.screen) ?? ''}`.trim()
      return r.log ? { ...after, events: [ev(act.at, 'fhir', r.log, resource), ...after.events] } : after
    }
    case 'editFromReview':
      return { ...push(s, act.screen), editingFromReview: true }
    case 'help': {
      if (act.mode === 'open' && s.help === 'off') {
        return { ...s, help: 'open', helpStartedAt: Date.now(), events: [ev(act.at, 'help', `Help requested on ${labelFor(s.screen)}`, 'Communication → Desk 2'), ...s.events] }
      }
      return { ...s, help: act.mode }
    }
    case 'helpCancel':
      return { ...s, help: 'off', helpStartedAt: null, events: [ev(act.at, 'help', 'Patient cancelled the help request', 'Communication.status = revoked'), ...s.events] }
    case 'send':
      return {
        ...s,
        screen: 'done',
        history: [],
        sentAt: act.at,
        help: 'off',
        events: [ev(act.at, 'fhir', 'Check-in sent to the front desk', 'QuestionnaireResponse.status = completed'), ...s.events],
      }
    case 'log':
      return { ...s, events: [{ ...act.event, id: eventId++ }, ...s.events] }
  }
}

export function labelFor(s: Screen) {
  const n = questionNumber(s)
  if (n) return `question ${n}`
  return ({ arrival: 'the welcome screen', review: 'the review screen', done: 'the done screen', desk: 'the desk screen' } as Record<string, string>)[s] ?? s
}
