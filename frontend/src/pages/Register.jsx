import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BadgeIndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.user, data.token)
      toast.success('Account created!')

      // Check for stored invitation token
      const inviteToken = localStorage.getItem('invitation_token')
      if (inviteToken) {
        try {
          await api.post(`/projects/invite/accept/${inviteToken}`, {}, {
            headers: { Authorization: `Bearer ${data.token}` }
          })
          toast.success('Collaboration invitation accepted!')
          localStorage.removeItem('invitation_token')
          navigate('/projects')
          return
        } catch (inviteErr) {
          console.error('Failed to auto-accept invite:', inviteErr.message)
        }
      }

      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred')
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
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>FreelanceOS</span>
        </div>

        <h1 className="mb-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Create Account</h1>
        <p className="mb-8 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
          Start managing your freelance business
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="Priyanshu Bhati"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-shell w-full"
              required
            />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-shell w-full"
              required
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-shell w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full justify-center disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 transition hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </AnimatedPage>
  )
}