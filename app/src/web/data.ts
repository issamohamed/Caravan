/* All dummy data for the clinic web app. Synthetic people only. */

export type Tone = 'held' | 'review' | 'note' | 'done' | 'info' | 'accent' | 'neutral'
export type Where = 'desk' | 'either' | 'before'
export type StepState = 'desk' | 'early' | 'open' | 'todo' | 'skipped'

export type RoutineStep = { id: string; label: string; where: Where; required: boolean; avgSec: number; skipRate: number; check: string }
export type Routine = { id: string; name: string; runs: number; steps: RoutineStep[]; rules: { early: boolean; followUp: boolean; reasonOnSkip: boolean } }

export const routines: Routine[] = [
  {
    id: 'return',
    name: 'Return visit',
    runs: 312,
    rules: { early: true, followUp: true, reasonOnSkip: false },
    steps: [
      { id: 'identity', label: 'Confirm identity', where: 'desk', required: true, avgSec: 22, skipRate: 0, check: 'Two identifiers' },
      { id: 'contact', label: 'Phone and address', where: 'either', required: true, avgSec: 31, skipRate: 0.02, check: 'Phone and address format' },
      { id: 'insurance', label: 'Insurance card', where: 'either', required: true, avgSec: 58, skipRate: 0.04, check: 'Card end date, member ID format' },
      { id: 'consent', label: 'Yearly consent', where: 'before', required: true, avgSec: 6, skipRate: 0, check: 'Signed in the last 12 months' },
      { id: 'interpreter', label: 'Interpreter', where: 'before', required: false, avgSec: 12, skipRate: 0.71, check: 'Language need on file' },
      { id: 'portal', label: 'Patient portal', where: 'desk', required: true, avgSec: 9, skipRate: 0.68, check: 'Account already active' },
    ],
  },
  {
    id: 'new',
    name: 'New patient',
    runs: 64,
    rules: { early: true, followUp: false, reasonOnSkip: true },
    steps: [
      { id: 'identity', label: 'Confirm identity', where: 'desk', required: true, avgSec: 41, skipRate: 0, check: 'Two identifiers' },
      { id: 'photoid', label: 'Photo ID', where: 'desk', required: true, avgSec: 35, skipRate: 0.03, check: 'Name matches registration' },
      { id: 'contact', label: 'Phone and address', where: 'either', required: true, avgSec: 52, skipRate: 0, check: 'Phone and address format' },
      { id: 'insurance', label: 'Insurance card', where: 'either', required: true, avgSec: 74, skipRate: 0.05, check: 'Card end date, member ID format' },
      { id: 'consent', label: 'Consent forms', where: 'either', required: true, avgSec: 66, skipRate: 0, check: 'All forms signed' },
      { id: 'history', label: 'Health history', where: 'before', required: false, avgSec: 140, skipRate: 0.22, check: 'Questionnaire complete' },
      { id: 'emergency', label: 'Emergency contact', where: 'either', required: true, avgSec: 28, skipRate: 0.06, check: 'Name and phone present' },
      { id: 'interpreter', label: 'Interpreter', where: 'before', required: false, avgSec: 14, skipRate: 0.64, check: 'Language need on file' },
      { id: 'portal', label: 'Patient portal', where: 'desk', required: false, avgSec: 48, skipRate: 0.31, check: 'Invite sent' },
    ],
  },
  {
    id: 'lab',
    name: 'Lab only',
    runs: 188,
    rules: { early: true, followUp: true, reasonOnSkip: false },
    steps: [
      { id: 'identity', label: 'Confirm identity', where: 'desk', required: true, avgSec: 18, skipRate: 0, check: 'Two identifiers' },
      { id: 'orders', label: 'Lab orders on file', where: 'before', required: true, avgSec: 4, skipRate: 0, check: 'Active order found' },
      { id: 'insurance', label: 'Insurance card', where: 'either', required: true, avgSec: 37, skipRate: 0.03, check: 'Card end date' },
    ],
  },
  {
    id: 'sameday',
    name: 'Same-day add-on',
    runs: 41,
    rules: { early: false, followUp: true, reasonOnSkip: true },
    steps: [
      { id: 'identity', label: 'Confirm identity', where: 'desk', required: true, avgSec: 24, skipRate: 0, check: 'Two identifiers' },
      { id: 'reason', label: 'Reason for visit', where: 'either', required: true, avgSec: 33, skipRate: 0, check: 'Reason recorded' },
      { id: 'insurance', label: 'Insurance card', where: 'either', required: true, avgSec: 61, skipRate: 0.06, check: 'Card end date, member ID format' },
      { id: 'consent', label: 'Yearly consent', where: 'before', required: true, avgSec: 8, skipRate: 0, check: 'Signed in the last 12 months' },
      { id: 'provider', label: 'Provider approval', where: 'desk', required: true, avgSec: 95, skipRate: 0, check: 'Slot approved by provider' },
    ],
  },
]

