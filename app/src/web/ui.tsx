import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../shared/util'
import type { Tone } from './data'

/* ---------- Buttons ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'dark' | 'glass' | 'ghost' | 'teal' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
}

export const btnClass = (variant: BtnProps['variant'] = 'glass', size: BtnProps['size'] = 'md') =>
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,transform,box-shadow] duration-150 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0',
    size === 'sm' && 'h-9 px-3.5 text-[13px]',
    size === 'md' && 'h-11 px-5 text-sm',
    size === 'lg' && 'h-12 px-6 text-[15px]',
    variant === 'primary' && 'bg-hot font-semibold text-white shadow-solid hover:bg-hot-600',
    variant === 'dark' && 'bg-ink font-semibold text-white shadow-solid hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/90',
    variant === 'teal' && 'bg-teal-deep font-semibold text-white shadow-solid hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal-600',
    variant === 'glass' && 'glass-pill border border-line-strong/70 text-fg hover:-translate-y-px hover:bg-surface-strong',
    variant === 'outline' && 'border border-line-strong text-fg hover:bg-surface',
    variant === 'ghost' && 'text-fg-muted hover:bg-surface hover:text-fg',
  )

export function Button({ variant = 'glass', size = 'md', icon, iconRight, loading, className, children, ...rest }: BtnProps) {
  return (
    <button {...rest} className={cn(btnClass(variant, size), className)} aria-busy={loading || undefined}>
      {loading ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : icon}
      {children}
      {iconRight}
    </button>
  )
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} className={cn('grid size-10 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg', className)}>
      {children}
    </button>
  )
}

/* ---------- Chips ---------- */
const toneCls: Record<Tone, string> = {
  held: 'bg-held-bg text-held-fg',
  review: 'bg-review-bg text-review-fg',
  note: 'bg-note-bg text-note-fg',
  done: 'bg-done-bg text-done-fg',
  info: 'bg-surface-strong text-fg-muted ring-1 ring-line',
  accent: 'bg-hot text-white',
  neutral: 'bg-note-bg text-fg-muted',
}

export function Chip({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold', toneCls[tone], className)}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ---------- Surfaces ---------- */
export function Card({ children, className, as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'aside' | 'article' | 'li' | 'nav' } & Record<string, unknown>) {
  return (
    <As {...rest} className={cn('glass rounded-[26px]', className)}>
      {children}
    </As>
  )
}

export function H2({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn('font-display text-[19px] font-semibold tracking-[-0.01em] text-fg', className)}>
      {children}
    </h2>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-fg-muted">{eyebrow}</p>}
        <h1 tabIndex={-1} data-page-title className="mt-1 font-logo text-[clamp(2.4rem,4.4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.01em] text-fg focus:outline-none">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong/60 bg-surface-strong px-1 font-mono text-[11px] font-medium text-fg-muted', className)}>{children}</kbd>
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  layoutId,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; label: ReactNode; count?: number }[]
  label: string
  size?: 'sm' | 'md'
  layoutId?: string
}) {
  const auto = useId()
  const lid = layoutId ?? `seg-${auto}`
  return (
    <div role="radiogroup" aria-label={label} className="glass-pill inline-flex max-w-full flex-wrap gap-1 rounded-full p-1">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-[13px]',
              on ? 'text-white dark:text-ink' : 'text-fg-muted hover:text-fg',
            )}
          >
            {on && <motion.span layoutId={lid} className="absolute inset-0 rounded-full bg-ink shadow-solid dark:bg-white" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && <span className={cn('relative tabular text-[12px]', on ? 'opacity-80' : 'opacity-70')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="glass-pill flex w-full items-center gap-4 rounded-full px-5 py-3 text-left transition-colors hover:bg-surface-strong">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="block text-[13px] text-fg-muted">{description}</span>}
      </span>
      <span aria-hidden="true" className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-hot' : 'bg-line-strong/60')}>
        <motion.span className="absolute top-1 size-5 rounded-full bg-white shadow" initial={false} animate={{ left: checked ? 24 : 4 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
      </span>
    </button>
  )
}

/* ---------- Dialogs ---------- */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] dark:bg-black/55" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'fixed left-1/2 top-1/2 z-50 max-h-[88dvh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] bg-surface-solid p-6 text-fg shadow-[0_40px_80px_-30px_rgb(60_10_30/0.55)] ring-1 ring-line focus:outline-none',
              wide ? 'max-w-2xl' : 'max-w-md',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="font-display text-xl font-semibold tracking-[-0.01em]">{title}</Dialog.Title>
                {description ? <Dialog.Description className="mt-1 text-sm text-fg-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
              </div>
              <Dialog.Close asChild>
                <IconButton label="Close" className="-mr-2 -mt-1">
                  <X size={18} />
                </IconButton>
              </Dialog.Close>
            </div>
            {children && <div className="mt-5">{children}</div>}
            {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function SidePanel({ open, onOpenChange, title, description, children, footer }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30 dark:bg-black/50" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 38 }}
            className="fixed inset-y-2 right-2 z-50 flex w-[min(480px,calc(100vw-16px))] flex-col overflow-hidden rounded-[28px] bg-surface-solid text-fg shadow-[0_40px_80px_-30px_rgb(60_10_30/0.55)] ring-1 ring-line focus:outline-none"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <Dialog.Title className="font-display text-xl font-semibold tracking-[-0.01em]">{title}</Dialog.Title>
                {description ? <Dialog.Description className="mt-0.5 text-sm text-fg-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
              </div>
              <Dialog.Close asChild>
                <IconButton label="Close panel" className="-mr-2">
                  <X size={18} />
                </IconButton>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- Misc ---------- */
export function Bar({ pct, tone = 'hot', label }: { pct: number; tone?: 'hot' | 'teal' | 'ink' | 'muted'; label?: string }) {
  const c = { hot: 'bg-hot', teal: 'bg-teal dark:bg-teal-300', ink: 'bg-ink dark:bg-white', muted: 'bg-line-strong/50' }[tone]
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-sunk ring-1 ring-inset ring-line" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <motion.div className={cn('h-full rounded-full', c)} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
    </div>
  )
}

export function Field({ label, hint, error, children, id }: { label: string; hint?: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] text-fg-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-[13px] font-medium text-accent-fg">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputCls =
  'w-full rounded-2xl border border-line-strong/70 bg-surface-strong px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-hot focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--focus)]'
export const selectCls = 'h-9 w-full appearance-none rounded-full border border-line-strong/70 bg-surface-strong bg-[length:14px] bg-[right_12px_center] bg-no-repeat pl-3.5 pr-8 text-[13px] text-fg'

export function Dot({ tone = 'teal', pulse }: { tone?: 'teal' | 'hot' | 'amber'; pulse?: boolean }) {
  const c = { teal: 'bg-teal dark:bg-teal-300', hot: 'bg-hot', amber: 'bg-[#c98a14]' }[tone]
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', c, pulse && 'animate-live-dot')} />
}
