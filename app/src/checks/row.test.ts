import { describe, expect, it } from 'vitest'
import { MASK } from './masking'
import { checkRow, type ExistingRecord, type ReferralRow } from './row'

const today = '2026-10-28'

const records: ExistingRecord[] = [
  { id: 'S-204118', name: 'Aamina Warsame', dob: '03/14/1988', phone: '(507) 555-0142', memberId: 'XJH-448-210' },
  { id: 'S-310077', name: 'Lan Thi Nguyen', dob: '11/02/1975', phone: '(507) 555-0171', memberId: 'KLM-220-114' },
]

/* The seeded problems from the roadmap, with row numbers matching the demo's import file. Each lists exactly the flags it should raise. */
const seeded: { label: string; row: ReferralRow; status: string; checks: string[]; action?: string }[] = [
  { label: 'spelling variant, same person', row: { row: 3, name: 'Amina Warsame Abdi', dob: '03/14/1988', phone: '(507) 555-0142', memberId: 'XJH-448-210' }, status: 'review', checks: ['duplicate'], action: 'compare' },
  { label: 'missing date of birth', row: { row: 7, name: 'J. Okafor', dob: '', phone: '(507) 555-0133' }, status: 'held', checks: ['dob-missing'], action: 'request' },
  { label: 'SSN-shaped number in a note', row: { row: 11, name: 'Rosa Delgado', dob: '07/09/1961', phone: '(507) 555-0120', note: 'Prior chart lists 000-12-3456.' }, status: 'review', checks: ['id-masked'], action: 'mask' },
  { label: 'family name first', row: { row: 14, name: 'Nguyen Thi Lan', dob: '05/05/1990', phone: '(507) 555-0199' }, status: 'note', checks: ['name-order'] },
  { label: 'short phone number', row: { row: 16, name: 'Hamza Yusuf', dob: '01/20/1992', phone: '507-555-014' }, status: 'review', checks: ['phone-length'], action: 'request' },
  { label: 'single legal name', row: { row: 19, name: 'Sukarni', dob: '08/17/1958', phone: '(507) 555-0188' }, status: 'note', checks: ['single-name'] },
  { label: 'date of birth in the future', row: { row: 21, name: 'Marcus Webb', dob: '04/02/2062', phone: '(507) 555-0164' }, status: 'held', checks: ['dob-future'], action: 'fixdate' },
  { label: 'a clean row', row: { row: 1, name: 'Daniel Lee', dob: '02/11/1983', phone: '(507) 555-0101', memberId: 'PQR-100-200', note: 'Annual visit.' }, status: 'ready', checks: [] },
]

describe('the seeded referral problems', () => {
  it.each(seeded)('$label', ({ row, status, checks, action }) => {
    const result = checkRow(row, records, today)
    expect(result.status).toBe(status)
    expect(result.flags.map((f) => f.check)).toEqual(checks)
    expect(result.flags[0]?.action).toBe(action)
  })

  it('points the seeded duplicate at the right record', () => {
    const result = checkRow(seeded[0].row, records, today)
    expect(result.matches.map((m) => m.recordId)).toEqual(['S-204118'])
  })

  it('hands back only the masked note', () => {
    const result = checkRow(seeded[2].row, records, today)
    expect(result.note).toBe(`Prior chart lists ${MASK}.`)
    expect(JSON.stringify(result)).not.toContain('000-12-3456')
  })
})

describe('checkRow()', () => {
  it('reports the worst problem as the row’s status and keeps every flag', () => {
    const result = checkRow({ row: 2, name: 'Sukarni', dob: '04/02/2062', phone: '555', note: '900123456' }, [], today)
    expect(result.status).toBe('held')
    expect(result.flags.map((f) => f.check)).toEqual(['dob-future', 'phone-length', 'id-masked', 'single-name'])
  })

  it('puts the closest record first', () => {
    const row: ReferralRow = { row: 2, name: 'Maria Santos', dob: '01/01/1980', phone: '5075550100' }
    const result = checkRow(
      row,
      [
        { id: 'weaker', name: 'Maria Santos', phone: '5075550100' },
        { id: 'stronger', name: 'Maria Santos', dob: '01/01/1980', phone: '5075550100' },
      ],
      today,
    )
    expect(result.matches.map((m) => m.recordId)).toEqual(['stronger', 'weaker'])
    expect(result.flags).toHaveLength(1)
  })

  it('folds a name-order difference into the duplicate flag when there is one', () => {
    const result = checkRow({ row: 2, name: 'Nguyen Thi Lan', dob: '11/02/1975', phone: '(507) 555-0171' }, records, today)
    expect(result.flags.map((f) => f.check)).toEqual(['duplicate'])
    expect(result.flags[0].finding).toMatch(/different order/)
  })

  /* Principle 3: checks flag; people decide. */
  it('never changes the row or the records it’s given', () => {
    const row = Object.freeze({ ...seeded[0].row })
    const frozen = Object.freeze(records.map((r) => Object.freeze({ ...r }))) as ExistingRecord[]
    expect(() => checkRow(row, frozen, today)).not.toThrow()
    expect(row.name).toBe('Amina Warsame Abdi')
  })

  it('gives the same answer every time for the same input', () => {
    expect(checkRow(seeded[0].row, records, today)).toEqual(checkRow(seeded[0].row, records, today))
  })

  /* Principle 5: spelling variants, family name first and a single legal name are "close" or a "note", never an error. */
  it.each(['Sukarni', 'Nguyen Thi Lan', 'Amina Warsame', 'Muhammad Ali', "Anne-Marie O'Brien", 'Nguyễn Lan'])('never holds a row because of the name “%s”', (name) => {
    const result = checkRow({ row: 2, name, dob: '01/01/1980', phone: '5075550100' }, records, today)
    expect(result.flags.some((f) => f.severity === 'held')).toBe(false)
  })
})
