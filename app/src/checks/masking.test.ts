import { describe, expect, it } from 'vitest'
import { checkNote, MASK, maskIds } from './masking'

/* Test numbers start with 000 or 900, which are never issued as real SSNs. */

describe('maskIds()', () => {
  it.each(['000-12-3456', '000 12 3456', '000.12.3456', '000123456', 'SSN:000123456', 'SSN-000-12-3456', 'ID000123456'])('hides %s', (value) => {
    const result = maskIds(value)
    expect(result.text).toContain(MASK)
    expect(result.text).not.toMatch(/\d{4}/)
    expect(result.ssnShaped).toBe(1)
  })

  it('hides longer runs of digits and counts them separately', () => {
    expect(maskIds('Account 90000000012345')).toEqual({ text: `Account ${MASK}`, ssnShaped: 0, other: 1 })
  })

  it('keeps the words around the number', () => {
    expect(maskIds('Patient gave SSN 000-12-3456 at intake.').text).toBe(`Patient gave SSN ${MASK} at intake.`)
  })

  it('hides every number in the note', () => {
    expect(maskIds('000-12-3456 and 900123456').ssnShaped).toBe(2)
  })

  it.each(['Call (507) 555-0142', 'Call 507-555-0142', 'Call 507.555.0142', 'Seen 03/14/1988', 'On 2026-10-28', 'ZIP 55901-1234', 'Metformin 500 mg', 'A1C 7.2', 'Ref 12345678'])('leaves %s alone', (value) => {
    expect(maskIds(value)).toEqual({ text: value, ssnShaped: 0, other: 0 })
  })
})

/* Principle 6: ID-shaped numbers are never stored unmasked. */
describe('checkNote()', () => {
  it('masks the seeded SSN-shaped number and flags it for a person to confirm', () => {
    const result = checkNote('Prior chart lists SSN 000-12-3456, please update.')
    expect(result.text).toBe(`Prior chart lists SSN ${MASK}, please update.`)
    expect(result.flag).toEqual({ check: 'id-masked', severity: 'review', finding: 'The referral note held a 9-digit number shaped like an SSN. It was masked in the staged copy.', action: 'mask' })
  })

  it('never keeps the original number anywhere in the result', () => {
    expect(JSON.stringify(checkNote('SSN 000-12-3456 or 900123456'))).not.toMatch(/000-12-3456|900123456|3456/)
  })

  it('words the finding for several numbers, and for other long numbers', () => {
    expect(checkNote('000-12-3456 and 900123456').flag?.finding).toMatch(/held 2 numbers/)
    expect(checkNote('Account 90000000012345').flag?.finding).toMatch(/a number shaped like an ID/)
  })

  it('passes a clean note through unchanged', () => {
    expect(checkNote('Follow up on blood pressure.')).toEqual({ text: 'Follow up on blood pressure.', flag: null })
  })

  it.each(['', null, undefined])('handles an empty note (%s)', (value) => {
    expect(checkNote(value).flag).toBeNull()
  })
})
