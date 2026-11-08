import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../shared/util'
import { SampleTag, Section, SiteFooter, SiteHeader } from './SiteChrome'
import { screenPath, shotPath, type AppKind } from './screens'

const ROOT = '../'
const href = (app: AppKind, id: string) => ROOT + screenPath(app, id)
const img = (app: AppKind | 'mockup', id: string) => ROOT + shotPath(app, id)

const PROBLEMS: { problem: string; answer: string; links: { label: string; app: AppKind; id: string }[] }[] = [
  {
    problem: 'Many older patients avoid self check-in kiosks and line up at the desk instead.',
    answer: 'Patients check in on their own phone: one question per screen, big type, read aloud, and wording that follows their answers. If they get stuck, “Get help from the desk” brings a person to them.',
    links: [
      { label: 'Arrival', app: 'patient', id: 'arrival' },
      { label: 'Help requested', app: 'patient', id: 'help' },
    ],
  },
  {
    problem: 'Staff retype referral data by hand, which is slow and error-prone.',
    answer: 'Imports take the file as it comes. Columns are mapped to FHIR fields once, every row is checked, and people only touch the rows that need them.',
    links: [{ label: 'Imports', app: 'clinic', id: 'imports' }],
  },
  {
    problem: 'Duplicate charts appear when a name is spelled differently, or written in a different order.',
    answer: 'Names are compared with care. Spelling variants, family name first and a single legal name count as “close”, never as errors. A person decides, with a reason.',
    links: [{ label: 'Review queue', app: 'clinic', id: 'review' }],
  },
  {
    problem: 'Expired insurance is found after the visit instead of at the desk.',
    answer: 'The patient confirms their card, or takes a photo of a new one, before they reach the counter. Coverage problems show on the desk board as a flag while the patient is still there.',
    links: [
      { label: 'Insurance card', app: 'patient', id: 'insurance' },
      { label: 'Desk board', app: 'clinic', id: 'desk' },
    ],
  },
  {
    problem: 'The desk repeats the same steps all day, and some of them could be done before the patient arrives.',
    answer: 'Routines list the steps for each kind of visit. Steps a phone check-in already settled are done before arrival, and number keys mark the rest.',
    links: [
      { label: 'Routines', app: 'clinic', id: 'routines' },
      { label: 'Desk board', app: 'clinic', id: 'desk' },
    ],
  },
]

const PRINCIPLES: [string, string][] = [
  ['Wording follows the patient’s answers, never their age.', 'Question 2 picks simple words or medical terms for what follows. Every question screen has a switch, and nothing reads age, language, race or disability.'],
  ['Help brings a person to the patient.', 'No screen ever sends a patient back to stand in line. Checking in at the desk is always an option.'],
  ['Checks flag; people decide.', 'Nothing is merged, changed or deleted automatically.'],
  ['Every decision has a reason and an audit entry.', 'Each one is stored as a FHIR AuditEvent, and every change in the web app can be undone.'],
  ['Names are compared with care.', 'Different spellings and name orders are a “close” match or a note, never an error.'],
  ['ID-shaped numbers in free text are masked.', 'They are never stored unmasked.'],
  ['The clinic can change questions without an app release.', 'Question sets are versioned FHIR Questionnaires, with both wordings side by side.'],
  ['Accessibility is part of the feature.', 'Large text, high contrast, calm motion, read aloud, real buttons and radios, and a chart table behind every chart.'],
]

const STAGES: { n: number; name: string; what: string; status: 'Done' | 'Now' | 'Next' | 'Later' }[] = [
  { n: 0, name: 'Interactive demo', what: 'Both apps, working in the browser on made-up data.', status: 'Done' },
  { n: 1, name: 'Gallery and foundations', what: 'This site, a guided tour, unit tests, accessibility checks and CI.', status: 'Now' },
  { n: 2, name: 'Synthetic FHIR data', what: 'Generated patients on a local FHIR server, and the checks as tested, pure functions.', status: 'Next' },
  { n: 3, name: 'Public sandboxes', what: 'Standard SMART on FHIR sign-in against public developer sandboxes with synthetic patients.', status: 'Later' },
  { n: 4, name: 'Live desk', what: 'A small API, so a phone check-in shows up on the desk board within a second.', status: 'Later' },
  { n: 5, name: 'Measured results', what: 'Real event data, SQL views and a usability study with older adults. Every sample figure is replaced.', status: 'Later' },
]

