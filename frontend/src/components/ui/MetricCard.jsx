import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import SurfaceCard from './SurfaceCard'
import { cn } from './ui'

export default function MetricCard({
  label,
  value,
  icon: Icon,
  accent = 'indigo',
  delta,
  deltaLabel,
  onClick,
}) {
  const accents = {
    indigo: 'from-indigo-500/20 to-violet-500/5 text-indigo-200 ring-indigo-400/20',
    cyan: 'from-cyan-500/20 to-sky-500/5 text-cyan-200 ring-cyan-400/20',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-200 ring-emerald-400/20',
    rose: 'from-rose-500/20 to-orange-500/5 text-rose-200 ring-rose-400/20',
  }

  const positive = delta === undefined ? null : Number(delta) >= 0

  return (
    <SurfaceCard hover interactive={Boolean(onClick)} onClick={onClick} className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </span>
          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight text-slate-50">
              {value}
            </p>
            {(deltaLabel || delta !== undefined) && (
              <div
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', color: 'var(--text-subtle)' }}
          >
                {positive === null ? null : positive ? (
                  <ArrowUpRight size={12} className="text-emerald-400" />
                ) : (
                  <ArrowDownRight size={12} className="text-rose-400" />
                )}
                {delta !== undefined ? (
                  <span className={cn('font-medium', positive ? 'text-emerald-300' : 'text-rose-300')}>
                    {positive ? '+' : ''}{delta}
                  </span>
                ) : null}
                {deltaLabel ? <span>{deltaLabel}</span> : null}
              </div>
            )}
          </div>
        </div>

        {Icon ? (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1', accents[accent] || accents.indigo)}>
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  )
}

