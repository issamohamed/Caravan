/** What a check found. Checks only flag; a person decides what happens next. */
export type Severity = 'held' | 'review' | 'note'

/** The button the desk gets. These are the names the Imports screen already uses. */
export type FlagAction = 'compare' | 'request' | 'mask' | 'fixdate'

export type CheckId = 'duplicate' | 'name-order' | 'single-name' | 'dob-missing' | 'dob-unreadable' | 'dob-future' | 'phone-length' | 'id-masked' | 'coverage-ended' | 'coverage-unreadable'

export type Flag = { check: CheckId; severity: Severity; finding: string; action?: FlagAction }
