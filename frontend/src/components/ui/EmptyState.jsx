import { motion } from 'framer-motion'
import SurfaceCard from './SurfaceCard'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <SurfaceCard className="px-8 py-14 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md"
      >
        {Icon ? (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <Icon size={28} className="text-slate-300" />
          </div>
        ) : null}
        <h3 className="text-xl font-semibold text-slate-50">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </motion.div>
    </SurfaceCard>
  )
}