/** Step states are stored by step id, so reordering a routine never scrambles a patient's progress. */
const S = (routineId: string, states: StepState[]): Record<string, StepState> => {
  const r = routines.find((x) => x.id === routineId)!
  return Object.fromEntries(r.steps.map((st, i) => [st.id, states[i] ?? 'todo']))
}

export type Check = { tone: 'held' | 'review' | 'note'; title: string; body: string; link?: { label: string; to: string } }
export type Arrival = {
  id: string
  time: string
  name: string
  legalName?: string
  pronouns?: string
  dob: string
  age: number
  mrn: string
  visit: string
  provider: string
  status: 'checked-in' | 'waiting' | 'at-desk' | 'expected' | 'held'
  waitMin?: number
  arrivedAt?: string
  routine: string
  steps: Record<string, StepState>
  stepNotes?: Record<string, string>
  checks: Check[]
  passed: string[]
  interpreter?: string
  channel: 'phone' | 'desk'
}

export const arrivals: Arrival[] = [
  {
    id: 'kerr',
    time: '10:20',
    name: 'Thomas Kerr',
    dob: '07/02/1961',
    age: 65,
    mrn: 'S-118402',
    visit: 'Lab only',
    provider: 'Lab',
    status: 'checked-in',
    arrivedAt: '10:14',
    routine: 'lab',
    steps: S('lab', ['desk', 'early', 'desk']),
    checks: [],
    passed: ['Two identifiers', 'Active lab order', 'Card current'],
    channel: 'desk',
  },
  {
    id: 'nguyen',
    time: '10:30',
    name: 'Nguyen Thi Lan',
    dob: '11/19/1974',
    age: 51,
    mrn: 'S-230871',
    visit: 'New patient · Cardiology',
    provider: 'Dr. M. Osei',
    status: 'waiting',
    waitMin: 8,
    arrivedAt: '10:31',
    routine: 'new',
    steps: S('new', ['todo', 'todo', 'early', 'early', 'early', 'early', 'todo', 'skipped', 'todo']),
    checks: [{ tone: 'note', title: 'Family name comes first', body: 'Name order is kept as entered: Nguyen is the family name. Don’t flip it on forms.' }],
    passed: ['Phone format', 'Address format', 'Card current', 'Consent forms signed'],
    channel: 'phone',
  },
  {
    id: 'warsame',
    time: '10:40',
    name: 'Amina Warsame',
    legalName: 'Aamina Warsame',
    pronouns: 'she/her',
    dob: '03/14/1988',
    age: 38,
    mrn: 'S-204118',
    visit: 'Return visit · Dermatology',
    provider: 'Dr. R. Hale',
    status: 'at-desk',
    arrivedAt: '10:36',
    routine: 'return',
    steps: S('return', ['desk', 'desk', 'open', 'early', 'early', 'skipped']),
    stepNotes: { insurance: 'Card on file ended 09/30/2026' },
    interpreter: 'Somali · in person',
    checks: [
      { tone: 'held', title: 'Coverage ended 09/30/2026', body: 'The insurance card on file is past its end date. Ask for a current card before the visit is billed.' },
      { tone: 'review', title: 'Possible duplicate record', body: 'A referral imported at 10:12 looks like the same person under a different spelling: Amina Warsame Abdi.', link: { label: 'Compare records', to: 'review' } },
      { tone: 'note', title: 'Preferred name differs from legal name', body: 'Expected, not an error. The desk shows the preferred name; billing keeps the legal name.' },
    ],
    passed: ['Two identifiers', 'Phone format', 'Address format', 'Date of birth plausible', 'Consent current', 'Interpreter booked', 'No ID numbers in notes'],
    channel: 'phone',
  },
  {
    id: 'delgado',
    time: '10:45',
    name: 'Rosa Delgado',
    dob: '05/30/1957',
    age: 69,
    mrn: 'S-309554',
    visit: 'Imaging',
    provider: 'Radiology',
    status: 'expected',
    routine: 'lab',
    steps: S('lab', ['todo', 'early', 'todo']),
    checks: [
      { tone: 'review', title: 'Number masked in referral note', body: 'A 9-digit number shaped like an SSN was masked in her referral note. Confirm the mask in the review queue.', link: { label: 'Open review queue', to: 'review' } },
    ],
    passed: ['Active imaging order', 'Card current'],
    channel: 'desk',
  },
  {
    id: 'lee',
    time: '11:00',
    name: 'Daniel Lee',
    dob: '01/08/1990',
    age: 36,
    mrn: 'S-412090',
    visit: 'Return visit · Endocrinology',
    provider: 'Dr. P. Shah',
    status: 'expected',
    routine: 'return',
    steps: S('return', ['todo', 'early', 'early', 'early', 'skipped', 'skipped']),
    checks: [],
    passed: ['Phone format', 'Card current', 'Consent current'],
    channel: 'phone',
  },
  {
    id: 'sukarni',
    time: '11:15',
    name: 'Sukarni',
    dob: '09/23/1949',
    age: 77,
    mrn: 'S-500327',
    visit: 'New patient · Neurology',
    provider: 'Dr. L. Brandt',
    status: 'expected',
    routine: 'new',
    steps: S('new', ['todo', 'todo', 'todo', 'todo', 'early', 'todo', 'todo', 'early', 'todo']),
    interpreter: 'Indonesian · phone',
    checks: [{ tone: 'note', title: 'One legal name only', body: 'Accepted as entered. No placeholder last name was added.' }],
    passed: ['Consent forms signed', 'Interpreter booked'],
    channel: 'desk',
  },
  {
    id: 'webb',
    time: '11:30',
    name: 'Marcus Webb',
    dob: '04/02/1962',
    age: 64,
    mrn: 'S-511876',
    visit: 'Same-day add-on',
    provider: 'Dr. A. Patel',
    status: 'held',
    routine: 'sameday',
    steps: S('sameday', ['todo', 'early', 'open', 'early', 'todo']),
    stepNotes: { insurance: 'No current card on file' },
    checks: [{ tone: 'held', title: 'No current insurance card', body: 'Nothing on file since 2024. Ask for a card or mark self-pay for today.' }],
    passed: ['Reason recorded', 'Consent current'],
    channel: 'desk',
  },
]

