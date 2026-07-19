import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { BadgeIndianRupee, Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'

export default function ClientResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post(`/auth/client/reset-password/${token}`, { password: form.password })
      toast.success('Password reset successfully! Please log in.')
      navigate('/client-login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset link is invalid or expired')
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

        <h1 className="mb-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Reset Password</h1>
        <p className="mb-8 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
          Set a new password for your client account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-shell w-full pl-10"
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="input-shell w-full pl-10"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !form.password || !form.confirmPassword}
            className="btn-primary mt-2 w-full justify-center disabled:opacity-50"
          >
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-8 text-center" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
          <Link to="/client-login" className="flex items-center justify-center gap-1 text-xs font-semibold text-purple-400 transition hover:text-purple-300">
            <ArrowLeft size={14} /> Back to client login
          </Link>
        </div>
      </div>
    </AnimatedPage>
  )
}
