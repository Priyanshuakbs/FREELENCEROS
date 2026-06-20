import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2, KeyRound, RefreshCw, LogOut, BadgeIndianRupee } from 'lucide-react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import AnimatedPage from '../components/AnimatedPage'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { user, verifyUser, logout } = useAuthStore()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [status, setStatus] = useState('pending') // 'pending' | 'success'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { otp })
      verifyUser()
      setStatus('success')
      toast.success('Email verified successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const { data } = await api.post('/auth/resend-verify')
      toast.success(data.message || 'New verification OTP sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AnimatedPage className="auth-page">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="auth-card relative z-10 text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
            FreelanceOS
          </span>
        </div>

        {status === 'pending' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Verify Your Email 📧</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-subtle)' }}>
                We sent a 6-digit verification code to
              </p>
              <p className="mt-0.5 text-sm font-semibold text-indigo-400">
                {user?.email || 'your registered email'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="form-label text-left">Verification Code (OTP)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--text-faint)' }}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-shell w-full pl-10 text-center font-mono text-lg font-bold tracking-[0.5em]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying Code...</>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            <div className="flex flex-col gap-3 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center justify-center gap-1.5 py-1 text-xs font-medium transition disabled:opacity-50"
                style={{ color: 'var(--text-subtle)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-subtle)' }}
              >
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                Didn't get the code? Resend OTP
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-rose-400 transition hover:text-rose-300"
              >
                <LogOut size={14} />
                Sign Out / Use Another Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <CheckCircle className="mx-auto text-emerald-400" size={56} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>All Verified!</h2>
              <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                Your email address has been successfully verified. You now have full access to FreelanceOS.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full justify-center"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
