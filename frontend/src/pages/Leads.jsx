import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall,
  Plus,
  RefreshCcw,
  Filter,
  Users,
  BadgeCheck,
  CircleDollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../lib/axios'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import SurfaceCard from '../components/ui/SurfaceCard'
import SearchField from '../components/ui/SearchField'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import Clients from './Clients'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'Website',
  priority: 'Medium',
  status: 'New',
  budget: '',
  requirements: '',
  followUpDate: '',
}

export default function Leads() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('leads') // 'leads' | 'clients'
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [stats, setStats] = useState({ total: 0, converted: 0, pending: 0, revenue: 0 })

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/leads')
      const list = data.leads || []
      setLeads(list)
      setStats({
        total: list.length,
        converted: list.filter((x) => x.status === 'Converted').length,
        pending: list.filter((x) => x.status !== 'Converted').length,
        revenue: list.reduce((sum, x) => sum + Number(x.budget || 0), 0),
      })
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (lead) => {
    setEditingId(lead._id)
    setForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || 'Website',
      priority: lead.priority || 'Medium',
      status: lead.status || 'New',
      budget: lead.budget || '',
      requirements: lead.requirements || '',
      followUpDate: lead.followUpDate ? lead.followUpDate.substring(0, 10) : '',
    })
    setShowModal(true)
  }

  const saveLead = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/leads/${editingId}`, form)
        toast.success('Lead updated')
      } else {
        await api.post('/leads', form)
        toast.success('Lead created')
      }
      setShowModal(false)
      fetchLeads()
    } catch {
      toast.error('Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  const deleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return
    try {
      await api.delete(`/leads/${id}`)
      toast.success('Lead deleted')
      fetchLeads()
    } catch {
      toast.error('Delete failed')
    }
  }

  const convertLead = async (id) => {
    try {
      await api.post(`/leads/${id}/convert`)
      toast.success('Lead converted')
      fetchLeads()
    } catch {
      toast.error('Conversion failed')
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchMatch =
        lead.name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.company?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase())
      const statusMatch = status === 'All' ? true : lead.status === status
      return searchMatch && statusMatch
    })
  }, [search, status, leads])

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow={activeTab === 'leads' ? "CRM" : "Client Relationships"}
        title={activeTab === 'leads' ? "Lead Management" : "Clients"}
        description={activeTab === 'leads' ? "Track, manage and convert leads into clients." : "Manage client records, payment milestones, proofs, notes, and onboarding."}
        actions={activeTab === 'leads' ? (
          <>
            <button className="btn-secondary" onClick={fetchLeads}>
              <RefreshCcw size={16} /> Refresh
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Lead
            </button>
          </>
        ) : null}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-white/[0.04] gap-2 pb-px">
        {[
          { id: 'leads', label: 'Leads Pipeline', icon: PhoneCall },
          { id: 'clients', label: 'Clients Directory', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold uppercase tracking-wider pb-3 px-4 transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'leads' ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Leads" value={stats.total} icon={PhoneCall} accent="amber" />
            <MetricCard label="Converted" value={stats.converted} icon={BadgeCheck} accent="emerald" />
            <MetricCard label="Pending" value={stats.pending} icon={Users} accent="cyan" />
            <MetricCard
              label="Pipeline Value"
              value={`₹${stats.revenue.toLocaleString('en-IN')}`}
              icon={CircleDollarSign}
              accent="indigo"
            />
          </div>

          <SurfaceCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <SearchField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
              />
              <div className="flex items-center gap-3">
                <Filter size={18} className="text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-shell"
                >
                  <option>All</option>
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Proposal Sent</option>
                  <option>Negotiation</option>
                  <option>Converted</option>
                  <option>Lost</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                icon={PhoneCall}
                title="No leads found"
                description="Create your first lead to start your CRM."
                action={
                  <button className="btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Add Lead
                  </button>
                }
              />
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                      <th className="py-4">Lead</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Priority</th>
                      <th>Follow Up</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="py-5">
                          <div>
                            <p className="font-medium text-slate-100">{lead.name}</p>
                            <p className="text-xs text-slate-500">{lead.email}</p>
                          </div>
                        </td>
                        <td className="text-sm text-slate-300">{lead.company || '-'}</td>
                        <td>
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="text-sm text-slate-300">
                          ₹{Number(lead.budget || 0).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              lead.priority === 'High'
                                ? 'bg-red-500/20 text-red-300'
                                : lead.priority === 'Medium'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-green-500/20 text-green-300'
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </td>
                        <td className="text-sm text-slate-400">
                          {lead.followUpDate
                            ? new Date(lead.followUpDate).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/leads/${lead._id}`)}
                              className="btn-secondary"
                            >
                              View
                            </button>
                            <button className="btn-secondary" onClick={() => openEdit(lead)}>
                              Edit
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => convertLead(lead._id)}
                              disabled={lead.status === 'Converted'}
                            >
                              Convert
                            </button>
                            <button
                              className="rounded-2xl border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"
                              onClick={() => deleteLead(lead._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        </>
      ) : (
        <Clients embedded={true} />
      )}

      {/* ── Add / Edit Lead Modal ── */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/92 p-6 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-eyebrow">{editingId ? 'Edit Lead' : 'New Lead'}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-50">
                  {editingId ? 'Update lead details' : 'Create a new lead'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-secondary px-3 py-2">
                ✕
              </button>
            </div>

            <form onSubmit={saveLead} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Name</label>
                  <input
                    required
                    placeholder="John Doe"
                    className="input-shell w-full"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="input-shell w-full"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Phone</label>
                  <input
                    placeholder="+91 9876543210"
                    className="input-shell w-full"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Company</label>
                  <input
                    placeholder="Acme Inc."
                    className="input-shell w-full"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    className="input-shell w-full"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Follow Up Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="input-shell w-full"
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Source</label>
                  <select
                    className="input-shell w-full"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    <option>Website</option>
                    <option>Referral</option>
                    <option>Social Media</option>
                    <option>Cold Outreach</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Priority</label>
                  <select
                    className="input-shell w-full"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-300">Status</label>
                  <select
                    className="input-shell w-full"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Proposal Sent</option>
                    <option>Negotiation</option>
                    <option>Converted</option>
                    <option>Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Requirements</label>
                <textarea
                  rows={4}
                  placeholder="Project requirements, notes, context..."
                  className="input-shell w-full resize-none"
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}