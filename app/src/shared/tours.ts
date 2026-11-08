import type { TourStep } from './Tour'

/* The steps for the two guided tours. Each `done` check reads data attributes the apps put on
   the page (data-screen, data-route and so on), so the tour never reaches into app state. */

const attr = (name: string) => document.querySelector(`[data-${name}]`)?.getAttribute(`data-${name}`) ?? ''
const screen = () => attr('screen')
const route = () => attr('route')

export const patientTour: TourStep[] = [
  {
    title: 'Start like a patient would',
    body: 'Tap “I’m at the clinic, start”. In real life, the phone already knows the patient is at the clinic.',
    target: '[data-tour="start"]',
    done: () => !['', 'arrival', 'desk'].includes(screen()),
  },
  {
    title: 'One question per screen',
    body: 'Pick an answer, then tap Next. Nothing moves on until the patient chooses to.',
    target: '[data-tour="choices"]',
    done: () => !['', 'arrival', 'contact', 'desk'].includes(screen()),
  },
  {
    title: 'This answer sets the wording',
    body: 'On question 2, pick “Not really”. The note under the answers says the next question will use simple words.',
    target: '[data-tour="choices"]',
    done: () => !!document.querySelector('input[name="meds"][value="no"]:checked'),
  },
  {
    title: 'Now the other way',
    body: 'Pick “Yes, I know them”, then tap Next. Instead of the simple question, you get the medication list in medical terms.',
    target: '[data-tour="choices"]',
    done: () => screen() === 'medlist',
  },
  {
    title: 'Switch the wording yourself',
    body: 'Tap Simple words. The screen changes to the simple question. The wording follows answers, never age, and the patient can always switch.',
    target: '[data-tour="wording"]',
    done: () => attr('wording-by') === 'patient',
  },
  {
    title: 'Help comes to the patient',
    body: 'Tap “Get help from the desk”. A person walks over, and the answers stay saved. Then tap “Keep going while I wait” to come back.',
    target: '[data-tour="help"]',
    done: () => !['', 'off'].includes(attr('help')),
  },
  {
    title: 'Make it easier to read',
    body: 'Tap Text size. Try Largest, or turn on High contrast. These settings stay on for the whole visit.',
    target: '[data-tour="display"]',
    done: () => !!document.querySelector('.hc') || !['', '100%'].includes(document.documentElement.style.fontSize),
  },
  {
    title: 'That’s the patient side',
    body: 'Finish the check-in if you like. Then see the same morning from the front desk.',
    cta: __SITE__ ? { label: 'Take the clinic tour', href: '../clinic/?tour#/home' } : undefined,
  },
]

export const clinicTour: TourStep[] = [
  {
    title: 'Start at Home',
    body: 'This is the desk’s morning at a glance: arrivals, check-ins, and what needs a person now.',
    target: '[data-page-title]',
  },
  {
    title: 'Jump anywhere',
    body: 'Press Ctrl K (⌘K on a Mac), or click Search. Type a patient’s name, like Warsame. Press Esc to close it.',
    target: '[data-tour="palette"]',
    done: () => !!document.querySelector('[cmdk-input]'),
  },
  {
    title: 'Open the desk board',
    body: 'Use the menu, or press g and then d. The desk runs on the keyboard.',
    target: '[data-tour="nav-desk"]',
    done: () => route() === 'desk',
  },
  {
    title: 'Mark a check-in step',
    body: 'Press 1 to mark the first step for the selected patient. Every change comes with Undo.',
    target: '[data-tour="steps"]',
    done: () => !!document.querySelector('[data-sonner-toast]'),
  },
  {
    title: 'Checks flag; people decide',
    body: 'Open the Review queue. A possible duplicate is waiting. Nothing changes until someone picks a decision and gives a reason.',
    target: '[data-tour="nav-review"]',
    done: () => route() === 'review',
  },
  {
    title: 'Change what the phone asks',
    body: 'Open Question sets. Edit a question and watch its reading level and the phone preview update.',
    target: '[data-tour="nav-questions"]',
    done: () => route() === 'questions',
  },
  {
    title: 'Every decision is logged',
    body: 'Open the Audit log. Each entry records who, what and why, and is stored as a FHIR AuditEvent.',
    target: '[data-tour="nav-audit"]',
    done: () => route() === 'audit',
  },
  {
    title: 'See what changed',
    body: 'Open Insights. Every chart has Show table. The numbers are sample figures until real ones are measured.',
    target: '[data-tour="nav-insights"]',
    done: () => route() === 'insights',
    cta: __SITE__ ? { label: 'Read the case study', href: '../case-study/' } : undefined,
  },
]
