import { Download, ExternalLink, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { downloadText, toCsv } from '../../shared/util'
import { ChartFrame, Funnel, GroupedBars, LineCompare, StackedPercent } from '../charts'
import { ageBands, checkinByHour, funnel, helpByQuestion } from '../data'
import { Button, Card, Chip, H2, PageHeader } from '../ui'

export function Insights() {
  const completion = Math.round((funnel[funnel.length - 1].n / funnel[0].n) * 100)
  const q5drop = Math.round((1 - helpByQuestion[4].v4 / helpByQuestion[4].v3) * 100)
  const exportAll = () => {
    const rows = [
      ...funnel.map((f) => ({ chart: 'funnel', key: f.step, value: f.n, extra: '' })),
      ...helpByQuestion.map((h) => ({ chart: 'help_by_question', key: h.q, value: h.v4, extra: `v3=${h.v3}` })),
      ...ageBands.map((a) => ({ chart: 'wording_by_age', key: a.band, value: a.medical, extra: `completion=${a.completion};help=${a.help};n=${a.n}` })),
      ...checkinByHour.map((c) => ({ chart: 'checkin_minutes_by_hour', key: c.h, value: c.after, extra: `before=${c.before}` })),
    ]
    if (downloadText('caravan-insights.csv', toCsv(rows))) toast.success('Chart data downloaded. It loads straight into Tableau Public or Power BI.')
  }
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={<Chip tone="review">Synthetic data · last 30 days · Desk 2 and Desk 4</Chip>}
        title="Insights"
        description="Where patients drop off, which questions need help, and whether the wording rule treats every age group fairly."
        actions={
          <>
            <Button icon={<Download size={16} aria-hidden="true" />} onClick={exportAll}>
              Export data
            </Button>
            <Button variant="teal" icon={<ExternalLink size={15} aria-hidden="true" />} onClick={() => toast('Demo: this would open the published Tableau Public workbook.')}>
              Open in Tableau
            </Button>
          </>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key numbers">
        {[
          ['412', 'phone check-ins started'],
          [`${completion}%`, 'finished on the phone'],
          ['2m 35s', 'average check-in, was 4m 10s'],
          ['5.1%', 'asked for help at least once'],
        ].map(([n, l], i) => (
          <li key={l} className={i === 1 ? 'glass rounded-[24px] !bg-mist-bg p-5' : 'glass rounded-[24px] p-5'}>
            <p className="font-display text-[34px] font-semibold leading-none tabular">{n}</p>
            <p className="mt-1.5 text-sm text-fg-muted">{l}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title="Where patients stop"
          subtitle={`${funnel[0].n - funnel[funnel.length - 1].n} of ${funnel[0].n} didn’t finish. The biggest drop is at the medicine follow-up.`}
          table={{ head: ['Step', 'Patients', 'Dropped'], rows: funnel.map((f, i) => [f.step, f.n, i ? funnel[i - 1].n - f.n : '—']) }}
        >
          <Funnel data={funnel} />
        </ChartFrame>
        <ChartFrame title="Help requests by question" subtitle={`Rewording the insurance question in v4 cut its help requests by ${q5drop}%.`} table={{ head: ['Question', 'v3', 'v4'], rows: helpByQuestion.map((h) => [h.q, h.v3, h.v4]) }}>
          <GroupedBars data={helpByQuestion} a="v3" b="v4" aLabel="Version 3" bLabel="Version 4" max={25} />
        </ChartFrame>
      </div>

      <ChartFrame
        title="Fairness check: who gets which wording"
        subtitle="Wording follows answers, not age. This checks that older patients aren’t pushed into simple words, and shows where help is still needed."
        table={{ head: ['Age', 'Medical terms', 'Simple words', 'Finished', 'Asked for help', 'Patients'], rows: ageBands.map((a) => [a.band, `${a.medical}%`, `${100 - a.medical}%`, `${a.completion}%`, `${a.help}%`, a.n]) }}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="mb-3 flex gap-4 text-[12px] text-fg-muted" aria-hidden="true">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-teal-deep dark:bg-teal" /> Chose medical terms
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-hot-100 ring-1 ring-hot/40" /> Chose simple words
              </span>
            </div>
            <StackedPercent
              rows={ageBands.map((a) => ({
                label: a.band,
                a: a.medical,
                aLabel: 'Medical',
                bLabel: 'Simple',
                extra: (
                  <span className="flex gap-1.5 text-[12px]">
                    <Chip tone="info">{a.completion}% finished</Chip>
                    <Chip tone={a.help > 10 ? 'review' : 'info'}>{a.help}% help</Chip>
                  </span>
                ),
              }))}
            />
          </div>
          <Card className="!bg-mist-bg self-start p-5">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-fg">
              <Scale size={14} aria-hidden="true" /> What this shows
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-teal-fg">
              <li>A third of patients over 80 chose medical terms. The app didn’t assume.</li>
              <li>Patients 80 and older ask for help about 2.4× the average, mostly on the medicine follow-up.</li>
              <li>Next to try: a photo option for pill bottles on question 3.</li>
            </ul>
          </Card>
        </div>
      </ChartFrame>

      <ChartFrame
        title="Check-in time by hour"
        subtitle="Minutes from arrival to checked in. Hover a point to compare."
        table={{ head: ['Hour', 'Before (min)', 'With Caravan (min)'], rows: checkinByHour.map((c) => [`${c.h}:00`, c.before, c.after]) }}
      >
        <LineCompare data={checkinByHour} />
      </ChartFrame>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="max-w-2xl">
          <H2>How these numbers are made</H2>
          <p className="mt-1 text-sm text-fg-muted">
            Every phone answer and desk step is an event. Events land in a small star schema (check-ins, steps, help requests, import rows), and each chart reads from a SQL view. The same views feed the Tableau Public workbook.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 font-mono text-[12px]">
          {['fact_checkin', 'fact_step_event', 'fact_help_request', 'dim_patient', 'dim_question_version'].map((t) => (
            <span key={t} className="rounded-full bg-surface-strong px-3 py-1.5 ring-1 ring-line">
              {t}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
