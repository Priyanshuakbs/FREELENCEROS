import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle, BadgeIndianRupee } from 'lucide-react'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      toast.success('Password reset link sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="auth-page">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="auth-card relative z-10">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
            FreelanceOS
          </span>
        </div>

        {!submitted ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Forgot Password? 🔒</h1>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-subtle)' }}>
                No worries! Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
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
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending Link...</>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 pt-2 text-sm font-medium transition"
              style={{ color: 'var(--text-subtle)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-subtle)' }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center">
            <CheckCircle className="mx-auto text-emerald-400" size={56} />
            <div className="space-y-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Check Your Inbox!</h2>
              <p className="px-2 text-sm" style={{ color: 'var(--text-subtle)' }}>
                We have sent a password reset link to{' '}
                <strong style={{ color: 'var(--text-muted)' }}>{email}</strong>. Please check your inbox and click the link.
              </p>
            </div>
            <Link
              to="/login"
              className="btn-secondary block w-full text-center"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
