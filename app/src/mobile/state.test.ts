import { describe, expect, it } from 'vitest'
import { emptyAnswers, preset, reducer, SCREENS, type Action, type Answers, type State } from './state'

const at = '9:20:00 AM'
const run = (s: State, ...acts: Action[]) => acts.reduce(reducer, s)
const next: Action = { type: 'next', at }
const answer = (patch: Partial<Answers>): Action => ({ type: 'answer', patch })

describe('presets', () => {
  it.each(SCREENS)('%s opens on a real screen with a history that leads to it', (route) => {
    const s = preset(route, at)
    expect(SCREENS).toContain(s.screen)
    expect(s.history).not.toContain(s.screen)
    expect(s.events.length).toBeGreaterThan(0)
  })

  it('opens the help screen on question 2 with help already requested', () => {
    const s = preset('help', at)
    expect(s.screen).toBe('meds')
    expect(s.help).toBe('open')
    expect(s.events[0].kind).toBe('help')
  })

  it('opens the medical terms screen with the medical wording', () => {
    expect(preset('medlist', at)).toMatchObject({ screen: 'medlist', wording: 'medical', wordingBy: 'answer' })
  })
})

describe('moving through the questions', () => {
  it('never moves on without an answer, and nudges instead', () => {
    const s = run(preset('contact', at), next)
    expect(s.screen).toBe('contact')
    expect(s.nudge).toBe(1)
    expect(run(s, next).nudge).toBe(2)
  })

  it('clears the nudge once the patient answers', () => {
    const s = run(preset('contact', at), next, answer({ contact: 'same' }))
    expect(s.nudge).toBe(0)
  })

  it('logs each answer as a QuestionnaireResponse item', () => {
    const s = run(preset('contact', at), answer({ contact: 'same' }), next)
    expect(s.screen).toBe('meds')
    expect(s.events[0]).toMatchObject({ kind: 'fhir', resource: 'QuestionnaireResponse item 1' })
  })

  it('marks the appointment as arrived when the patient starts', () => {
    const s = run(preset('arrival', at), next)
    expect(s.screen).toBe('contact')
    expect(s.events[0].resource).toBe('Appointment.status = arrived')
  })
})

/* Principle 1: the wording follows the patient's answers, never their age. */
describe('question 2 sets the wording', () => {
  const after = (meds: 'yes' | 'some' | 'no' | 'none') => run(preset('meds', at), answer({ meds }), next)

  it('“Yes, I know them” leads to the medication list in medical terms', () => {
    expect(after('yes')).toMatchObject({ screen: 'medlist', wording: 'medical', wordingBy: 'answer' })
  })

  it.each(['some', 'no'] as const)('“%s” leads to the pill-bottle question in simple words', (meds) => {
    expect(after(meds)).toMatchObject({ screen: 'brought', wording: 'simple', wordingBy: 'answer' })
  })

  it('“I don’t take any” skips question 3', () => {
    expect(after('none').screen).toBe('reason')
  })

  it('keeps a wording the patient chose themselves', () => {
    const s = run(preset('meds', at), { type: 'wording', wording: 'simple', at }, answer({ meds: 'yes' }), next)
    expect(s).toMatchObject({ screen: 'brought', wording: 'simple', wordingBy: 'patient' })
  })

  it('has no age, birth date or other demographic in the state it decides from', () => {
    const keys = [...Object.keys(preset('meds', at)), ...Object.keys(emptyAnswers())].map((k) => k.toLowerCase())
    for (const banned of ['age', 'dob', 'birth', 'language', 'race', 'disability']) expect(keys.some((k) => k.includes(banned))).toBe(false)
  })
})

describe('the wording switch', () => {
  it('swaps question 3 between its two versions', () => {
    const toMedical = run(preset('brought', at), { type: 'wording', wording: 'medical', at })
    expect(toMedical).toMatchObject({ screen: 'medlist', wording: 'medical', wordingBy: 'patient' })
    const back = run(toMedical, { type: 'wording', wording: 'simple', at })
    expect(back.screen).toBe('brought')
  })

  it('tells the desk the patient switched', () => {
    const s = run(preset('contact', at), { type: 'wording', wording: 'medical', at })
    expect(s.events[0].text).toMatch(/switched wording to medical terms/)
  })
})

describe('changing an answer from the review screen', () => {
  it('goes straight back to the review screen after saving', () => {
    const s = run(preset('review', at), { type: 'editFromReview', screen: 'contact' }, answer({ contact: 'changed' }), next)
    expect(s.screen).toBe('review')
    expect(s.editingFromReview).toBe(false)
    expect(s.history.filter((h) => h === 'review')).toHaveLength(0)
  })

  it('Back from the edited question returns to review too', () => {
    const s = run(preset('review', at), { type: 'editFromReview', screen: 'reason' }, { type: 'back' })
    expect(s.screen).toBe('review')
    expect(s.editingFromReview).toBe(false)
  })
})

describe('Back', () => {
  it('does nothing on the first screen', () => {
    const s = preset('arrival', at)
    expect(run(s, { type: 'back' })).toBe(s)
  })

  it('returns to the previous screen', () => {
    expect(run(preset('meds', at), { type: 'back' }).screen).toBe('contact')
  })
})

/* Principle 2: help brings a person to the patient, and nothing is lost. */
describe('help from the desk', () => {
  it('logs one help request and keeps the answers', () => {
    const start = run(preset('reason', at), answer({ reason: 'bp' }))
    const s = run(start, { type: 'help', mode: 'open', at })
    expect(s.help).toBe('open')
    expect(s.screen).toBe('reason')
    expect(s.answers).toEqual(start.answers)
    expect(s.events.filter((e) => e.kind === 'help')).toHaveLength(1)
  })

  it('minimising and reopening doesn’t send a second request', () => {
    const s = run(preset('contact', at), { type: 'help', mode: 'open', at }, { type: 'help', mode: 'min', at }, { type: 'help', mode: 'open', at })
    expect(s.events.filter((e) => e.kind === 'help')).toHaveLength(1)
  })

  it('cancelling tells the desk', () => {
    const s = run(preset('contact', at), { type: 'help', mode: 'open', at }, { type: 'helpCancel', at })
    expect(s.help).toBe('off')
    expect(s.events[0].resource).toBe('Communication.status = revoked')
  })
})

describe('sending the check-in', () => {
  it('finishes on the done screen and closes any help request', () => {
    const s = run(preset('review', at), { type: 'help', mode: 'min', at }, { type: 'send', at })
    expect(s).toMatchObject({ screen: 'done', history: [], help: 'off', sentAt: at })
    expect(s.events[0].resource).toBe('QuestionnaireResponse.status = completed')
  })
})
