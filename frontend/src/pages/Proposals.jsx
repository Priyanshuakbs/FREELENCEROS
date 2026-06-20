import { useState, useEffect } from 'react'
import { Sparkles, Copy, Download, FileText, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'

const PROJECT_TYPES = [
  'Web Application', 'Mobile App', 'E-commerce Store', 'Landing Page',
  'API / Backend Development', 'UI/UX Design', 'Branding & Logo Design',
  'SEO & Content Strategy', 'Data Analysis', 'Automation / Scripting',
]

const TONES = ['Professional', 'Friendly', 'Formal', 'Concise', 'Detailed']

export default function Proposals() {
  const [form, setForm] = useState({
    clientName: '',
    projectType: PROJECT_TYPES[0],
    description: '',
    budget: '',
    timeline: '',
    tone: 'Professional',
    myName: '',
  })
  const [proposal, setProposal] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [clients, setClients] = useState([])

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data.clients || [])).catch(() => {})
  }, [])

  const generate = async () => {
    if (!form.clientName || !form.description) {
      toast.error('Please fill in client name and project description')
      return
    }
    setLoading(true)
    setProposal('')
    try {
      const { data } = await api.post('/ai/proposal', form)
      setProposal(data.proposal)
      toast.success('Proposal generated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate proposal. Check your AI key.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([proposal], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proposal-${form.clientName.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Proposal downloaded!')
  }

  return (
    <AnimatedPage className="page-container space-y-8">
      <PageHeader
        eyebrow="AI-Powered"
        title={
          <span className="flex items-center gap-3">
            <span className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2">
              <Sparkles size={22} className="text-purple-400" />
            </span>
            AI Proposal Writer
          </span>
        }
        description="Generate professional project proposals in seconds using Gemini AI."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Form ── */}
        <SurfaceCard className="space-y-5">
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Project Details</p>

          {/* Client Name */}
          <div>
            <label className="form-label">Client Name *</label>
            <input
              value={form.clientName}
              onChange={e => setForm({ ...form, clientName: e.target.value })}
              placeholder="e.g. Rahul Sharma / Sharma Enterprises"
              list="clients-list"
              className="input-shell w-full"
            />
            <datalist id="clients-list">
              {clients.map(c => <option key={c._id} value={c.name} />)}
            </datalist>
          </div>

          {/* Your Name */}
          <div>
            <label className="form-label">Your Name / Agency</label>
            <input
              value={form.myName}
              onChange={e => setForm({ ...form, myName: e.target.value })}
              placeholder="e.g. Priyanshu / TechCraft Studio"
              className="input-shell w-full"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="form-label">Project Type</label>
            <select
              value={form.projectType}
              onChange={e => setForm({ ...form, projectType: e.target.value })}
              className="input-shell w-full"
            >
              {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Project Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe what the client needs. Include goals, features, target audience, any specific requirements..."
              className="input-shell w-full resize-none"
            />
          </div>

          {/* Budget + Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Budget (₹)</label>
              <input
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. 50,000"
                className="input-shell w-full"
              />
            </div>
            <div>
              <label className="form-label">Timeline</label>
              <input
                value={form.timeline}
                onChange={e => setForm({ ...form, timeline: e.target.value })}
                placeholder="e.g. 4 weeks"
                className="input-shell w-full"
              />
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <label className="form-label">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tone: t })}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                  style={
                    form.tone === t
                      ? { background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.35)' }
                      : { background: 'var(--bg-soft)', color: 'var(--text-subtle)', borderColor: 'var(--border-soft)' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating Proposal...</>
            ) : (
              <><Sparkles size={16} /> Generate with AI</>
            )}
          </button>
        </SurfaceCard>

        {/* ── Output panel ── */}
        <SurfaceCard className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              <FileText size={14} style={{ color: 'var(--text-subtle)' }} /> Generated Proposal
            </h2>
            {proposal && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition"
                  style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', color: 'var(--text-subtle)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-subtle)' }}
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-400 transition hover:bg-indigo-500/20 hover:text-indigo-300"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            )}
          </div>

          <div className="min-h-[400px] flex-1">
            {!proposal && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/10 bg-purple-500/10">
                  <Sparkles size={28} className="text-purple-400/50" />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                  Fill in the details and click <br />
                  <strong style={{ color: 'var(--text-subtle)' }}>"Generate with AI"</strong> to create your proposal
                </p>
              </div>
            )}
            {loading && (
              <div className="flex h-full items-center justify-center">
                <div className="space-y-3 text-center">
                  <Loader2 size={32} className="mx-auto animate-spin text-indigo-400" />
                  <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>Gemini is crafting your proposal...</p>
                </div>
              </div>
            )}
            {proposal && (
              <pre
                className="max-h-[500px] overflow-y-auto rounded-xl p-4 text-sm font-sans leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
              >
                {proposal}
              </pre>
            )}
          </div>
        </SurfaceCard>
      </div>
    </AnimatedPage>
  )
}
