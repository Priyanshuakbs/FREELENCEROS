import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BadgeIndianRupee, Lock, Mail, User, Building, Phone, ArrowRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import useClientAuthStore from '../store/clientAuthStore'

export default function ClientRegister() {
  const navigate = useNavigate()
  const { setAuth } = useClientAuthStore()
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
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
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        password: form.password,
      }

      const { data } = await api.post('/auth/client/register', payload)
      setAuth(data.client, data.token)
      toast.success('Client account created successfully!')

      // If user came from a public portfolio contact button
      const portfolioRedirect = sessionStorage.getItem('portfolio_redirect')
      if (portfolioRedirect) {
        sessionStorage.removeItem('portfolio_redirect')
        navigate(portfolioRedirect)
        return
      }

      // Check if OTP verification is pending
      if (!data.client?.isVerified) {
        navigate('/client-verify', { state: { email: data.client.email } })
      } else {
        navigate('/client-dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="auth-page">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="auth-card relative z-10 max-w-md">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            FreelanceOS
          </span>
        </div>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold mb-2">
            <ShieldCheck size={13} />
            <span>Client & Business Portal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            Join as a Client
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
            Hire verified freelancers & manage projects seamlessly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="form-label">Full Name / Contact Person</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-shell w-full pl-10 text-sm"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Work Email Address</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-shell w-full pl-10 text-sm"
                required
              />
            </div>
          </div>

          {/* Company & Phone (2 cols) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Company / Brand</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                  <Building size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input-shell w-full pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Phone (Optional)</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-shell w-full pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-shell w-full pl-10 text-sm"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-faint)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="input-shell w-full pl-10 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-3 w-full justify-center disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          >
            <span>{loading ? 'Creating Client Account...' : 'Create Client Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-xs" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
          <p style={{ color: 'var(--text-subtle)' }}>
            Already have a client account?{' '}
            <Link to="/client-login" className="font-semibold text-purple-400 transition hover:text-purple-300">
              Sign in as Client
            </Link>
          </p>
          <Link to="/register" className="font-medium text-slate-400 transition hover:text-slate-300">
            Want to work as a Freelancer? Register here
          </Link>
        </div>
      </div>
    </AnimatedPage>
  )
}
