import type { Flag } from './types'

/** Just the digits, without a leading US country code. */
export function phoneDigits(value?: string | null) {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

/** A US phone number has 10 digits. A blank phone isn't flagged: there's nothing to get wrong. */
export function checkPhone(value?: string | null): Flag | null {
  if (!value?.trim()) return null
  const count = phoneDigits(value).length
  if (count === 10) return null
  const next = count === 9 ? 'One digit may be missing.' : count > 10 ? 'It may have extra digits.' : 'Some digits may be missing.'
  return { check: 'phone-length', severity: 'review', finding: `Phone number has ${count} digit${count === 1 ? '' : 's'}. ${next}`, action: 'request' }
}
