import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BadgeIndianRupee, KeyRound, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'

export default function ClientVerifyEmail() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending') // 'pending' | 'success'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/client/verify-otp', { email: email.toLowerCase(), otp })
      setStatus('success')
      toast.success('Email verified successfully! Freelancer can now enable your login.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="auth-page">
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="auth-card relative z-10 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-lg">
            <BadgeIndianRupee size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>FreelanceOS</span>
        </div>

        {status === 'pending' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Verify Email Address</h1>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                Enter the OTP sent to your registered email address
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
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

              <div>
                <label className="form-label">Verification Code (6-digit OTP)</label>
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
                disabled={loading || otp.length !== 6 || !email}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? 'Verifying Code...' : 'Verify Email'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <CheckCircle className="mx-auto text-emerald-400" size={56} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Verified!</h2>
              <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                Your email address has been successfully verified. Please contact the administrator to enable login and set up your password.
              </p>
            </div>
            <button
              onClick={() => navigate('/client-login')}
              className="btn-primary w-full justify-center"
            >
              Go to Login
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
