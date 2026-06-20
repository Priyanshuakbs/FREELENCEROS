import { cn } from './ui'

const tones = {
  active: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/20',
  completed: 'bg-cyan-500/12 text-cyan-300 border-cyan-400/20',
  paid: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/20',
  sent: 'bg-sky-500/12 text-sky-300 border-sky-400/20',
  draft: 'bg-slate-500/12 text-slate-300 border-slate-300/12',
  overdue: 'bg-rose-500/12 text-rose-300 border-rose-400/20',
  'on-hold': 'bg-amber-500/12 text-amber-300 border-amber-400/20',
  cancelled: 'bg-rose-500/12 text-rose-300 border-rose-400/20',
}

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize tracking-wide',
      tones[status] || tones.draft,
      className
    )}>
      {status}
    </span>
  )
}
