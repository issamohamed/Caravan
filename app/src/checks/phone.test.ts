import { describe, expect, it } from 'vitest'
import { checkPhone, phoneDigits } from './phone'

describe('phoneDigits()', () => {
  it('keeps only the digits and drops a US country code', () => {
    expect(phoneDigits('(507) 555-0142')).toBe('5075550142')
    expect(phoneDigits('+1 507 555 0142')).toBe('5075550142')
    expect(phoneDigits(null)).toBe('')
  })
})

describe('checkPhone()', () => {
  it.each(['(507) 555-0142', '507-555-0142', '+1 507 555 0142', '15075550142'])('accepts %s', (value) => {
    expect(checkPhone(value)).toBeNull()
  })

  it('flags a short number for review (the seeded problem)', () => {
    expect(checkPhone('507-555-014')).toEqual({ check: 'phone-length', severity: 'review', finding: 'Phone number has 9 digits. One digit may be missing.', action: 'request' })
  })

  it('flags other wrong lengths, and says what to check', () => {
    expect(checkPhone('5075550142999')?.finding).toBe('Phone number has 13 digits. It may have extra digits.')
    expect(checkPhone('555')?.finding).toBe('Phone number has 3 digits. Some digits may be missing.')
    expect(checkPhone('5')?.finding).toBe('Phone number has 1 digit. Some digits may be missing.')
  })

  it.each(['', '  ', null, undefined])('doesn’t flag a blank phone (%s)', (value) => {
    expect(checkPhone(value)).toBeNull()
  })
})