export type PhoneCheckin = {
  id: string
  name: string
  time: string
  provider: string
  state: 'help' | 'going' | 'checked' | 'progress' | 'idle'
  q: number
  wording: 'simple' | 'medical'
  large?: boolean
  note: string
  number?: string
  at?: string
  answers: { label: string; value: string; flag?: boolean }[]
}

export const phoneCheckins: PhoneCheckin[] = [
  {
    id: 'kim',
    name: 'Robert Kim',
    time: '9:40',
    provider: 'Dr. Patel',
    state: 'help',
    q: 2,
    wording: 'simple',
    large: true,
    note: 'Stopped on question 2. Seated by the windows.',
    at: '9:19',
    answers: [
      { label: 'Phone and address', value: 'No changes' },
      { label: 'Medicines', value: 'Not answered yet' },
    ],
  },
  {
    id: 'wallace',
    name: 'Dorothy Wallace',
    time: '9:30',
    provider: 'Dr. Patel',
    state: 'checked',
    q: 5,
    wording: 'simple',
    note: 'For the nurse: review medicines from the bottles she brought.',
    number: '214',
    at: '9:21',
    answers: [
      { label: 'Phone and address', value: 'No changes' },
      { label: 'Medicines', value: 'Knows some · brought pill bottles', flag: true },
      { label: 'Reason for visit', value: 'Blood pressure check' },
      { label: 'Insurance', value: 'Same card as before' },
    ],
  },
  {
    id: 'park',
    name: 'James Park',
    time: '9:20',
    provider: 'Dr. Okafor',
    state: 'checked',
    q: 5,
    wording: 'medical',
    note: '1 medicine change: atorvastatin marked stopped. For the nurse.',
    number: '209',
    at: '9:14',
    answers: [
      { label: 'Contact information', value: 'Correct as listed' },
      { label: 'Medication list', value: 'Atorvastatin 20 mg: stopped', flag: true },
      { label: 'Reason for visit', value: 'Lab result review' },
      { label: 'Coverage', value: 'Same payer and member ID' },
    ],
  },
  {
    id: 'osei',
    name: 'Linda Osei',
    time: '9:45',
    provider: 'Dr. Patel',
    state: 'progress',
    q: 3,
    wording: 'simple',
    note: 'Started on her phone at 9:20.',
    at: '9:20',
    answers: [
      { label: 'Phone and address', value: 'No changes' },
      { label: 'Medicines', value: 'Not really · simple words' },
    ],
  },
  {
    id: 'moreno',
    name: 'Frank Moreno',
    time: '10:00',
    provider: 'Dr. Okafor',
    state: 'idle',
    q: 0,
    wording: 'simple',
    note: 'Prefers to check in at the desk (noted at his last visit).',
    answers: [],
  },
]

