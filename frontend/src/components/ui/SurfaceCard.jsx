import { motion } from 'framer-motion'
import { cn } from './ui'

export default function SurfaceCard({
  children,
  className = '',
  hover = false,
  interactive = false,
  onClick,
}) {
  const Component = interactive || hover ? motion.div : 'div'

  const props = Component === motion.div
    ? {
        whileHover: hover ? { y: -4, scale: 1.01 } : undefined,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
      }
    : {}

  return (
    <Component
      onClick={onClick}
      className={cn(
        'surface-card',
        interactive && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

