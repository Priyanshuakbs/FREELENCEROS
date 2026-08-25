import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BadgeIndianRupee, Lock, Mail, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import useClientAuthStore from '../store/clientAuthStore'

export default function ClientLogin() {
  const navigate = useNavigate()
  const { setAuth } = useClientAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/client/login', form)
      setAuth(data.client, data.token)
      toast.success('Welcome to your client dashboard!')
      navigate('/client-dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials or login not enabled')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="auth-page">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="auth-card relative z-10">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>FreelanceOS</span>
        </div>

        <h1 className="mb-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Client Portal</h1>
        <p className="mb-8 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
          Sign in to access your projects and payments
        </p>

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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-shell w-full pl-10"
                required
              />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="form-label mb-0">Password</label>
              <Link to="/client-forgot-password" className="text-xs font-medium text-purple-400 transition hover:text-purple-300">Forgot?</Link>
            </div>
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
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full justify-center disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          >
            {loading ? 'Signing in...' : 'Sign In as Client'}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-2.5 text-center text-xs" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
          <p style={{ color: 'var(--text-subtle)' }}>
            Don't have a client account?{' '}
            <Link to="/client-register" className="font-semibold text-purple-400 transition hover:text-purple-300">
              Sign up as Client
            </Link>
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Link to="/client-verify" className="font-medium text-slate-400 transition hover:text-purple-300">
              Verify email (OTP)
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/login" className="font-medium text-slate-400 transition hover:text-slate-300">
              Freelancer Login
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
