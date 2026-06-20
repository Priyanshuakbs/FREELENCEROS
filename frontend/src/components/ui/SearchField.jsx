import { Search } from 'lucide-react'
import { cn } from './ui'

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <label className={cn('relative block', className)}>
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-shell w-full pl-11"
      />
    </label>
  )
}

