import type { Flag } from './types'

/* Hides ID-shaped numbers in free text. The result never keeps the original number, so it can't be stored by accident.
   It catches SSN-shaped numbers and runs of 9 or more digits. A bare 10-digit run could be a phone number or an ID,
   so it's hidden to be safe. Formatted phone numbers, dates and ZIP codes are left alone. */

export const MASK = '[number hidden]'

const SSN_SHAPED = /(?<!\d)\d{3}[- .]\d{2}[- .]\d{4}(?!\d)/g
const LONG_RUN = /(?<!\d)\d{9,}(?!\d)/g

export function maskIds(text: string) {
  let ssnShaped = 0
  let other = 0
  const masked = text
    .replace(SSN_SHAPED, () => {
      ssnShaped++
      return MASK
    })
    .replace(LONG_RUN, (run) => {
      if (run.length === 9) ssnShaped++
      else other++
      return MASK
    })
  return { text: masked, ssnShaped, other }
}

/** Masks a referral note and flags it for a person to confirm. */
export function checkNote(note?: string | null): { text: string | null; flag: Flag | null } {
  if (!note) return { text: note ?? null, flag: null }
  const { text, ssnShaped, other } = maskIds(note)
  const total = ssnShaped + other
  if (!total) return { text, flag: null }
  const finding =
    total > 1
      ? `The referral note held ${total} numbers shaped like IDs. They were masked in the staged copy.`
      : ssnShaped
        ? 'The referral note held a 9-digit number shaped like an SSN. It was masked in the staged copy.'
        : 'The referral note held a number shaped like an ID. It was masked in the staged copy.'
  return { text, flag: { check: 'id-masked', severity: 'review', finding, action: 'mask' } }
}
