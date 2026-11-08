export type Wording = 'simple' | 'medical'

export const patient = {
  first: 'Dorothy',
  full: 'Dorothy Wallace',
  visitTime: '9:30 AM',
  provider: 'Dr. Anita Patel',
  place: 'Family Medicine, 2nd floor',
  phone: '(507) 555-0187',
  address: '418 Birchwood Lane, Apt 2',
  plan: 'Northstar Health Plan',
  memberEnd: '4410',
  checkinNo: '214',
}

export type Choice = { id: string; simple: string; medical: string; hint?: { simple: string; medical: string } }

export const questions = {
  contact: {
    num: 1,
    simple: { title: 'Is this still your phone number and address?', sub: 'We use these to reach you about your results.' },
    medical: { title: 'Confirm the contact information on file.', sub: 'Phone and mailing address used for results and billing.' },
    choices: [
      { id: 'same', simple: 'Yes, that’s right', medical: 'Correct as listed' },
      { id: 'changed', simple: 'Something changed', medical: 'Needs an update' },
    ] as Choice[],
  },
  meds: {
    num: 2,
    simple: { title: 'Do you know the names of the medicines you take?', sub: 'This helps us ask the next question the right way. There’s no wrong answer.' },
    medical: { title: 'Medication reconciliation: can you list your current medications?', sub: 'Your answer sets how the next questions are worded.' },
    choices: [
      { id: 'yes', simple: 'Yes, I know them', medical: 'Yes, I can list them' },
      { id: 'some', simple: 'I know some of them', medical: 'Partially' },
      { id: 'no', simple: 'Not really', medical: 'No' },
      { id: 'none', simple: 'I don’t take any', medical: 'No current medications' },
    ] as Choice[],
  },
  brought: {
    num: 3,
    simple: { title: 'Did you bring your pill bottles or a list?', sub: '' },
    medical: { title: 'Did you bring your pill bottles or a list?', sub: '' },
    choices: [
      { id: 'yes', simple: 'Yes, I brought them', medical: 'Yes, I brought them' },
      { id: 'no', simple: 'No, I didn’t bring them', medical: 'No' },
      { id: 'someone', simple: 'Someone with me has them', medical: 'A companion has them' },
    ] as Choice[],
  },
  medlist: {
    num: 3,
    simple: { title: 'Here are the medicines we have for you', sub: 'Tell us if any of them changed.' },
    medical: { title: 'Your medication list', sub: 'From your Family Medicine record. Mark anything that changed.' },
  },
  reason: {
    num: 4,
    simple: { title: 'What’s the main reason for your visit today?', sub: 'Pick the closest one. Your doctor will ask more.' },
    medical: { title: 'Reason for visit (main concern)', sub: 'Select the closest match.' },
    choices: [
      { id: 'checkup', simple: 'A check-up', medical: 'Annual wellness visit' },
      { id: 'bp', simple: 'My blood pressure', medical: 'Hypertension follow-up' },
      { id: 'results', simple: 'Results from a test', medical: 'Lab result review' },
      { id: 'new', simple: 'Something new is bothering me', medical: 'New symptom' },
      { id: 'medq', simple: 'A question about my medicine', medical: 'Medication question' },
      { id: 'other', simple: 'Something else', medical: 'Other' },
    ] as Choice[],
  },
  insurance: {
    num: 5,
    simple: { title: 'Is this the same insurance card as last time?', sub: '' },
    medical: { title: 'Verify coverage: same payer and member ID as on file?', sub: '' },
    choices: [
      { id: 'same', simple: 'Yes, same card', medical: 'Same payer and member ID' },
      { id: 'new', simple: 'I have a new card', medical: 'Coverage changed' },
      { id: 'none', simple: 'I don’t have insurance now', medical: 'Self-pay' },
    ] as Choice[],
  },
}

export type MedStatus = 'taking' | 'stopped' | 'changed'
export type Med = { id: string; name: string; dose: string; sig: { simple: string; medical: string }; added?: boolean }

export const starterMeds: Med[] = [
  { id: 'lis', name: 'Lisinopril', dose: '10 mg tablet', sig: { simple: '1 pill every morning', medical: '1 tab PO daily (AM)' } },
  { id: 'met', name: 'Metformin', dose: '500 mg tablet', sig: { simple: '1 pill with breakfast and dinner', medical: '1 tab PO BID with meals' } },
  { id: 'ato', name: 'Atorvastatin', dose: '20 mg tablet', sig: { simple: '1 pill at bedtime', medical: '1 tab PO QHS' } },
]

export const medSuggestions = ['Aspirin 81 mg', 'Vitamin D', 'Omeprazole 20 mg', 'Levothyroxine', 'Amlodipine 5 mg']
