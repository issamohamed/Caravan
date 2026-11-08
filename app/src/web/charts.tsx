import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { cn } from '../shared/util'

/** Every chart can flip to a plain table, so the numbers are always reachable. */
export function ChartFrame({
  title,
  subtitle,
  children,
  table,
  actions,
  className,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  table: { head: string[]; rows: (string | number)[][] }
  actions?: ReactNode
  className?: string
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <figure className={cn('glass m-0 flex flex-col rounded-[26px] p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption>
          <span className="block font-display text-[18px] font-semibold tracking-[-0.01em] text-fg">{title}</span>
          {subtitle && <span className="mt-0.5 block text-[13px] text-fg-muted">{subtitle}</span>}
        </figcaption>
        <div className="flex items-center gap-1.5">
          {actions}
          <button onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="h-8 rounded-full border border-line-strong/60 px-3 text-[12px] font-medium text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg">
            {asTable ? 'Show chart' : 'Show table'}
          </button>
        </div>
      </div>
      <div className="mt-5 flex-1">
        {asTable ? (
          <div role="region" aria-label={`${title}: table`} tabIndex={0} className="overflow-x-auto focus-visible:outline-offset-[-3px]">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {table.head.map((h) => (
                    <th key={h} scope="col" className="border-b border-line py-2 pr-4 text-left font-semibold text-fg-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} className="border-b border-line py-2 pr-4 tabular text-fg">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </figure>
  )
}

const grow = { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] as const }

export function Funnel({ data }: { data: { step: string; n: number }[] }) {
  const max = data[0].n
  return (
    <ol className="flex flex-col gap-2.5" aria-hidden="true">
      {data.map((d, i) => {
        const pct = (d.n / max) * 100
        const drop = i > 0 ? data[i - 1].n - d.n : 0
        const big = drop >= 20
        return (
          <li key={d.step} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-[13px] sm:grid-cols-[180px_1fr_auto]">
            <span className="truncate text-fg-muted">{d.step}</span>
            <span className="relative h-7 overflow-hidden rounded-full bg-surface-sunk ring-1 ring-inset ring-line">
              <motion.span
                className={cn('absolute inset-y-0 left-0 rounded-full', i === data.length - 1 ? 'bg-teal dark:bg-teal-300' : 'bg-hot')}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ ...grow, delay: i * 0.05 }}
              />
            </span>
            <span className="flex w-[92px] items-baseline justify-end gap-1.5 tabular">
              <span className="font-semibold text-fg">{d.n}</span>
              {i > 0 && <span className={cn('text-[11px]', big ? 'font-semibold text-accent-fg' : 'text-fg-subtle')}>−{drop}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function GroupedBars({ data, a, b, aLabel, bLabel, max }: { data: { q: string; [k: string]: string | number }[]; a: string; b: string; aLabel: string; bLabel: string; max: number }) {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div>
      <div className="mb-3 flex gap-4 text-[12px] text-fg-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-line-strong/70" /> {aLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-hot" /> {bLabel}
        </span>
      </div>
      <div className="flex h-48 items-end gap-3 border-b border-line pb-px sm:gap-5" aria-hidden="true">
        {data.map((d) => {
          const va = Number(d[a])
          const vb = Number(d[b])
          return (
            <div key={d.q} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(d.q)} onMouseLeave={() => setHover(null)}>
              {hover === d.q && (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white dark:bg-white dark:text-ink">
                  {va} → {vb}
                </span>
              )}
              <div className="flex h-full items-end justify-center gap-1">
                <motion.span className="w-full max-w-7 rounded-t-lg bg-line-strong/60" initial={{ height: 0 }} whileInView={{ height: `${(va / max) * 100}%` }} viewport={{ once: true }} transition={grow} />
                <motion.span
                  className={cn('w-full max-w-7 rounded-t-lg', d.q === 'Q5' ? 'bg-teal dark:bg-teal-300' : 'bg-hot')}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(vb / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ ...grow, delay: 0.1 }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-3 text-center text-[12px] font-medium text-fg-muted sm:gap-5" aria-hidden="true">
        {data.map((d) => (
          <span key={d.q} className="flex-1">
            {d.q}
          </span>
        ))}
      </div>
    </div>
  )
}

export function StackedPercent({ rows }: { rows: { label: string; a: number; aLabel: string; bLabel: string; extra?: ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[52px_1fr] items-center gap-3 sm:grid-cols-[64px_1fr_auto]">
          <span className="text-[13px] font-semibold text-fg">{r.label}</span>
          <div className="flex h-8 overflow-hidden rounded-full ring-1 ring-inset ring-line">
            <motion.span
              className="flex items-center bg-teal-deep pl-3 text-[11px] font-semibold text-white dark:bg-teal"
              initial={{ width: 0 }}
              whileInView={{ width: `${r.a}%` }}
              viewport={{ once: true }}
              transition={{ ...grow, delay: i * 0.06 }}
            >
              {r.a}%
            </motion.span>
            <span className="flex flex-1 items-center justify-end bg-hot-100 pr-3 text-[11px] font-semibold text-hot-800 dark:bg-hot/25 dark:text-hot-200">{100 - r.a}%</span>
          </div>
          {r.extra && <div className="col-span-2 sm:col-span-1">{r.extra}</div>}
        </div>
      ))}
    </div>
  )
}

export function LineCompare({ data, max = 5.5 }: { data: { h: string; before: number; after: number }[]; max?: number }) {
  const W = 560
  const H = 200
  const pad = { l: 34, r: 12, t: 12, b: 26 }
  const x = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const path = (k: 'before' | 'after') => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' ')
  const area = `${path('after')} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const [hi, setHi] = useState<number | null>(null)
  return (
    <div className="relative">
      <div className="mb-2 flex gap-4 text-[12px] text-fg-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-line-strong" /> Before Caravan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-hot" /> With Caravan
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" aria-hidden="true" onMouseLeave={() => setHi(null)}>
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="stroke-[var(--line)]" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="fill-[var(--fg-subtle)] text-[11px]">
              {v}m
            </text>
          </g>
        ))}
        <motion.path d={area} className="fill-[rgb(211_21_107/0.10)]" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />
        <motion.path
          d={path('before')}
          fill="none"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          className="stroke-[var(--line-strong)]"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1 }}
        />
        <motion.path
          d={path('after')}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-hot"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15 }}
        />
        {data.map((d, i) => (
          <g key={d.h}>
            <rect x={x(i) - 22} y={pad.t} width="44" height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHi(i)} />
            <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-[var(--fg-subtle)] text-[11px]">
              {d.h}
            </text>
            {hi === i && (
              <>
                <line x1={x(i)} x2={x(i)} y1={pad.t} y2={y(0)} className="stroke-[var(--line-strong)]" strokeDasharray="2 3" />
                <circle cx={x(i)} cy={y(d.before)} r="4.5" className="fill-[var(--surface-solid)] stroke-[var(--line-strong)]" strokeWidth="2" />
                <circle cx={x(i)} cy={y(d.after)} r="5" className="fill-hot stroke-white" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>
      {hi !== null && (
        <div className="pointer-events-none absolute right-2 top-8 rounded-2xl bg-ink px-3 py-2 text-[12px] text-white shadow-solid dark:bg-white dark:text-ink">
          <p className="font-semibold">{data[hi].h}:00</p>
          <p className="tabular">
            {data[hi].before.toFixed(1)}m → <strong>{data[hi].after.toFixed(1)}m</strong>
          </p>
        </div>
      )}
    </div>
  )
}

export function Spark({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values)
  return (
    <div className={cn('flex h-10 items-end gap-[3px]', className)} aria-hidden="true">
      {values.map((v, i) => (
        <motion.span key={i} className="w-full rounded-t-[3px] bg-hot/80" initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }} transition={{ delay: i * 0.03, duration: 0.5 }} />
      ))}
    </div>
  )
}