export type ImportRow = {
  row: number
  name: string
  status: 'ready' | 'review' | 'held' | 'note' | 'committed'
  finding: string
  action?: 'compare' | 'request' | 'mask' | 'fixdate'
  dob?: string
  requested?: boolean
}

const readyNames = [
  'Daniel Lee',
  'Grace Holm',
  'Peter Lindqvist',
  'Maria Santos',
  'Ahmed Farah',
  'Kelly Brooks',
  'Joan Albrecht',
  'Luis Ortega',
  'Hannah Steiner',
  'Omar Haji',
  'Beth Larkin',
  'Chen Wei',
  'Ruth Becker',
  'Isaac Moore',
  'Noor Ali',
  'Tom Vang',
  'Sara Lund',
]
export const importRows: ImportRow[] = (() => {
  const special: Record<number, ImportRow> = {
    3: { row: 3, name: 'Amina Warsame Abdi', status: 'review', finding: 'Possible duplicate. Date of birth, phone and insurance ID match an existing record; the name is a spelling variant.', action: 'compare' },
    7: { row: 7, name: 'J. Okafor', status: 'held', finding: 'Date of birth is blank. Without it the record can’t be matched safely.', action: 'request' },
    11: { row: 11, name: 'Rosa Delgado', status: 'review', finding: 'The referral note held a 9-digit number shaped like an SSN. It was masked in the staged copy.', action: 'mask' },
    14: { row: 14, name: 'Nguyen Thi Lan', status: 'note', finding: 'Family name comes first. Name order is kept as entered, not flipped.' },
    16: { row: 16, name: 'Hamza Yusuf', status: 'review', finding: 'Phone number has 9 digits. One digit may be missing.', action: 'request' },
    19: { row: 19, name: 'Sukarni', status: 'note', finding: 'One legal name only. Accepted as entered; no placeholder last name added.' },
    21: { row: 21, name: 'Marcus Webb', status: 'held', finding: 'Date of birth reads 04/02/2062, which is in the future. Likely a typo.', action: 'fixdate', dob: '2062-04-02' },
    23: { row: 23, name: 'Evelyn Park', status: 'review', finding: 'Address doesn’t match a known street. Possibly “Birchwood Ln” misspelled.', action: 'request' },
  }
  const rows: ImportRow[] = []
  let r = 0
  for (let i = 1; i <= 24; i++) {
    if (special[i]) rows.push(special[i])
    else rows.push({ row: i, name: readyNames[r++ % readyNames.length], status: 'ready', finding: 'All 9 checks passed.' })
  }
  return rows
})()

