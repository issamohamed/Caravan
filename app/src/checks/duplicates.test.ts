import { describe, expect, it } from 'vitest'
import { checkDuplicate, duplicateFlag, type Person } from './duplicates'

const existing: Person = { name: 'Aamina Warsame', dob: '03/14/1988', phone: '(507) 555-0142', memberId: 'XJH-448-210' }
const field = (check: ReturnType<typeof checkDuplicate>, name: string) => check.fields.find((f) => f.field === name)?.result

describe('checkDuplicate()', () => {
  it('flags the seeded duplicate: variant name, everything else matches', () => {
    const check = checkDuplicate({ name: 'Amina Warsame Abdi', dob: '03/14/1988', phone: '(507) 555-0142', memberId: 'XJH-448-210' }, existing)
    expect(check.score).toBe(90)
    expect(check.flagged).toBe(true)
    expect(field(check, 'name')).toBe('close')
  })

  it('compares values, not formatting', () => {
    const check = checkDuplicate({ name: 'Aamina Warsame', dob: '1988-03-14', phone: '507.555.0142', memberId: 'xjh448210' }, existing)
    expect(check.score).toBe(100)
    expect(check.fields.every((f) => f.result === 'same')).toBe(true)
  })

  it('doesn’t flag a shared name on its own, because many people share a name', () => {
    const check = checkDuplicate({ name: 'John Smith', dob: '01/01/1970' }, { name: 'John Smith', dob: '02/02/1980' })
    expect(check.score).toBe(30)
    expect(check.flagged).toBe(false)
  })

  it('flags twins for a person to look at: same birthday and phone, different first name', () => {
    const check = checkDuplicate({ name: 'Daniel Lee', dob: '06/01/2001', phone: '5075550100' }, { name: 'David Lee', dob: '06/01/2001', phone: '5075550100' })
    expect(check.flagged).toBe(true)
    expect(duplicateFlag(check).finding).toContain('but the name is different')
  })

  it('doesn’t flag spouses who share a phone and an insurance plan', () => {
    const check = checkDuplicate({ name: 'Grace Holm', dob: '01/01/1970', phone: '5075550100', memberId: 'ABC123' }, { name: 'Peter Holm', dob: '02/02/1968', phone: '5075550100', memberId: 'ABC123' })
    expect(check.score).toBe(40)
    expect(check.flagged).toBe(false)
  })

  it('gives no points for missing fields, and never takes any away', () => {
    const check = checkDuplicate({ name: 'Aamina Warsame' }, existing)
    expect(check.score).toBe(30)
    expect(field(check, 'dob')).toBe('missing')
    expect(field(check, 'phone')).toBe('missing')
    expect(field(check, 'memberId')).toBe('missing')
  })

  it('reports a name in a different order', () => {
    expect(checkDuplicate({ name: 'Nguyen Thi Lan' }, { name: 'Lan Thi Nguyen' }).nameOrderDiffers).toBe(true)
  })
})

describe('duplicateFlag()', () => {
  it('names what matched and why the name is close, for review, never as an error', () => {
    const flag = duplicateFlag(checkDuplicate({ name: 'Amina Warsame Abdi', dob: '03/14/1988', phone: '(507) 555-0142', memberId: 'XJH-448-210' }, existing))
    expect(flag).toMatchObject({ check: 'duplicate', severity: 'review', action: 'compare' })
    expect(flag.finding).toContain('Possible duplicate. Date of birth, phone and insurance ID match an existing record.')
    expect(flag.finding).toMatch(/common spelling variant/)
  })

  it('uses the singular for one matching field, and notes a same name', () => {
    const flag = duplicateFlag(checkDuplicate({ name: 'John Smith', phone: '5075550100' }, { name: 'John Smith', phone: '5075550100' }))
    expect(flag.finding).toBe('Possible duplicate. Phone matches an existing record, and the name is the same.')
  })
})
