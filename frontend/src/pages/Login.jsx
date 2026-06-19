import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      setAuth(data.user, data.token)
      toast.success('Welcome back!')

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
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#07070a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <div className="bg-[#111118]/60 border border-white/[0.05] backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            💼
          </div>
          <span className="text-sm font-bold text-white tracking-tight">FreelanceOS</span>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-1">Welcome Back</h1>
        <p className="text-xs text-gray-500 font-semibold mb-8 uppercase tracking-wider">Sign in to manage your freelance operations</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Forgot?</Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-bold py-3.5 rounded-xl transition duration-205 shadow-lg shadow-indigo-500/10 active:scale-95 disabled:opacity-50 text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-450 text-center text-sm mt-8 font-medium">
          New here?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Create account</Link>
        </p>
      </div>
    </AnimatedPage>
  )
}