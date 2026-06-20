import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Command, FileText, FolderKanban, Search, Users, Wallet, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../lib/axios'

const CATEGORY_ICONS = {
  project: { icon: FolderKanban, color: 'text-indigo-200', chip: 'bg-indigo-500/12 border-indigo-400/20', label: 'Project', path: '/projects' },
  client: { icon: Users, color: 'text-emerald-200', chip: 'bg-emerald-500/12 border-emerald-400/20', label: 'Client', path: '/clients' },
  invoice: { icon: FileText, color: 'text-cyan-200', chip: 'bg-cyan-500/12 border-cyan-400/20', label: 'Invoice', path: '/invoices' },
  expense: { icon: Wallet, color: 'text-rose-200', chip: 'bg-rose-500/12 border-rose-400/20', label: 'Expense', path: '/expenses' },
}

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults([])
    setSelected(0)
    setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  const search = useCallback(async (value) => {
    if (!value.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const [projects, clients, invoices, expenses] = await Promise.allSettled([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/invoices'),
        api.get('/expenses'),
      ])

      const normalized = value.toLowerCase()
      const hits = []

      if (projects.status === 'fulfilled') {
        projects.value.data.projects
          ?.filter((item) => item.title?.toLowerCase().includes(normalized) || item.description?.toLowerCase().includes(normalized))
          .slice(0, 4)
          .forEach((item) => hits.push({ type: 'project', id: item._id, label: item.title, sub: item.status || 'project workspace' }))
      }

      if (clients.status === 'fulfilled') {
        clients.value.data.clients
          ?.filter((item) => item.name?.toLowerCase().includes(normalized) || item.email?.toLowerCase().includes(normalized))
          .slice(0, 4)
          .forEach((item) => hits.push({ type: 'client', id: item._id, label: item.name, sub: item.email }))
      }

      if (invoices.status === 'fulfilled') {
        invoices.value.data.invoices
          ?.filter((item) => item.invoiceNumber?.toLowerCase().includes(normalized) || item.client?.name?.toLowerCase().includes(normalized))
          .slice(0, 4)
          .forEach((item) => hits.push({ type: 'invoice', id: item._id, label: item.invoiceNumber || 'Invoice', sub: `₹${item.total?.toLocaleString('en-IN')} · ${item.status}` }))
      }

      if (expenses.status === 'fulfilled') {
        expenses.value.data.expenses
          ?.filter((item) => item.description?.toLowerCase().includes(normalized) || item.category?.toLowerCase().includes(normalized))
          .slice(0, 4)
          .forEach((item) => hits.push({ type: 'expense', id: item._id, label: item.description, sub: `₹${item.amount?.toLocaleString('en-IN')} · ${item.category}` }))
      }

      setResults(hits)
      setSelected(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250)
    return () => clearTimeout(timer)
  }, [query, search])

  const handleSelect = (result) => {
    navigate(CATEGORY_ICONS[result.type]?.path || '/')
    onClose()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelected((current) => Math.min(current + 1, results.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected((current) => Math.max(current - 1, 0))
    }
    if (event.key === 'Enter' && results[selected]) {
      handleSelect(results[selected])
    }
    if (event.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-950/70 px-4 pt-[12vh] backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 18, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/92 shadow-2xl backdrop-blur-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <Search size={18} className="text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects, clients, invoices, expenses..."
              className="flex-1 bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300">
                <X size={14} />
              </button>
            ) : null}
            <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-500 sm:flex">
              <Command size={12} /> K
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                Searching your workspace...
              </div>
            ) : null}

            {!loading && !query ? (
              <div className="space-y-2">
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
                  Quick Jump
                </p>
                {Object.entries(CATEGORY_ICONS).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        navigate(config.path)
                        onClose()
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/[0.04]"
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${config.chip}`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-100">{config.label}s</p>
                        <p className="text-xs text-slate-500">Open {config.label.toLowerCase()} workspace</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-500" />
                    </button>
                  )
                })}
              </div>
            ) : null}

            {!loading && query && results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                No results for <span className="font-medium text-slate-200">"{query}"</span>
              </div>
            ) : null}

            {!loading && results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result, index) => {
                  const config = CATEGORY_ICONS[result.type]
                  const Icon = config.icon
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        index === selected ? 'bg-indigo-500/12' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${config.chip}`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-100">{result.label}</p>
                        <p className="truncate text-xs text-slate-500">{result.sub}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${config.chip} ${config.color}`}>
                        {config.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
