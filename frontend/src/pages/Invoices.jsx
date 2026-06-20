import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Download, Eye, Plus, Sparkles, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import MetricCard from '../components/ui/MetricCard'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'

const emptyItem = { description: '', quantity: 1, rate: 0, amount: 0 }

const emptyForm = {
  client: '',
  project: '',
  tax: 18,
  dueDate: '',
  notes: '',
  items: [emptyItem],
  isRecurring: false,
  recurringCycle: 'monthly',
}

const aiDefaults = {
  description: '',
  hourlyRate: 1500,
  project: '',
}

const statusLabels = ['draft', 'sent', 'paid', 'overdue']

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [aiModal, setAiModal] = useState(false)
  const [aiForm, setAiForm] = useState(aiDefaults)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchInvoices()
    fetchClients()
    fetchProjects()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices')
      setInvoices(data.invoices || [])
    } catch {
      toast.error('Failed to load invoices')
    }
  }

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data.clients || [])
    } catch {
      toast.error('Failed to load clients')
    }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects || [])
    } catch {
      toast.error('Failed to load projects')
    }
  }

  const updateItem = (index, field, value) => {
    const nextItems = [...form.items]
    nextItems[index] = { ...nextItems[index], [field]: value }

    if (field === 'quantity' || field === 'rate') {
      nextItems[index].amount = Number(nextItems[index].quantity || 0) * Number(nextItems[index].rate || 0)
    }

    setForm({ ...form, items: nextItems })
  }

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  const removeItem = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))

  const subtotal = useMemo(
    () => form.items.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [form.items]
  )
  const total = subtotal + (subtotal * Number(form.tax || 0)) / 100

  const resetForm = () => setForm(emptyForm)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await api.post('/invoices', form)
      toast.success('Invoice created successfully')
      setShowModal(false)
      resetForm()
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/invoices/${id}/status`, { status })
      toast.success(`Marked as ${status}`)
      fetchInvoices()
      if (selected?._id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : prev))
      }
    } catch {
      toast.error('Failed to update invoice')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    try {
      await api.delete(`/invoices/${id}`)
      toast.success('Invoice deleted')
      if (selected?._id === id) setSelected(null)
      fetchInvoices()
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const handleAIGenerate = async () => {
    if (!aiForm.description.trim()) {
      toast.error('Please add a short work description')
      return
    }

    setAiLoading(true)
    try {
      const { data } = await api.post('/ai/generate-invoice', {
        description: aiForm.description,
        projectId: aiForm.project,
        hourlyRate: aiForm.hourlyRate,
      })
      setForm((prev) => ({
        ...prev,
        items: data.items || [emptyItem],
        project: aiForm.project || prev.project,
      }))
      setAiModal(false)
      setShowModal(true)
      setAiForm(aiDefaults)
      toast.success('Invoice items generated')
    } catch {
      toast.error('AI invoice generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const metrics = useMemo(() => {
    const paid = invoices.filter((invoice) => invoice.status === 'paid')
    const pending = invoices.filter((invoice) => invoice.status !== 'paid')
    const totalEarned = paid.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
    return {
      draft: invoices.filter((invoice) => invoice.status === 'draft').length,
      sent: invoices.filter((invoice) => invoice.status === 'sent').length,
      paid: paid.length,
      overdue: invoices.filter((invoice) => invoice.status === 'overdue').length,
      totalEarned,
      pendingValue: pending.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    }
  }, [invoices])

  return (
    <AnimatedPage className="page-container space-y-8">
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Create polished invoices, generate line items with AI, and keep payment statuses in one place."
        actions={(
          <>
            <button onClick={() => setAiModal(true)} className="btn-secondary">
              <Sparkles size={16} /> AI Generate
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} /> New Invoice
            </button>
          </>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Draft" value={metrics.draft} accent="slate" />
        <MetricCard label="Sent" value={metrics.sent} accent="indigo" />
        <MetricCard label="Paid" value={metrics.paid} accent="emerald" />
        <MetricCard label="Overdue" value={metrics.overdue} accent="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SurfaceCard className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-50">Invoice register</p>
              <p className="text-sm text-slate-400">Track every invoice with amount, status, and due date visibility.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
              ₹{Number(metrics.totalEarned).toLocaleString('en-IN')} collected
            </div>
          </div>

          {invoices.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No invoices yet"
              description="Create your first invoice or let AI draft item lines from a short work description."
              action={<button onClick={() => setAiModal(true)} className="btn-primary">Try AI Generator</button>}
            />
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice._id}
                  invoice={invoice}
                  onPreview={() => setSelected(invoice)}
                  onMarkPaid={() => handleStatusUpdate(invoice._id, 'paid')}
                  onDelete={() => handleDelete(invoice._id)}
                />
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-50">Collections</p>
              <p className="text-sm text-slate-400">Outstanding value versus paid value.</p>
            </div>
            <StatusBadge status={metrics.pendingValue > 0 ? 'sent' : 'paid'} />
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Total outstanding</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">₹{Number(metrics.pendingValue).toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Collected value</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">₹{Number(metrics.totalEarned).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-100">Quick actions</p>
            <button onClick={() => setShowModal(true)} className="btn-secondary w-full justify-center">
              <Plus size={16} /> Create invoice
            </button>
            <button onClick={() => setAiModal(true)} className="btn-secondary w-full justify-center">
              <Sparkles size={16} /> Generate with AI
            </button>
          </div>
        </SurfaceCard>
      </div>

      {selected ? (
        <InvoiceModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onMarkPaid={() => handleStatusUpdate(selected._id, 'paid')}
          onDelete={() => handleDelete(selected._id)}
        />
      ) : null}

      {aiModal ? (
        <AiModal
          form={aiForm}
          setForm={setAiForm}
          projects={projects}
          loading={aiLoading}
          onClose={() => setAiModal(false)}
          onGenerate={handleAIGenerate}
        />
      ) : null}

      {showModal ? (
        <InvoiceFormModal
          form={form}
          clients={clients}
          projects={projects}
          subtotal={subtotal}
          total={total}
          loading={loading}
          onClose={() => setShowModal(false)}
          onChange={setForm}
          onItemChange={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSubmit={handleSubmit}
        />
      ) : null}
    </AnimatedPage>
  )
}

function InvoiceRow({ invoice, onPreview, onMarkPaid, onDelete }) {
  const amount = Number(invoice.total || 0).toLocaleString('en-IN')
  return (
    <div className="group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.05]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-50">{invoice.invoiceNumber}</p>
            <StatusBadge status={invoice.status || 'draft'} />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {invoice.client?.name || 'No client'} {invoice.project?.title ? `• ${invoice.project.title}` : ''}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Due {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Not set'} • ₹{amount}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' ? (
            <button onClick={onMarkPaid} className="btn-secondary px-3 py-2 text-xs">
              <CheckCircle size={14} /> Mark paid
            </button>
          ) : null}
          <button onClick={onPreview} className="btn-secondary px-3 py-2 text-xs">
            <Eye size={14} /> Preview
          </button>
          <button onClick={onDelete} className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-3 text-rose-200 transition hover:bg-rose-500/16">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function InvoiceModal({ invoice, onClose, onMarkPaid, onDelete }) {
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Invoice Preview</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-50">{invoice.invoiceNumber}</h2>
            <p className="mt-2 text-sm text-slate-400">{invoice.client?.name || 'No client'}{invoice.project?.title ? ` • ${invoice.project.title}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${backendBase}/invoices/${invoice._id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-3 py-2"
            >
              <Download size={16} /> PDF
            </a>
            {invoice.status !== 'paid' ? (
              <button onClick={onMarkPaid} className="btn-primary px-3 py-2">
                <CheckCircle size={16} /> Mark paid
              </button>
            ) : null}
            <button onClick={onClose} className="btn-secondary px-3 py-2">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <SurfaceCard className="bg-white/[0.03]">
            <div className="space-y-3">
              {invoice.items?.length ? invoice.items.map((item, index) => (
                <div key={`${item.description}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-50">{item.description}</p>
                    <p className="mt-1 text-xs text-slate-500">Qty {item.quantity} • Rate ₹{Number(item.rate || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">₹{Number(item.amount || 0).toLocaleString('en-IN')}</p>
                </div>
              )) : (
                <EmptyState icon={Sparkles} title="No line items" description="This invoice does not contain any item rows." />
              )}
            </div>
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard className="bg-white/[0.03]">
              <p className="text-sm font-medium text-slate-100">Summary</p>
              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-100">₹{Number(invoice.subtotal || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>GST</span><span className="text-slate-100">₹{Number(((invoice.subtotal || 0) * (invoice.tax || 0)) / 100).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-slate-50"><span>Total</span><span>₹{Number(invoice.total || 0).toLocaleString('en-IN')}</span></div>
              </div>
            </SurfaceCard>

            {invoice.notes ? (
              <SurfaceCard className="bg-white/[0.03]">
                <p className="text-sm font-medium text-slate-100">Notes</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{invoice.notes}</p>
              </SurfaceCard>
            ) : null}

            <SurfaceCard className="bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-100">Status</p>
                <StatusBadge status={invoice.status || 'draft'} />
              </div>
              <button onClick={onDelete} className="mt-4 btn-secondary w-full justify-center border-rose-400/20 text-rose-200">
                <Trash2 size={16} /> Delete invoice
              </button>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function AiModal({ form, setForm, projects, loading, onClose, onGenerate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">AI Assistant</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-50">Generate invoice items</h2>
            <p className="mt-2 text-sm text-slate-400">Describe work and let AI draft the billing breakdown.</p>
          </div>
          <button onClick={onClose} className="btn-secondary px-3 py-2">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Work description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="input-shell w-full resize-none"
              placeholder="Describe modules, effort, milestones, and scope..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Project</label>
              <select value={form.project} onChange={(event) => setForm({ ...form, project: event.target.value })} className="input-shell w-full">
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
                onChange={(event) => setForm({ ...form, hourlyRate: Number(event.target.value) })}
                className="input-shell w-full"
              />
            </div>
          </div>

          <button onClick={onGenerate} disabled={loading} className="btn-primary w-full justify-center">
            <Sparkles size={16} /> {loading ? 'Generating...' : 'Generate invoice items'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InvoiceFormModal({
  form,
  clients,
  projects,
  subtotal,
  total,
  loading,
  onClose,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">New Invoice</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-50">Create billing record</h2>
            <p className="mt-2 text-sm text-slate-400">Keep line items, GST, due dates, and recurring settings structured.</p>
          </div>
          <button onClick={onClose} className="btn-secondary px-3 py-2">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Client</label>
              <select
                value={form.client}
                onChange={(event) => onChange({ ...form, client: event.target.value })}
                className="input-shell w-full"
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Project</label>
              <select value={form.project} onChange={(event) => onChange({ ...form, project: event.target.value })} className="input-shell w-full">
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>{project.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Line items</label>
              <button type="button" onClick={onAddItem} className="btn-secondary px-3 py-2 text-xs">
                <Plus size={14} /> Add item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1.8fr_0.6fr_0.6fr_0.6fr_auto]">
                  <input
                    value={item.description}
                    onChange={(event) => onItemChange(index, 'description', event.target.value)}
                    className="input-shell w-full md:col-span-1"
                    placeholder="Description"
                    required
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(event) => onItemChange(index, 'quantity', Number(event.target.value))}
                    className="input-shell w-full"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(event) => onItemChange(index, 'rate', Number(event.target.value))}
                    className="input-shell w-full"
                    placeholder="Rate"
                  />
                  <div className="input-shell flex items-center justify-end text-sm text-slate-300">₹{Number(item.amount || 0).toLocaleString('en-IN')}</div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    disabled={form.items.length === 1}
                    className="btn-secondary px-3 py-2 text-xs text-rose-200 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">GST (%)</label>
              <input
                type="number"
                value={form.tax}
                onChange={(event) => onChange({ ...form, tax: Number(event.target.value) })}
                className="input-shell w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => onChange({ ...form, dueDate: event.target.value })}
                className="input-shell w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => onChange({ ...form, notes: event.target.value })}
              className="input-shell w-full resize-none"
              placeholder="Payment terms, extra instructions..."
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span>₹{Number(subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
              <span>GST</span>
              <span>₹{Number((subtotal * Number(form.tax || 0)) / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-slate-50">
              <span>Total</span>
              <span>₹{Number(total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Create invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
