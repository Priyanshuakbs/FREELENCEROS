import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, Download, Briefcase, User, Mail, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'

const TEMPLATES = [
  {
    name: '💻 Web Development Agreement',
    terms: `1. SCOPE OF WORK: The Freelancer will design, build, and deploy the website according to specified requirements.
2. TIMELINE: The project will commence immediately and will complete within 30 days.
3. FEES: The total project budget is payable in two parts: 50% deposit and 50% upon successful delivery.
4. IP RIGHTS: All code and digital assets generated during development belong entirely to the Client upon final payment.`,
  },
  {
    name: '🎨 Freelance Design Contract',
    terms: `1. SERVICES: The Freelancer will produce logo and brand styling guidelines.
2. REVISIONS: Up to 3 rounds of design revisions are included. Extra edits will bill at ₹1,500/hour.
3. DELIVERY: High-quality SVG, PNG, and source Figma formats will be exported.
4. ATTRIBUTION: Freelancer retains the right to display design assets in their personal portfolio.`,
  },
  {
    name: '📈 SEO & Marketing Retainer',
    terms: `1. ENGAGEMENT: Freelancer provides search visibility optimizations and keyword rankings tracking monthly.
2. DURATION: This contract operates on a 3-month rolling basis.
3. COMPENSATION: Retainer payments are due on the 1st day of each billing month.
4. CONFIDENTIALITY: Neither party will share sensitive business performance metrics with external competitors.`,
  },
]

export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    description: '',
    terms: '',
    amount: '',
    status: 'draft',
  })
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const handleGenerateAITerms = async () => {
    if (!formData.title.trim()) {
      toast.error('Please fill in the Contract Title first so AI can generate relevant terms!')
      return
    }

    setAiGenerating(true)
    try {
      toast.loading('Generating clauses using Gemini...', { id: 'ai-contract' })
      const { data } = await api.post('/ai/generate-contract', {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
      })
      setFormData(prev => ({ ...prev, terms: data.terms }))
      toast.success('Professional clauses generated!', { id: 'ai-contract' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate terms', { id: 'ai-contract' })
    } finally {
      setAiGenerating(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const { data } = await api.get('/contracts')
      setContracts(data.contracts)
    } catch {
      toast.error('Failed to load contracts')
    }
  }

  const loadTemplate = (terms) => {
    setFormData({ ...formData, terms })
    toast.success('Template loaded!')
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.clientName.trim() || !formData.clientEmail.trim() || !formData.terms.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/contracts', {
        ...formData,
        amount: Number(formData.amount) || 0,
      })
      setContracts([data.contract, ...contracts])
      setFormData({
        title: '',
        clientName: '',
        clientEmail: '',
        description: '',
        terms: '',
        amount: '',
        status: 'draft',
      })
      toast.success('Contract created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create contract')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract?')) return
    try {
      await api.delete(`/contracts/${id}`)
      setContracts(contracts.filter((c) => c._id !== id))
      toast.success('Deleted!')
    } catch {
      toast.error('Failed to delete contract')
    }
  }

  const handleDownload = async (id, title) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' })
      const res = await api.get(`/contracts/${id}/pdf`, { responseType: 'blob' })
      const file = new Blob([res.data], { type: 'application/pdf' })
      const fileURL = URL.createObjectURL(file)

      const link = document.createElement('a')
      link.href = fileURL
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_contract.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('Downloaded!', { id: 'pdf-toast' })
    } catch {
      toast.error('Failed to generate PDF', { id: 'pdf-toast' })
    }
  }

  return (
    <AnimatedPage className="page-container space-y-8 relative">
      {/* Ambient glow – decorative only */}
      <div className="pointer-events-none absolute top-10 right-10 h-80 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-72 w-80 rounded-full bg-purple-500/5 blur-[100px]" />

      <PageHeader
        eyebrow="Legal & Agreements"
        title={<>Contracts & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Proposals</span> 📜</>}
        description="Draft, print, and manage agreements with professional terms templates and AI-generated clauses."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ── Form panel ── */}
        <div className="space-y-6 lg:col-span-5">
          <SurfaceCard className="space-y-6">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Create Agreement</p>

            {/* Template Buttons */}
            <div className="space-y-3">
              <label className="form-label">Quick Templates</label>
              <div className="flex flex-col gap-2">
                {TEMPLATES.map((temp) => (
                  <button
                    key={temp.name}
                    type="button"
                    onClick={() => loadTemplate(temp.terms)}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-left text-xs font-medium transition active:scale-[0.98]"
                    style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)' }}
                  >
                    <span>{temp.name}</span>
                    <span className="text-[10px] text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">Load →</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contract Title */}
              <div>
                <label className="form-label">Contract Title</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                    <Briefcase size={14} />
                  </span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Portfolio Website Redesign"
                    className="input-shell w-full pl-10"
                    required
                  />
                </div>
              </div>

              {/* Client Name + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Client Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="input-shell w-full pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Client Email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      placeholder="client@mail.com"
                      className="input-shell w-full pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Budget + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Budget (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="45000"
                    className="input-shell w-full"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-shell w-full"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="signed">Signed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Project Outline</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Summary of deliverables..."
                  className="input-shell w-full resize-none"
                />
              </div>

              {/* Terms */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="form-label mb-0">Scope & Terms</label>
                  <button
                    type="button"
                    onClick={handleGenerateAITerms}
                    disabled={aiGenerating}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold text-indigo-400 transition hover:bg-indigo-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                        <span>Generating Clauses...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} className="animate-pulse text-indigo-400" />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Terms, revisions policies, and milestones agreements..."
                  className="input-shell w-full resize-none font-mono leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full justify-center disabled:opacity-50"
              >
                <Plus size={14} />
                {loading ? 'Saving Contract...' : 'Save Contract'}
              </button>
            </form>
          </SurfaceCard>
        </div>

        {/* ── Contracts list ── */}
        <div className="space-y-6 lg:col-span-7">
          <SurfaceCard>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Contracts Register</p>

            {contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <FileText size={36} className="animate-pulse text-indigo-400/50" />
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>No contracts created yet</p>
                <p className="max-w-xs text-xs leading-normal" style={{ color: 'var(--text-subtle)' }}>
                  Set up your terms on the left to start generating professional agreements.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((con) => (
                  <div
                    key={con._id}
                    className="group flex items-center justify-between gap-4 rounded-2xl p-5 transition duration-300"
                    style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold leading-snug transition-colors group-hover:text-indigo-400" style={{ color: 'var(--text)' }}>
                        {con.title}
                      </h3>
                      <p className="mt-1 truncate text-xs" style={{ color: 'var(--text-subtle)' }}>
                        Client: <strong style={{ color: 'var(--text-muted)' }}>{con.clientName}</strong>{' '}
                        <span style={{ color: 'var(--text-faint)' }}>({con.clientEmail})</span>
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-extrabold text-indigo-400">
                          ₹{Number(con.amount).toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase ${
                            con.status === 'signed'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : con.status === 'sent'
                              ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                              : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {con.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(con._id, con.title)}
                        className="cursor-pointer rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-indigo-400 transition hover:bg-indigo-500/25 hover:text-indigo-300 active:scale-95"
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(con._id)}
                        className="cursor-pointer rounded-xl border border-transparent p-2.5 opacity-0 transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 group-hover:opacity-100"
                        style={{ color: 'var(--text-subtle)' }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </AnimatedPage>
  )
}
