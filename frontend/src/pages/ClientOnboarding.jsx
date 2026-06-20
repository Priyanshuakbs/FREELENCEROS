import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Loader2, UserPlus } from 'lucide-react'
import api from '../lib/axios'

export default function ClientOnboarding() {
  const { token } = useParams()
  const [valid, setValid] = useState(null) // null = loading, true = valid, false = invalid
  const [freelancerName, setFreelancerName] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', requirements: '', budgetRange: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const validate = async () => {
      try {
        const { data } = await api.get(`/onboarding/validate/${token}`)
        setValid(true)
        setFreelancerName(data.freelancerName || 'our team')
      } catch {
        setValid(false)
      }
    }
    if (token) validate()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Name and email are required.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post(`/onboarding/submit/${token}`, form)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const BUDGET_OPTIONS = ['Under ₹25,000', '₹25,000 – ₹75,000', '₹75,000 – ₹2,00,000', '₹2,00,000 – ₹5,00,000', 'Above ₹5,00,000']

  if (valid === null) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (valid === false) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔗</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Link Expired</h1>
          <p className="text-gray-400 text-sm">This onboarding link is invalid or has expired. Please request a new link from your contact.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">You're all set! 🎉</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your information has been submitted successfully to <strong className="text-white">{freelancerName}</strong>. They'll review your requirements and get in touch with you soon.
          </p>
          <p className="text-xs text-gray-600 mt-4">Powered by FreelanceOS</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-2xl">💼</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Let's Get Started</h1>
          <p className="text-gray-400 text-sm mt-2">
            Share your project requirements with <strong className="text-indigo-400">{freelancerName}</strong>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#111118]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 shadow-2xl space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="rahul@company.com"
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition placeholder-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Company / Brand</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Sharma Enterprises"
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Project Requirements</label>
              <textarea
                value={form.requirements}
                onChange={e => setForm({ ...form, requirements: e.target.value })}
                rows={4}
                placeholder="Describe what you need — type of project, goals, features, target audience, timeline, any specific technologies..."
                className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition placeholder-gray-600 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Budget Range</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, budgetRange: opt })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      form.budgetRange === opt
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-white/[0.02] text-gray-400 border-white/[0.04] hover:bg-white/[0.05] hover:text-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                : <><UserPlus size={16} /> Submit My Details</>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 pt-2">
            🔒 Your information is private and will only be shared with our team.
          </p>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">Powered by <span className="text-indigo-500 font-semibold">FreelanceOS</span></p>
      </div>
    </div>
  )
}