export const fieldMap = [
  { source: 'pt_name', target: 'Patient.name', rule: 'Split “Last, First”; keep name order as entered' },
  { source: 'dob', target: 'Patient.birthDate', rule: 'MM/DD/YYYY to ISO date; reject future dates' },
  { source: 'phone', target: 'Patient.telecom', rule: 'Normalize to (###) ###-####' },
  { source: 'address', target: 'Patient.address', rule: 'Standard street abbreviations' },
  { source: 'ins_member_id', target: 'Coverage.subscriberId', rule: 'Keep as entered' },
  { source: 'referral_note', target: 'DocumentReference', rule: 'Mask anything shaped like an ID number', sensitive: true },
]
export const fhirTargets = ['Patient.name', 'Patient.birthDate', 'Patient.telecom', 'Patient.address', 'Coverage.subscriberId', 'Coverage.payor', 'DocumentReference', 'ServiceRequest.reasonCode', '— ignore column —']

export type QueueItem = {
  id: string
  kind: 'duplicate' | 'mask' | 'missing' | 'future'
  title: string
  who: string
  source: string
  age: string
  status: 'open' | 'resolved'
  row: number
  decision?: string
}

export const queue: QueueItem[] = [
  { id: 'q-dup', kind: 'duplicate', title: 'Possible duplicate', who: 'Amina Warsame Abdi', source: 'referrals_week43.csv · row 3', age: '29 min', status: 'open', row: 3 },
  { id: 'q-mask', kind: 'mask', title: 'Confirm masked number', who: 'Rosa Delgado', source: 'referrals_week43.csv · row 11', age: '29 min', status: 'open', row: 11 },
  { id: 'q-missing', kind: 'missing', title: 'Missing date of birth', who: 'J. Okafor', source: 'referrals_week43.csv · row 7', age: '29 min', status: 'open', row: 7 },
  { id: 'q-future', kind: 'future', title: 'Date of birth in the future', who: 'Marcus Webb', source: 'referrals_week43.csv · row 21', age: '29 min', status: 'open', row: 21 },
]

export const compareFields = [
  { field: 'Legal name', incoming: ['Amina Warsame ', 'Abdi'], existing: ['Aamina', ' Warsame'], result: 'close', why: 'Common spelling variant (Aamina / Amina) plus an added family name' },
  { field: 'Date of birth', incoming: ['03/14/1988'], existing: ['03/14/1988'], result: 'same' },
  { field: 'Phone', incoming: ['(507) 555-0142'], existing: ['(507) 555-0142'], result: 'same' },
  { field: 'Address', incoming: ['1200 Elm St, Apt ', '4B'], existing: ['1200 Elm St, Apt ', '4'], result: 'close', why: 'Same street; unit differs' },
  { field: 'Insurance ID', incoming: ['XJH-448-210'], existing: ['XJH-448-210'], result: 'same' },
  { field: 'Sex', incoming: ['Female'], existing: ['Female'], result: 'same' },
] as const

export type QItem = { id: string; title: string; type: string; simple: string; medical: string; branches?: { answer: string; to: string }[]; edited?: boolean }
export type QSet = { id: string; name: string; status: 'live' | 'draft'; version: number; published: string; by: string; items: QItem[]; history: { v: number; when: string; by: string; what: string }[] }

