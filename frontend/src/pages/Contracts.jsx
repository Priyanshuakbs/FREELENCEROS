import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, Download, Briefcase, User, Mail, ShieldAlert, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'

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
    <AnimatedPage className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative overflow-hidden text-gray-250">
      {/* Glow ambient background lights */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Contracts & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Proposals</span> 📜
        </h1>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">Draft, print, and manage agreements with professional terms templates.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form and Template selectors (Left 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Create Agreement</h2>
            
            {/* Template Buttons */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider">Quick Templates</label>
              <div className="flex flex-col gap-2">
                {TEMPLATES.map((temp) => (
                  <button
                    key={temp.name}
                    type="button"
                    onClick={() => loadTemplate(temp.terms)}
                    className="group w-full text-left bg-[#0a0a0f]/80 hover:bg-white/[0.02] border border-white/[0.04] hover:border-indigo-500/30 text-gray-300 text-xs px-3.5 py-3 rounded-xl transition duration-200 cursor-pointer active:scale-[0.98] font-medium flex items-center justify-between"
                  >
                    <span>{temp.name}</span>
                    <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Load →</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contract Title</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><Briefcase size={14} /></span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Portfolio Website Redesign"
                    className="w-full bg-[#0a0a0f]/80 text-white rounded-xl pl-10 pr-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Client Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><User size={14} /></span>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full bg-[#0a0a0f]/80 text-white rounded-xl pl-10 pr-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Client Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><Mail size={14} /></span>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      placeholder="client@mail.com"
                      className="w-full bg-[#0a0a0f]/80 text-white rounded-xl pl-10 pr-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Budget (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="45000"
                    className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all text-xs"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="signed">Signed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Project Outline</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Summary of deliverables..."
                  className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider">Scope & Terms</label>
                  <button
                    type="button"
                    onClick={handleGenerateAITerms}
                    disabled={aiGenerating}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                        <span>Generating Clauses...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} className="text-indigo-400 animate-pulse" />
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
                  className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs font-mono resize-none leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-655 to-purple-655 bg-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition duration-300 flex items-center justify-center gap-2 text-xs disabled:opacity-50 cursor-pointer active:scale-95 mt-2"
              >
                <Plus size={14} />
                {loading ? 'Saving Contract...' : 'Save Contract'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Contracts List (Right 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur shadow-xl">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Contracts Register</h2>
            {contracts.length === 0 ? (
              <div className="text-center py-20 text-gray-500 flex flex-col items-center justify-center gap-3">
                <FileText size={36} className="text-gray-600 animate-pulse" />
                <p className="text-sm font-bold text-white">No contracts created yet</p>
                <p className="text-xs text-gray-500 max-w-xs leading-normal">Set up your terms on the left to start generating professional agreements.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((con) => (
                  <div
                    key={con._id}
                    className="group p-5 bg-[#111118]/60 border border-white/[0.04] hover:border-indigo-500/30 rounded-2xl transition duration-300 flex items-center justify-between gap-4 backdrop-blur shadow-md"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate text-sm leading-snug group-hover:text-indigo-300 transition-colors">{con.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        Client: <strong className="text-gray-300 font-semibold">{con.clientName}</strong> <span className="text-gray-600">({con.clientEmail})</span>
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                          ₹{Number(con.amount).toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md border ${
                            con.status === 'signed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : con.status === 'sent'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-white/[0.04]'
                          }`}
                        >
                          {con.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(con._id, con.title)}
                        className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/25 p-2.5 rounded-xl transition cursor-pointer active:scale-95"
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(con._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/10 cursor-pointer active:scale-95"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
