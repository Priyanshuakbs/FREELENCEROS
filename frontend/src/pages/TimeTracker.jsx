import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Loader2, Pause, Play, Square, Trash2 } from 'lucide-react'
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import MetricCard from '../components/ui/MetricCard'
import EmptyState from '../components/ui/EmptyState'

export default function TimeTracker() {
  const [logs, setLogs] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({ project: '', description: '', hourlyRate: 0 })
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({ projectId: '', clientId: '', tax: 18, dueDate: '', notes: '' })
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const intervalRef = useRef(null)
  const navigate = useNavigate()

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/timelogs')
      setLogs(data.logs || [])
    } catch (err) {
      console.error('Failed to load logs:', err.message)
      toast.error('Failed to load logs')
    }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects || [])
    } catch (err) {
      console.error('Failed to load projects:', err.message)
      toast.error('Failed to load projects')
    }
  }

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data.clients || [])
    } catch (err) {
      console.error('Failed to load clients:', err.message)
      toast.error('Failed to load clients')
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchProjects()
    fetchClients()
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((value) => value + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const unbilledCount = useMemo(
    () => logs.filter((log) => !log.billed && Number(log.hourlyRate || 0) > 0).length,
    [logs]
  )

  const totalMinutes = useMemo(() => logs.reduce((sum, log) => sum + Number(log.duration || 0), 0), [logs])
  const totalHours = (totalMinutes / 60).toFixed(1)

  const chartData = useMemo(() => {
    return logs.slice().reverse().slice(-14).map((log, index) => ({
      name: `${index + 1}`,
      minutes: Number(log.duration || 0),
    }))
  }, [logs])

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleStop = async () => {
    setRunning(false)
    if (seconds < 60) {
      toast.error('Track at least 1 minute')
      setSeconds(0)
      return
    }

    try {
      await api.post('/timelogs', {
        ...form,
        duration: Math.floor(seconds / 60),
      })
      toast.success('Time logged')
      setSeconds(0)
      setForm({ project: '', description: '', hourlyRate: 0 })
      fetchLogs()
    } catch {
      toast.error('Failed to save log')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/timelogs/${id}`)
      toast.success('Log deleted')
      fetchLogs()
    } catch {
      toast.error('Failed to delete log')
    }
  }

  const handleGenerateInvoice = async () => {
    if (!invoiceForm.projectId || !invoiceForm.clientId) {
      toast.error('Select both project and client')
      return
    }
    setInvoiceLoading(true)
    try {
      await api.post('/invoices/from-timelogs', invoiceForm)
      toast.success('Invoice generated from time logs')
      setInvoiceModal(false)
      setInvoiceForm({ projectId: '', clientId: '', tax: 18, dueDate: '', notes: '' })
      fetchLogs()
      setTimeout(() => navigate('/invoices'), 700)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice')
    } finally {
      setInvoiceLoading(false)
    }
  }

  return (
    <AnimatedPage className="page-container space-y-8">
      <PageHeader
        eyebrow="Billable Time"
        title="Time Tracker"
        description="Track billable work in a focused timer, then convert unbilled logs directly into invoices."
        actions={(
          <>
            {unbilledCount > 0 ? (
              <button onClick={() => setInvoiceModal(true)} className="btn-secondary">
                <FileText size={16} /> Generate invoice <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{unbilledCount}</span>
              </button>
            ) : null}
          </>
        )}
      />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Tracked hours" value={`${totalHours}h`} accent="indigo" />
        <MetricCard label="Sessions" value={logs.length} accent="emerald" />
        <MetricCard label="Unbilled logs" value={unbilledCount} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard className="space-y-6">
          <div>
            <p className="text-lg font-semibold text-slate-50">Live timer</p>
            <p className="text-sm text-slate-400">Pick a project, set a rate, and start tracking instantly.</p>
          </div>

          <div className="rounded-[32px] p-6 text-center" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)' }}>
            <p className="font-mono text-6xl font-semibold tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-cyan-300">
              {formatTime(seconds)}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Project</label>
                <select
                  value={form.project}
                  onChange={(event) => setForm({ ...form, project: event.target.value })}
                  disabled={running}
                  className="input-shell w-full"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>{project.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Hourly rate</label>
                <input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(event) => setForm({ ...form, hourlyRate: event.target.value })}
                  disabled={running}
                  className="input-shell w-full"
                  placeholder="1500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Work description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  disabled={running}
                  className="input-shell w-full"
                  placeholder="Design polish, bug fixes, product updates..."
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {!running ? (
                <button onClick={() => setRunning(true)} className="btn-primary">
                  <Play size={16} /> Start
                </button>
              ) : (
                <>
                  <button onClick={() => setRunning(false)} className="btn-secondary">
                    <Pause size={16} /> Pause
                  </button>
                  <button onClick={handleStop} className="btn-primary">
                    <Square size={16} /> Save log
                  </button>
                </>
              )}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-[220px] rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-100">Recent activity</p>
                <span className="text-xs text-slate-500">Last 14 logs</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="timeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '18px', color: 'var(--text)' }}
                    formatter={(value) => [`${value} mins`, 'Duration']}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#818cf8" strokeWidth={2.5} fill="url(#timeFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-50">Time logs</p>
              <p className="text-sm text-slate-400">All saved sessions, rate details, and billing readiness.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
              {logs.length} entries
            </span>
          </div>

          {logs.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No time logs yet"
              description="Start the timer and your sessions will appear here with billing readiness details."
            />
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-50">{log.description || 'Untitled session'}</p>
                        {log.billed ? <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-300">Billed</span> : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {log.project?.title || 'No project'} • {Number(log.duration || 0)} mins
                        {Number(log.hourlyRate || 0) > 0 ? ` • ₹${((Number(log.duration || 0) / 60) * Number(log.hourlyRate || 0)).toFixed(0)}` : ''}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(log._id)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 transition hover:text-rose-200 hover:bg-rose-500/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      {invoiceModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-eyebrow">Invoice from logs</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-50">Generate invoice</h2>
                <p className="mt-2 text-sm text-slate-400">Convert unbilled time logs into a professional invoice.</p>
              </div>
              <button onClick={() => setInvoiceModal(false)} className="btn-secondary px-3 py-2">
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Project</label>
                <select
                  value={invoiceForm.projectId}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, projectId: event.target.value })}
                  className="input-shell w-full"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>{project.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Client</label>
                <select
                  value={invoiceForm.clientId}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, clientId: event.target.value })}
                  className="input-shell w-full"
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">GST (%)</label>
                  <input
                    type="number"
                    value={invoiceForm.tax}
                    onChange={(event) => setInvoiceForm({ ...invoiceForm, tax: Number(event.target.value) })}
                    className="input-shell w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Due date</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(event) => setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })}
                    className="input-shell w-full"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Notes</label>
                <textarea
                  rows={4}
                  value={invoiceForm.notes}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, notes: event.target.value })}
                  className="input-shell w-full resize-none"
                  placeholder="Payment terms and invoice notes..."
                />
              </div>
              <button onClick={handleGenerateInvoice} disabled={invoiceLoading} className="btn-primary w-full justify-center">
                {invoiceLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><FileText size={16} /> Generate invoice</>}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AnimatedPage>
  )
}