export const questionSets: QSet[] = [
  {
    id: 'return',
    name: 'Return visit',
    status: 'live',
    version: 4,
    published: 'Oct 20',
    by: 'MR',
    items: [
      { id: 'q1', title: 'Phone and address', type: 'Yes / No', simple: 'Is this still your phone number and address?', medical: 'Confirm the contact information on file (phone, address).' },
      {
        id: 'q2',
        title: 'Medicines: sets the wording',
        type: 'Choice · branches',
        simple: 'Do you know the names of the medicines you take?',
        medical: 'Medication reconciliation: can you list your current medications?',
        branches: [
          { answer: 'Yes, I know them', to: 'Medication list, medical terms' },
          { answer: 'Some / Not really', to: 'Pill-bottle question, simple words' },
          { answer: 'I don’t take any', to: 'Skip to question 4' },
        ],
      },
      { id: 'q3', title: 'Medicines: follow-up', type: 'Picked by question 2', simple: 'Did you bring your pill bottles or a list?', medical: 'Review your medication list. Mark each one Taking, Stopped or Changed.' },
      { id: 'q4', title: 'Reason for visit', type: 'Pick one, or say it', simple: 'What’s the main reason for your visit today?', medical: 'Reason for visit (main concern).' },
      { id: 'q5', title: 'Insurance card', type: 'Choice', simple: 'Is this the same insurance card as last time?', medical: 'Verify coverage: same payer and member ID as on file?' },
    ],
    history: [
      { v: 4, when: 'Oct 20', by: 'MR', what: 'Shortened the insurance question' },
      { v: 3, when: 'Oct 2', by: 'DS', what: 'Added “Someone with me has them”' },
      { v: 2, when: 'Sep 18', by: 'MR', what: 'Split medicines into two wordings' },
      { v: 1, when: 'Sep 4', by: 'MR', what: 'First version' },
    ],
  },
  {
    id: 'new',
    name: 'New patient',
    status: 'draft',
    version: 1,
    published: 'not yet',
    by: 'DS',
    items: [
      { id: 'n1', title: 'Photo ID', type: 'Photo', simple: 'Can you take a picture of your ID card?', medical: 'Upload a government-issued photo ID.' },
      { id: 'n2', title: 'Health history', type: 'Checklist', simple: 'Have you ever been told you have any of these?', medical: 'Past medical history: select all diagnoses that apply.' },
      { id: 'n3', title: 'Emergency contact', type: 'Text', simple: 'Who should we call if we need to reach someone for you?', medical: 'Emergency contact name, relationship and phone number.' },
    ],
    history: [{ v: 1, when: 'Oct 27', by: 'DS', what: 'Draft started' }],
  },
  {
    id: 'lab',
    name: 'Lab only',
    status: 'live',
    version: 2,
    published: 'Sep 30',
    by: 'MR',
    items: [
      { id: 'l1', title: 'Fasting', type: 'Yes / No', simple: 'Have you had anything to eat since last night?', medical: 'Have you been fasting for at least 8 hours?' },
      { id: 'l2', title: 'Insurance card', type: 'Choice', simple: 'Is this the same insurance card as last time?', medical: 'Verify coverage: same payer and member ID as on file?' },
    ],
    history: [
      { v: 2, when: 'Sep 30', by: 'MR', what: 'Added the fasting question' },
      { v: 1, when: 'Sep 4', by: 'MR', what: 'First version' },
    ],
  },
  {
    id: 'sameday',
    name: 'Same-day add-on',
    status: 'live',
    version: 3,
    published: 'Oct 9',
    by: 'DS',
    items: [
      { id: 's1', title: 'Reason for visit', type: 'Pick one, or say it', simple: 'What made you want to be seen today?', medical: 'Reason for same-day visit (main concern).' },
      { id: 's2', title: 'How long', type: 'Choice', simple: 'How long has this been going on?', medical: 'Symptom duration.' },
    ],
    history: [{ v: 3, when: 'Oct 9', by: 'DS', what: 'Reworded “onset” to “how long”' }],
  },
]

export type AuditType = 'records' | 'checkin' | 'phone' | 'check' | 'import' | 'qset' | 'override' | 'routine'
export type AuditEntry = { id: number; time: string; type: AuditType; what: string; who: string; reason: string; where: string }

