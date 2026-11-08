import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '../shared/util'
import type { Choice, Wording } from './content'

export function BigButton({
  children,
  onClick,
  tone = 'primary',
  className,
  icon,
  type = 'button',
  tour,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'primary' | 'outline' | 'dark' | 'quiet'
  className?: string
  icon?: ReactNode
  type?: 'button' | 'submit'
  /** Marks the button for the guided tour. */
  tour?: string
}) {
  const tones = {
    primary: 'bg-hot text-white shadow-solid hover:bg-hot-600 active:bg-hot-700',
    dark: 'bg-ink text-white shadow-solid hover:bg-black',
    outline: 'glass-pill border-2 border-ink text-ink hover:bg-white/80 [.hc_&]:bg-white',
    quiet: 'text-accent-fg underline decoration-2 underline-offset-4 hover:text-hot-800',
  }
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      data-tour={tour}
      className={cn('flex w-full items-center justify-center gap-2.5 rounded-full px-6 text-[1.3rem] font-bold transition-colors', tone === 'quiet' ? 'min-h-12 text-[1.15rem]' : 'min-h-[4rem]', tones[tone], className)}
    >
      {children}
      {icon}
    </motion.button>
  )
}

export function Progress({ n }: { n: number }) {
  return (
    <div>
      <p className="text-[1.05rem] font-bold text-fg-muted">Question {n} of 5</p>
      <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="relative h-2 overflow-hidden rounded-full bg-white/70 [.hc_&]:bg-[#d9d2d4]">
            <motion.span className={cn('absolute inset-y-0 left-0 rounded-full', i < n ? 'bg-hot' : 'bg-teal')} initial={false} animate={{ width: i <= n ? '100%' : '0%' }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} />
          </span>
        ))}
      </div>
    </div>
  )
}

export function WordingToggle({ value, onChange }: { value: Wording; onChange: (w: Wording) => void }) {
  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label="Wording" data-tour="wording">
      <span className="text-[1.02rem] font-bold text-fg-muted" aria-hidden="true">
        Wording
      </span>
      <div className="glass-pill relative flex flex-1 rounded-full p-1 [.hc_&]:border-2 [.hc_&]:border-ink">
        {(['simple', 'medical'] as const).map((w) => {
          const on = value === w
          return (
            <button
              key={w}
              role="radio"
              aria-checked={on}
              onClick={() => !on && onChange(w)}
              className={cn('relative z-10 flex min-h-12 flex-1 items-center justify-center rounded-full text-[1.02rem] font-bold transition-colors', on ? 'text-white' : 'text-ink')}
            >
              {on && <motion.span layoutId="wording-pill" className="absolute inset-0 -z-10 rounded-full bg-ink shadow-solid" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              {w === 'simple' ? 'Simple words' : 'Medical terms'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Choices({
  name,
  labelledBy,
  choices,
  value,
  onChange,
  wording,
  icons,
  columns = 1,
}: {
  name: string
  labelledBy: string
  choices: Choice[]
  value: string | null
  onChange: (id: string) => void
  wording: Wording
  icons?: Record<string, ReactNode>
  columns?: 1 | 2
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} data-tour="choices" className={cn('grid gap-3', columns === 2 && 'grid-cols-2')}>
      {choices.map((c) => {
        const on = value === c.id
        return (
          <label
            key={c.id}
            className={cn(
              'group relative flex cursor-pointer items-center gap-3.5 rounded-[1.4rem] border-2 px-4 transition-[background-color,border-color,box-shadow] duration-200',
              columns === 2 ? 'min-h-[5.2rem] py-3 text-[1.08rem]' : 'min-h-[4.25rem] py-3 text-[1.22rem]',
              on ? 'border-hot-700 bg-hot-100/90 shadow-[0_10px_22px_-14px_rgb(168_15_85/0.7)]' : 'glass-pill border-[#8c5560]/60 hover:border-hot-700/70 [.hc_&]:border-ink [.hc_&]:bg-white',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]',
            )}
          >
            <input type="radio" name={name} value={c.id} checked={on} onChange={() => onChange(c.id)} className="sr-only" />
            {icons?.[c.id] ?? (
              <span aria-hidden="true" className={cn('grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors', on ? 'border-hot-700 bg-hot-700 text-white' : 'border-[#8c5560] bg-white text-transparent')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
            )}
            <span className="font-bold leading-snug text-ink">{wording === 'simple' ? c.simple : c.medical}</span>
          </label>
        )
      })}
    </div>
  )
}

export function Callout({ tone = 'teal', icon, children, live }: { tone?: 'teal' | 'pink' | 'amber' | 'white'; icon?: ReactNode; children: ReactNode; live?: boolean }) {
  const tones = {
    teal: 'bg-mist/95 text-teal-700 [.hc_&]:border-teal-700',
    pink: 'bg-hot-100/95 text-hot-800 [.hc_&]:border-hot-800',
    amber: 'bg-amber-soft/95 text-amber-ink [.hc_&]:border-amber-ink',
    white: 'bg-white/80 text-ink [.hc_&]:border-ink',
  }
  return (
    <div aria-live={live ? 'polite' : undefined} className={cn('flex items-start gap-3 rounded-[1.25rem] px-4 py-3.5 text-[1.12rem] leading-snug [.hc_&]:border-2', tones[tone])}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}

/** A bottom sheet that stays inside the phone frame. */
export const Sheet = forwardRef<HTMLDivElement, { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; container: HTMLElement | null; children: ReactNode; tone?: 'light' | 'dark' }>(function Sheet(
  { open, onOpenChange, title, description, container, children, tone = 'light' },
  ref,
) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay asChild>
          <motion.div className="absolute inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            ref={ref}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className={cn('absolute inset-x-0 bottom-0 z-50 max-h-[88%] overflow-y-auto rounded-t-[2rem] px-6 pb-7 pt-3 font-read focus:outline-none', tone === 'dark' ? 'bg-[#141112] text-white' : 'bg-[#fdf3f4] text-ink [.hc_&]:bg-white')}
          >
            <div aria-hidden="true" className={cn('mx-auto mb-4 h-1.5 w-12 rounded-full', tone === 'dark' ? 'bg-white/30' : 'bg-ink/20')} />
            <Dialog.Title className="text-[1.6rem] font-bold leading-tight">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className={cn('mt-1.5 text-[1.1rem] leading-snug', tone === 'dark' ? 'text-white/75' : 'text-fg-muted')}>{description}</Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{title}</Dialog.Description>
            )}
            <div className="mt-5">{children}</div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1.5 rounded-full bg-white/70 p-1 [.hc_&]:border-2 [.hc_&]:border-ink">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn('min-h-12 rounded-full text-[1.02rem] font-bold transition-colors', on ? 'bg-ink text-white shadow-solid' : 'text-ink hover:bg-white')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
