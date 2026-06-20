import { useEffect, useMemo, useState } from 'react'
import { Check, Clock3, Copy, FileText, Link, Mail, MessageSquare, Phone, Plus, Search, Shield, Tag, Trash2, UserRound, Wallet, X, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import EmptyState from '../components/ui/EmptyState'
import MetricCard from '../components/ui/MetricCard'
import SearchField from '../components/ui/SearchField'
import StatusBadge from '../components/ui/StatusBadge'

const backendOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  notes: '',
  tags: '',
  totalProjectAmount: '',
  allowLogin: false,
  password: '',
}

const emptyPaymentForm = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  invoiceNumber: '',
  screenshot: null,
}

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

export default function Clients() {
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [onboardingLink, setOnboardingLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data.clients || [])
    } catch {
      toast.error('Failed to load clients')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      notes: client.notes || '',
      tags: Array.isArray(client.tags) ? client.tags.join(', ') : '',
      totalProjectAmount: client.totalProjectAmount || '',
      allowLogin: Boolean(client.user),
      password: '',
    })
    setShowModal(true)
  }

  const openLedger = (client) => {
    setSelectedClient(client)
    setPaymentModal(false)
  }

  const openPayment = (client) => {
    setSelectedClient(client)
    setPaymentForm(emptyPaymentForm)
    setPaymentModal(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        totalProjectAmount: Number(form.totalProjectAmount || 0),
      }

      if (editing) {
        await api.put(`/clients/${editing._id}`, payload)
        toast.success('Client updated successfully')
      } else {
        await api.post('/clients', payload)
        toast.success('Client added successfully')
      }
      setShowModal(false)
      setEditing(null)
      setForm(emptyForm)
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save client')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Client deleted')
      if (selectedClient?._id === id) setSelectedClient(null)
      fetchClients()
    } catch {
      toast.error('Failed to delete client')
    }
  }

  const handleGenerateOnboardingLink = async () => {
    setLinkLoading(true)
    try {
      const { data } = await api.post('/onboarding/generate-link')
      setOnboardingLink(data.link)
      toast.success('Onboarding link generated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link')
    } finally {
      setLinkLoading(false)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(onboardingLink)
    setLinkCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setLinkCopied(false), 1800)
  }

  const handlePaymentSubmit = async (event) => {
    event.preventDefault()
    if (!selectedClient) return

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }

    setPaymentLoading(true)
    try {
      const formData = new FormData()
      formData.append('amount', paymentForm.amount)
      formData.append('date', paymentForm.date)
      formData.append('note', paymentForm.note)
      formData.append('invoiceNumber', paymentForm.invoiceNumber)
      if (paymentForm.screenshot) formData.append('screenshot', paymentForm.screenshot)

      const { data } = await api.post(`/clients/${selectedClient._id}/payments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setClients((prev) => prev.map((item) => (item._id === data.client._id ? data.client : item)))
      setSelectedClient(data.client)
      setPaymentModal(false)
      toast.success('Payment recorded successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return clients

    return clients.filter((client) =>
      [
        client.name,
        client.email,
        client.company,
        client.phone,
        client.notes,
        ...(client.tags || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    )
  }, [clients, query])

  const stats = useMemo(() => {
    const payments = clients.flatMap((client) =>
      (client.payments || []).map((payment) => ({ ...payment, clientName: client.name, clientId: client._id }))
    )

    return {
      totalClients: clients.length,
      totalRevenue: clients.reduce((sum, client) => sum + Number(client.amountPaid || 0), 0),
      pendingRevenue: clients.reduce((sum, client) => sum + Number(client.remainingAmount || 0), 0),
      fullyPaid: clients.filter((client) => client.paymentStatus === 'paid').length,
      recentPayments: payments.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    }
  }, [clients])

  return (
    <div className="page-container max-w-none space-y-8">
      <PageHeader
        eyebrow="Client Relationships"
        title="Clients"
        description="Manage client records, payment milestones, proofs, notes, and onboard new accounts from one payment-aware workspace."
        actions={(
          <>
            <button onClick={handleGenerateOnboardingLink} disabled={linkLoading} className="btn-secondary">
              <Link size={16} /> {linkLoading ? 'Generating...' : 'Onboarding Link'}
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} /> Add Client
            </button>
          </>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Clients" value={stats.totalClients} icon={UserRound} accent="indigo" />
        <MetricCard label="Received Payments" value={formatCurrency(stats.totalRevenue)} icon={Wallet} accent="emerald" />
        <MetricCard label="Pending Amount" value={formatCurrency(stats.pendingRevenue)} icon={Clock3} accent="rose" />
        <MetricCard label="Fully Paid" value={stats.fullyPaid} icon={Shield} accent="cyan" />
      </div>

      <div className="space-y-6">
        {onboardingLink ? (
          <SurfaceCard className="border-emerald-400/18 bg-emerald-500/8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="section-eyebrow border-emerald-400/20 bg-emerald-500/10 text-emerald-200">Client Onboarding</p>
                <p className="mt-3 truncate text-sm text-emerald-100">{onboardingLink}</p>
                <p className="mt-1 text-xs text-emerald-200/70">Valid for 7 days. Share this link with new clients to streamline intake.</p>
              </div>
              <button onClick={handleCopyLink} className="btn-secondary text-emerald-100">
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                {linkCopied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-50">Recent payments</p>
              <p className="text-sm text-slate-400">Latest entries from all client ledgers.</p>
            </div>
            <FileText size={18} className="text-slate-500" />
          </div>
          <div className="space-y-3">
            {stats.recentPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                Payment entries will appear here.
              </div>
            ) : (
              stats.recentPayments.map((payment, index) => (
                <div key={`${payment.clientId}-${index}`} className="surface-card-compact">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{payment.clientName}</p>
                      <p className="mt-1 text-xs text-slate-500">{payment.note || 'Payment received'}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">{formatCurrency(payment.amount)}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{new Date(payment.date).toLocaleDateString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-50">Client directory</p>
              <p className="text-sm text-slate-400">Search contacts, review account readiness, and jump into payment ledgers quickly.</p>
            </div>
            <div className="w-full max-w-sm">
              <SearchField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, notes, tags..." />
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <EmptyState
              icon={Search}
              title={clients.length === 0 ? 'No clients added yet' : 'No matching clients found'}
              description={clients.length === 0
                ? 'Create your first client record to start projects, invoices, and collaboration flows.'
                : 'Try a different search term or clear the filters to see your full directory.'}
              action={clients.length === 0 ? (
                <button onClick={openCreate} className="btn-primary">
                  Add First Client
                </button>
              ) : null}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-1">
              {filteredClients.map((client) => {
                const progress = client.totalProjectAmount > 0 ? Math.min(100, Math.round((Number(client.amountPaid || 0) / Number(client.totalProjectAmount || 1)) * 100)) : 0
                return (
                  <motion.div key={client._id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                    <SurfaceCard className="h-full">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-indigo-500/22 to-violet-500/18 text-sm font-semibold text-slate-50 shadow-[0_18px_40px_-26px_rgba(99,102,241,0.75)]">
                            {client.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'CL'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-semibold text-slate-50">{client.name}</p>
                              <StatusBadge status={client.paymentStatus || 'pending'} />
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-400">{client.company || 'Independent client'}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              {client.totalProjectAmount > 0
                                ? `${progress}% collected of ${formatCurrency(client.totalProjectAmount)}`
                                : 'No project amount set yet'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => openLedger(client)} className="btn-secondary px-4 py-2.5 text-xs">
                            <FileText size={14} /> Ledger
                          </button>
                          <button onClick={() => openPayment(client)} className="btn-primary px-4 py-2.5 text-xs">
                            <Wallet size={14} /> Record payment
                          </button>
                          <button
                            onClick={() => handleDelete(client._id)}
                            className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-3 text-rose-200 transition hover:bg-rose-500/16"
                            title="Delete client"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 lg:grid-cols-4">
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Total</p>
                          <p className="mt-2 text-base font-semibold text-slate-50">{formatCurrency(client.totalProjectAmount)}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Paid</p>
                          <p className="mt-2 text-base font-semibold text-emerald-300">{formatCurrency(client.amountPaid)}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Remaining</p>
                          <p className="mt-2 text-base font-semibold text-rose-300">{formatCurrency(client.remainingAmount)}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Progress</p>
                          <p className="mt-2 text-base font-semibold text-slate-50">{progress}%</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Mail size={15} className="text-slate-500" />
                            <a href={`mailto:${client.email}`} className="truncate hover:text-white">{client.email}</a>
                          </div>

                          {client.phone ? (
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <Phone size={15} className="text-slate-500" />
                              <span>{client.phone}</span>
                            </div>
                          ) : null}

                          {client.address ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Address</p>
                              <p className="mt-2 text-sm leading-6 text-slate-400">{client.address}</p>
                            </div>
                          ) : null}

                          {client.notes ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Client notes</p>
                              <p className="mt-2 text-sm leading-6 text-slate-400">{client.notes}</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Payment status</p>
                                <p className="mt-1 text-sm text-slate-200">{client.paymentStatus || 'pending'}</p>
                              </div>
                              <StatusBadge status={client.paymentStatus || 'pending'} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Collection progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full border border-white/10 bg-white/[0.03] p-[2px]">
                              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(client.tags || []).length === 0 ? (
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-500">
                                No tags
                              </span>
                            ) : client.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
                                <Tag size={10} className="mr-1 inline-block" /> {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SurfaceCard>
                  </motion.div>
                )
              })}
            </div>
          )}
        </SurfaceCard>
      </div>

      <AnimatePresence>
        {selectedClient && !paymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 14, opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Payment Ledger</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-50">{selectedClient.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Total {formatCurrency(selectedClient.totalProjectAmount)} | Paid {formatCurrency(selectedClient.amountPaid)} | Remaining {formatCurrency(selectedClient.remainingAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedClient(null)} className="btn-secondary px-3 py-2">
                    <X size={16} />
                  </button>
                  <button onClick={() => openPayment(selectedClient)} className="btn-primary">
                    <Plus size={16} /> Record Payment
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <SurfaceCard className="bg-white/[0.03]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Email</p>
                        <p className="mt-1 text-sm text-slate-100">{selectedClient.email}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Payment Status</p>
                        <StatusBadge status={selectedClient.paymentStatus || 'pending'} className="mt-1" />
                      </div>
                    </div>
                    {selectedClient.address ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Address</p>
                        <p className="mt-1 text-sm text-slate-300">{selectedClient.address}</p>
                      </div>
                    ) : null}
                    {selectedClient.notes ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Client Notes</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{selectedClient.notes}</p>
                      </div>
                    ) : null}
                  </SurfaceCard>

                  <SurfaceCard className="bg-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-50">Timeline</p>
                        <p className="text-sm text-slate-400">Payment receipts and proofs</p>
                      </div>
                      <FileText size={18} className="text-slate-500" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {(selectedClient.payments || []).length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                          No payments recorded yet.
                        </div>
                      ) : (
                        selectedClient.payments.map((payment, index) => (
                          <div key={`${payment._id || index}`} className="surface-card-compact">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-100">{formatCurrency(payment.amount)}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {new Date(payment.date).toLocaleDateString('en-IN')}
                                  {payment.invoiceNumber ? ` · Invoice ${payment.invoiceNumber}` : ''}
                                </p>
                              </div>
                              <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">#{selectedClient.payments.length - index}</span>
                            </div>
                            {payment.note ? <p className="mt-3 text-sm leading-6 text-slate-300">{payment.note}</p> : null}
                            {payment.screenshot ? (
                              <a
                                href={`${backendOrigin}${payment.screenshot}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.06]"
                              >
                                <Upload size={12} /> Open screenshot
                              </a>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </SurfaceCard>
                </div>

                <SurfaceCard className="bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-50">Payment summary</p>
                      <p className="text-sm text-slate-400">Client ledger overview and collection ratios.</p>
                    </div>
                    <FileText size={18} className="text-slate-500" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Total Project Amount</p>
                      <p className="mt-1 text-lg font-semibold text-slate-50">{formatCurrency(selectedClient.totalProjectAmount)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Amount Paid</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{formatCurrency(selectedClient.amountPaid)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Remaining Amount</p>
                      <p className="mt-1 text-lg font-semibold text-rose-300">{formatCurrency(selectedClient.remainingAmount)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Payment Status</p>
                      <StatusBadge status={selectedClient.paymentStatus || 'pending'} className="mt-1" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20" />
                      <div>
                        <p className="text-sm font-medium text-slate-100">Collection progress</p>
                        <p className="text-xs text-slate-500">Paid vs total project value</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full border border-white/10 bg-white/[0.03] p-[2px]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{
                          width: `${selectedClient.totalProjectAmount > 0 ? Math.min(100, Math.round((Number(selectedClient.amountPaid || 0) / Number(selectedClient.totalProjectAmount || 1)) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-100">Payment notes</p>
                        <p className="text-xs text-slate-500">Use notes to record context for each payment entry.</p>
                      </div>
                    </div>
                  </div>
                </SurfaceCard>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 14, opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">{editing ? 'Edit Client' : 'New Client'}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-50">
                    {editing ? 'Update client details' : 'Create a new client record'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Keep contact details, notes, tags, and payment expectations neatly structured.
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="btn-secondary px-3 py-2">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Full name</label>
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      required
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Company</label>
                    <input
                      value={form.company}
                      onChange={(event) => setForm({ ...form, company: event.target.value })}
                      className="input-shell w-full"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Total project amount</label>
                    <input
                      type="number"
                      value={form.totalProjectAmount}
                      onChange={(event) => setForm({ ...form, totalProjectAmount: event.target.value })}
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Tags</label>
                    <input
                      value={form.tags}
                      onChange={(event) => setForm({ ...form, tags: event.target.value })}
                      placeholder="design, long-term, retainer"
                      className="input-shell w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Address</label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                    className="input-shell w-full resize-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Client notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    className="input-shell w-full resize-none"
                    placeholder="Important project, payment, or communication notes..."
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={form.allowLogin}
                      onChange={(event) => setForm({ ...form, allowLogin: event.target.checked })}
                      className="h-4 w-4 rounded border-white/10 bg-transparent text-indigo-500"
                    />
                    Grant portal login access to this client
                  </label>

                  {form.allowLogin ? (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm text-slate-300">Password {editing ? '(optional)' : ''}</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        required={!editing}
                        placeholder={editing ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                        className="input-shell w-full"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : editing ? 'Update Client' : 'Create Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedClient && paymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 14, opacity: 0, scale: 0.98 }}
              className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Record Payment</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-50">{selectedClient.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Add a payment entry with screenshot proof and notes.
                  </p>
                </div>
                <button onClick={() => setPaymentModal(false)} className="btn-secondary px-3 py-2">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Amount</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}
                      required
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Date</label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value })}
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Invoice Number</label>
                    <input
                      value={paymentForm.invoiceNumber}
                      onChange={(event) => setPaymentForm({ ...paymentForm, invoiceNumber: event.target.value })}
                      placeholder="INV-2026-0001"
                      className="input-shell w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Screenshot / proof</label>
                    <label className="input-shell flex w-full cursor-pointer items-center justify-between gap-3">
                      <span className="truncate text-slate-400">
                        {paymentForm.screenshot ? paymentForm.screenshot.name : 'Choose an image file'}
                      </span>
                      <Upload size={16} className="text-slate-500" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setPaymentForm({ ...paymentForm, screenshot: event.target.files?.[0] || null })}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Payment notes</label>
                  <textarea
                    rows={4}
                    value={paymentForm.note}
                    onChange={(event) => setPaymentForm({ ...paymentForm, note: event.target.value })}
                    className="input-shell w-full resize-none"
                    placeholder="Bank transfer, UPI reference, stage milestone, etc."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setPaymentModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={paymentLoading} className="btn-primary">
                    {paymentLoading ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