const seed: Omit<AuditEntry, 'id'>[] = [
  { time: '10:41', type: 'records', what: 'Opened a possible duplicate: import row 3 and record S-204118', who: 'DS', reason: '—', where: 'Desk 4' },
  { time: '10:39', type: 'checkin', what: 'Confirmed a Somali interpreter (in person) for Amina Warsame', who: 'DS', reason: 'Requested at booking', where: 'Desk 4' },
  { time: '10:36', type: 'phone', what: 'Amina Warsame checked in by phone (simple words, 5 answers)', who: 'Patient', reason: '—', where: 'Phone app' },
  { time: '10:31', type: 'phone', what: 'Nguyen Thi Lan checked in by phone (medical terms)', who: 'Patient', reason: '—', where: 'Phone app' },
  { time: '10:21', type: 'check', what: 'Held check-in: insurance card on file ended 09/30/2026', who: 'System', reason: 'Coverage end date passed', where: 'Checks' },
  { time: '10:14', type: 'checkin', what: 'Completed check-in for Thomas Kerr (Lab only)', who: 'DS', reason: '—', where: 'Desk 4' },
  { time: '10:12', type: 'import', what: 'Imported referrals_week43.csv: 24 rows, 16 ready, 4 to review, 2 held, 2 notes', who: 'DS', reason: 'Weekly referrals', where: 'Imports' },
  { time: '10:12', type: 'check', what: 'Masked a number shaped like an SSN in a referral note (row 11)', who: 'System', reason: 'ID numbers aren’t kept in notes', where: 'Checks' },
  { time: '10:12', type: 'check', what: 'Flagged a possible duplicate (row 3 ↔ S-204118)', who: 'System', reason: 'Match score 0.91', where: 'Checks' },
  { time: '09:58', type: 'qset', what: 'Edited the insurance question in “Return visit” (not published yet)', who: 'MR', reason: 'Patients found “payer” confusing', where: 'Web' },
  { time: '09:44', type: 'routine', what: 'Moved “Interpreter” to before arrival in “Return visit”', who: 'MR', reason: 'Booked at scheduling', where: 'Web' },
  { time: '09:21', type: 'phone', what: 'Dorothy Wallace checked in by phone (#214)', who: 'Patient', reason: '—', where: 'Phone app' },
  { time: '09:20', type: 'phone', what: 'Answered a help request from Robert Kim', who: 'MR', reason: 'Walked over to help', where: 'Desk 2' },
  { time: '09:19', type: 'phone', what: 'Robert Kim asked for help on question 2', who: 'Patient', reason: '—', where: 'Phone app' },
  { time: '09:14', type: 'phone', what: 'James Park checked in by phone (#209), 1 medicine change', who: 'Patient', reason: '—', where: 'Phone app' },
  { time: '09:05', type: 'override', what: 'Marked Peter Lindqvist as self-pay for today’s visit', who: 'DS', reason: 'No current card; will bring it next visit', where: 'Desk 4' },
  { time: '08:57', type: 'records', what: 'Linked two records for Joan Albrecht (S-108232 ← import row 9, Oct 27)', who: 'MR', reason: 'Patient confirmed DOB and phone', where: 'Review queue' },
  { time: '08:51', type: 'checkin', what: 'Completed check-in for Grace Holm (Return visit)', who: 'MR', reason: '—', where: 'Desk 2' },
  { time: '08:46', type: 'check', what: 'Note: preferred name differs from legal name (Amina Warsame)', who: 'System', reason: 'Expected, not an error', where: 'Checks' },
  { time: '08:40', type: 'override', what: 'Skipped “Patient portal” for Luis Ortega', who: 'DS', reason: 'Account already active', where: 'Desk 4' },
  { time: '08:33', type: 'phone', what: 'Maria Santos switched wording to medical terms', who: 'Patient', reason: '—', where: 'Phone app' },
  { time: '08:30', type: 'import', what: 'Imported adt_sample_batch.hl7: 9 messages, all ready', who: 'MR', reason: 'Morning schedule sync', where: 'Imports' },
  { time: '08:22', type: 'checkin', what: 'Completed check-in for Ahmed Farah (Lab only)', who: 'DS', reason: '—', where: 'Desk 4' },
  { time: '08:15', type: 'qset', what: 'Previewed “Lab only” v2 on a phone', who: 'MR', reason: '—', where: 'Web' },
  { time: '08:09', type: 'checkin', what: 'Started the desk: Desk 4 signed in', who: 'DS', reason: '—', where: 'Desk 4' },
  { time: '08:02', type: 'checkin', what: 'Started the desk: Desk 2 signed in', who: 'MR', reason: '—', where: 'Desk 2' },
]
export const auditSeed: AuditEntry[] = seed.map((e, i) => ({ ...e, id: 1000 - i }))

