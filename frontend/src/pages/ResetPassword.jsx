import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Loader2, CheckCircle, BadgeIndianRupee } from 'lucide-react'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      setSuccess(true)
      toast.success('Password reset successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token is invalid or has expired.')
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

        {!success ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Reset Password 🔒</h1>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-subtle)' }}>
                Set a secure password that is at least 6 characters long.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-shell w-full pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-shell w-full pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Resetting...</>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center">
            <CheckCircle className="mx-auto text-emerald-400" size={56} />
            <div className="space-y-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Password Updated!</h2>
              <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
            <Link to="/login" className="btn-primary block w-full justify-center text-center">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