export function CaseStudy() {
  return (
    <div className="ground-glow min-h-dvh font-sans text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-solid">
        Skip to content
      </a>
      <SiteHeader root={ROOT} current="case-study" />

      <main id="main" className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="max-w-[820px] pb-2 pt-12 sm:pt-16">
          <p className="text-[14px] font-semibold text-accent-fg">Case study</p>
          <h1 className="mt-3 font-logo text-[clamp(2.6rem,6.5vw,4.6rem)] font-normal leading-[1] tracking-[-0.015em]">Check-in, redesigned from the front desk.</h1>
          <p className="mt-5 text-[19px] leading-relaxed text-fg-muted">
            Caravan is a concept project by a front-desk specialist in primary care. It asks one question: what would check-in look like if it worked for the patients who avoid the kiosk, and for the staff who repeat the same steps all day?
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <SampleTag />
            <span className="inline-flex rounded-full bg-review-bg px-3.5 py-1.5 text-[13px] font-medium text-review-fg">Numbers are sample figures until Stage 5</span>
          </div>
        </div>

        <Section id="desk-h" title="The view from the desk">
          <Prose>
            <p>A primary care front desk runs on repetition. Confirm the phone number. Ask about insurance. Scan the card. Check the referral. Then do it again for the next person in line, all morning.</p>
            <p>
              Self check-in kiosks were meant to shorten that line, but many older patients walk past the kiosk and wait for a person instead. A kiosk asks everyone the same questions in the same words, and when someone gets stuck, the
              answer is usually to go and stand in line.
            </p>
            <p>Behind the counter, the problems are quieter. Referral data is typed in by hand. A name spelled two ways becomes two charts. Insurance that ran out is found after the visit, when it is hardest to fix.</p>
          </Prose>
        </Section>

        <Section id="problems-h" title="Five problems, five answers" intro="Each problem comes from the desk. Each answer is a screen you can open and use.">
          <ol className="mt-6 grid gap-4 lg:grid-cols-2">
            {PROBLEMS.map((p, i) => (
              <li key={p.problem} className="glass flex flex-col rounded-[26px] p-6">
                <p className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[14px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="font-display text-[18px] font-semibold leading-snug">{p.problem}</span>
                </p>
                <p className="mt-3 text-[15.5px] leading-relaxed text-fg-muted">{p.answer}</p>
                <p className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-[14px]">
                  <span className="text-fg-muted">See it:</span>
                  {p.links.map((l) => (
                    <a key={l.label} href={href(l.app, l.id)} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-white/70 px-3.5 font-medium text-accent-fg hover:bg-white">
                      {l.label} <ArrowRight size={14} aria-hidden="true" />
                    </a>
                  ))}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="before-h" title="Before and after" intro="The “before” is described in words: this project never shows screens from a real health system.">
          <div className="mt-6 flex flex-col gap-5">
            <BeforeAfter
              before="One wording for everyone. A kiosk asks every patient the same question, often in the clinic’s own words."
              after="The answer to question 2 picks the wording for what follows. Simple words for someone unsure of their medicines; the medication list in medical terms for someone who knows it. The patient can switch on any screen."
            >
              <Shot src={img('patient', 'brought')} app="patient" caption="Simple words" />
              <Shot src={img('patient', 'medlist')} app="patient" caption="Medical terms" />
            </BeforeAfter>
            <BeforeAfter
              before="Stuck means back in line. When the kiosk can’t help, the patient leaves it and waits for the desk."
              after="Help comes to the patient. The request reaches the desk, a named person walks over, and the answers stay saved."
            >
              <Shot src={img('patient', 'help')} app="patient" caption="Help requested" />
              <Shot src={img('clinic', 'phone')} app="clinic" caption="What the desk sees" />
            </BeforeAfter>
            <BeforeAfter
              before="Retyping referrals. Each row of a referral file is typed into the record by hand, and mistakes travel with it."
              after="The file is mapped once and checked row by row. Possible duplicates and odd values wait in a review queue for a person to decide."
            >
              <Shot src={img('clinic', 'imports')} app="clinic" caption="Imports" />
              <Shot src={img('clinic', 'review')} app="clinic" caption="Review queue" />
            </BeforeAfter>
            <BeforeAfter before="The first static mockup of the desk board, drawn before any code." after="The working desk board: arrivals, check-in steps on number keys, and flags with a reason and an Undo.">
              <Shot src={img('mockup', 'desk-board')} app="clinic" caption="First mockup" />
              <Shot src={img('clinic', 'desk')} app="clinic" caption="Working app" />
            </BeforeAfter>
          </div>
        </Section>

        <Section id="principles-h" title="The rules the build keeps" intro="The project’s ground rules. Unit tests cover some of them, such as rule 1; the rest are design rules for every screen.">
          <ol className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
            {PRINCIPLES.map(([rule, why], i) => (
              <li key={rule} className="flex gap-4">
                <span aria-hidden="true" className="font-logo text-[30px] leading-none text-accent-fg">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-display text-[17.5px] font-semibold leading-snug">{rule}</span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-fg-muted">{why}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="measure-h" title="How it will be measured">
          <Prose>
            <p>
              The <a href={href('clinic', 'insights')}>Insights page</a> shows the measures Caravan is meant to move. Today they are sample figures, and they are labeled that way. In Stage 5, they will be computed from event data with SQL
              views over a small star schema, and checked in a usability study with older adults.
            </p>
          </Prose>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Where patients stop', 'A check-in funnel, from arrival to checked in.'],
              ['Help requests by question', 'Which question version people needed help with, so the wording can be fixed.'],
              ['Fairness check', 'Who gets which wording, by age group. This keeps rule 1 honest: older patients shouldn’t be pushed into simple words.'],
              ['Check-in time by hour', 'Minutes from arrival to checked in, before and with Caravan.'],
            ].map(([t, d]) => (
              <li key={t} className="glass rounded-[22px] p-5">
                <span className="block font-display text-[17px] font-semibold">{t}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-fg-muted">{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="skills-h" title="What this project shows">
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ['Workflow analysis', 'Mapping the check-in the desk repeats all day, and moving steps to before the patient arrives.'],
              ['Build design', 'Routines and question sets as configuration the clinic owns, versioned and audited, not code.'],
              ['Data quality', 'Imports with checks, careful name matching, masking of ID-shaped numbers, and a review queue where people decide.'],
              [
                'Standards',
                'FHIR R4 throughout: Appointment, Coverage, Questionnaire and QuestionnaireResponse, Communication for help requests, and AuditEvent for every decision. Today every write is simulated, and the patient app shows what would be sent.',
              ],
              ['Measurement', 'A funnel, help by question and a fairness check, with SQL views planned behind each chart.'],
              ['Accessibility', 'WCAG 2.2 AA as the floor, with automated checks on every screen and a manual screen reader pass planned for Stage 5.'],
            ].map(([t, d]) => (
              <li key={t} className="glass rounded-[22px] p-5">
                <span className="block font-display text-[17px] font-semibold">{t}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-fg-muted">{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="roadmap-h" title="Roadmap" intro="Each stage leaves something that works on its own.">
          <ol className="mt-6 flex flex-col gap-2.5">
            {STAGES.map((st) => (
              <li key={st.n} className="glass flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[22px] px-5 py-4">
                <span className="w-20 shrink-0 font-mono text-[14px] text-fg-muted">Stage {st.n}</span>
                <span className="min-w-[12rem] flex-1">
                  <span className="block font-display text-[17px] font-semibold">{st.name}</span>
                  <span className="block text-[15px] text-fg-muted">{st.what}</span>
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[13px] font-semibold',
                    st.status === 'Done' && 'bg-done-bg text-done-fg',
                    st.status === 'Now' && 'bg-hot text-white',
                    st.status === 'Next' && 'bg-review-bg text-review-fg',
                    st.status === 'Later' && 'bg-note-bg text-note-fg',
                  )}
                >
                  {st.status}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-[68ch] text-[15px] leading-relaxed text-fg-muted">Out of scope for good: real patient data, connecting to a production EHR, billing, and clinical decision support.</p>
        </Section>

        <section aria-labelledby="try-h" className="mt-16 rounded-[30px] bg-teal-deep p-7 text-white sm:p-9">
          <h2 id="try-h" className="font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold">
            Try it yourself
          </h2>
          <p className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-white/85">Both apps run right here in the browser, on sample data. Nothing you do is saved.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`${ROOT}patient/?tour#arrival`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-hot px-6 text-[15px] font-semibold text-white hover:bg-hot-600">
              Take the patient tour
            </a>
            <a href={`${ROOT}clinic/?tour#/home`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-teal-deep hover:bg-mist">
              Take the clinic tour
            </a>
            <a href={ROOT} className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-white ring-1 ring-white/40 hover:bg-white/10">
              Browse every screen
            </a>
          </div>
        </section>
      </main>

      <SiteFooter root={ROOT} />
    </div>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex max-w-[68ch] flex-col gap-4 text-[17px] leading-relaxed text-ink [&_a]:font-medium [&_a]:text-accent-fg [&_a]:underline [&_a]:underline-offset-2">{children}</div>
}

function BeforeAfter({ before, after, children }: { before: string; after: string; children: ReactNode }) {
  return (
    <div className="glass grid gap-6 rounded-[28px] p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:p-7">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[13px] font-semibold text-fg-muted">Before</p>
          <p className="mt-1 text-[16px] leading-relaxed">{before}</p>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-teal-fg">After, with Caravan</p>
          <p className="mt-1 text-[16px] leading-relaxed">{after}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 items-start gap-4">{children}</div>
    </div>
  )
}

function Shot({ src, app, caption }: { src: string; app: AppKind; caption: string }) {
  return (
    <figure className="m-0">
      <img
        src={src}
        alt={`Screenshot: ${caption}`}
        loading="lazy"
        decoding="async"
        width={app === 'patient' ? 390 : 1280}
        height={app === 'patient' ? 844 : 800}
        className={cn('w-full rounded-[18px] bg-blush-100 shadow-[0_18px_36px_-20px_rgb(122_22_66/0.5)] ring-1 ring-white/70', app === 'patient' && 'mx-auto max-w-[220px]')}
      />
      <figcaption className="mt-2 text-center text-[14px] text-fg-muted">{caption}</figcaption>
    </figure>
  )
}
