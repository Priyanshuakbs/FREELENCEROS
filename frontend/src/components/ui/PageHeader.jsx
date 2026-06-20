import { motion } from 'framer-motion'
import { cn } from './ui'

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between', className)}
    >
      <div className="space-y-3">
        {eyebrow && (
          <span className="section-eyebrow">{eyebrow}</span>
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </motion.div>
  )
}

