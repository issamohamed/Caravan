import { cn } from './util'

export function Logo({ className, dot = 'text-hot', size = 'text-3xl' }: { className?: string; dot?: string; size?: string }) {
  return (
    <span className={cn('font-logo font-normal leading-none tracking-[-0.01em]', size, className)} role="img" aria-label="Caravan">
      <span aria-hidden="true">
        caravan<span className={dot}>.</span>
      </span>
    </span>
  )
}
