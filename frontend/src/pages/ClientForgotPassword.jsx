import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BadgeIndianRupee, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'

export default function ClientForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/client/forgot-password', { email })
      setSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="auth-page">
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="auth-card relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>FreelanceOS</span>
        </div>

        <h1 className="mb-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Forgot Password</h1>
        <p className="mb-8 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
          Recover your client account password
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="client@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-shell w-full pl-10"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary mt-2 w-full justify-center disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              We've emailed a password reset link to <strong>{email}</strong>. Please check your inbox.
            </div>
            <button onClick={() => navigate('/client-login')} className="btn-secondary w-full justify-center">
              Back to Login
            </button>
          </div>
        )}

        <div className="mt-8 text-center" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
          <Link to="/client-login" className="flex items-center justify-center gap-1 text-xs font-semibold text-purple-400 transition hover:text-purple-300">
            <ArrowLeft size={14} /> Back to client login
          </Link>
        </div>
      </div>
    </AnimatedPage>
  )
}