/* ---------- Insights (synthetic, 30 days) ---------- */
export const funnel = [
  { step: 'Opened check-in', n: 412 },
  { step: 'Q1 Phone and address', n: 405 },
  { step: 'Q2 Medicines', n: 398 },
  { step: 'Q3 Medicine follow-up', n: 371 },
  { step: 'Q4 Reason for visit', n: 362 },
  { step: 'Q5 Insurance', n: 355 },
  { step: 'Sent to the desk', n: 349 },
]
export const helpByQuestion = [
  { q: 'Q1', v3: 4, v4: 4 },
  { q: 'Q2', v3: 11, v4: 10 },
  { q: 'Q3', v3: 23, v4: 21 },
  { q: 'Q4', v3: 6, v4: 7 },
  { q: 'Q5', v3: 19, v4: 5 },
]
export const ageBands = [
  { band: '18–39', medical: 71, completion: 96, help: 2.1, n: 88 },
  { band: '40–64', medical: 58, completion: 95, help: 3.4, n: 141 },
  { band: '65–79', medical: 46, completion: 91, help: 6.8, n: 129 },
  { band: '80+', medical: 33, completion: 86, help: 11.9, n: 54 },
]
export const checkinByHour = [
  { h: '8', before: 4.4, after: 2.9 },
  { h: '9', before: 4.9, after: 3.0 },
  { h: '10', before: 4.6, after: 2.7 },
  { h: '11', before: 4.1, after: 2.5 },
  { h: '12', before: 3.6, after: 2.3 },
  { h: '1', before: 4.0, after: 2.4 },
  { h: '2', before: 4.3, after: 2.6 },
  { h: '3', before: 3.9, after: 2.5 },
  { h: '4', before: 3.4, after: 2.2 },
]

export const improvements = [
  { title: 'Average check-in time', now: '2m 35s', was: '4m 10s', nowPct: 62, wasPct: 100, delta: '38% faster', why: 'Insurance and consent are checked the day before, so the desk only confirms.', tone: 'white' },
  { title: 'Steps settled before arrival', now: '4 of 6', was: '1 of 6', nowPct: 67, wasPct: 17, delta: '3 fewer steps at the desk', why: 'Consent, interpreter and portal status come from the booking, not the counter.', tone: 'pink' },
  { title: 'Coverage problems caught early', now: '37', was: '9', nowPct: 100, wasPct: 24, delta: '4× more caught', why: 'Expired cards are flagged at check-in, while the patient is still at the desk.', tone: 'mist' },
  { title: 'New duplicate charts', now: '1', was: '11', nowPct: 9, wasPct: 100, delta: '91% fewer', why: 'Close name spellings go to a person instead of quietly becoming a second chart.', tone: 'blush' },
  { title: 'Referral rows entered without retyping', now: '83%', was: '0%', nowPct: 83, wasPct: 3, delta: 'Imported, not re-keyed', why: 'CSV, FHIR and HL7 rows are mapped and checked; only flagged rows need hands.', tone: 'white' },
  { title: 'Interpreters confirmed before arrival', now: '96%', was: '71%', nowPct: 96, wasPct: 71, delta: '+25 points', why: 'Interpreter requests from booking show on the board the day before.', tone: 'mist' },
] as const
