import { describe, expect, it } from 'vitest'
import { questions } from '../mobile/content'
import { questionSets } from '../web/data'
import { gradeLabel, readability, toCsv } from './util'

describe('readability()', () => {
  it('rates short, plain sentences as easy', () => {
    expect(readability('Is this still your phone number?').grade).toBeLessThanOrEqual(5)
    expect(readability('Did you bring your pill bottles or a list?').grade).toBeLessThanOrEqual(5)
  })

  it('rates long, technical sentences as hard', () => {
    const hard = readability('Medication reconciliation requires comprehensive verification of pharmacological interventions documented in the electronic health record.')
    expect(hard.grade).toBeGreaterThan(8)
  })

  it('puts the medical wording above the simple wording for the same question', () => {
    expect(readability(questions.meds.medical.title).grade).toBeGreaterThan(readability(questions.meds.simple.title).grade)
  })

  it('counts words and never returns a grade below 1', () => {
    expect(readability('')).toEqual({ grade: 1, words: 0 })
    expect(readability('Yes.').words).toBe(1)
    expect(readability('Hi there. Come in.').grade).toBeGreaterThanOrEqual(1)
  })

  it('ignores numbers and symbols when counting words', () => {
    expect(readability('Call (507) 555-0187 today.').words).toBe(2)
  })
})

describe('gradeLabel()', () => {
  it('maps grades to the three tones used by the question editor', () => {
    expect(gradeLabel(4).tone).toBe('done')
    expect(gradeLabel(7).tone).toBe('review')
    expect(gradeLabel(10).tone).toBe('held')
  })
})

/* Project rule: keep simple wording at grade 5 or below. These guard the copy the patient sees. */
describe('simple wording stays at grade 5 or below', () => {
  const phone = Object.entries(questions).map(([id, q]) => [id, q.simple.title] as const)
  it.each(phone)('patient app question %s', (_id, text) => {
    expect(readability(text).grade).toBeLessThanOrEqual(5)
  })

  const sets = questionSets.flatMap((set) => set.items.map((it) => [`${set.name} · ${it.title}`, it.simple] as const))
  it.each(sets)('question set item %s', (_id, text) => {
    expect(readability(text).grade).toBeLessThanOrEqual(5)
  })
})

describe('toCsv()', () => {
  it('quotes values with commas, quotes or new lines', () => {
    expect(toCsv([{ a: 'x', b: 'y, z' }])).toBe('a,b\nx,"y, z"')
    expect(toCsv([{ a: 'say "hi"' }])).toBe('a\n"say ""hi"""')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})
