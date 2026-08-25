import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { BadgeIndianRupee, KeyRound, Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import useClientAuthStore from '../store/clientAuthStore'

export default function ClientVerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useClientAuthStore()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [status, setStatus] = useState('pending') // 'pending' | 'success'

  useEffect(() => {
    // Check if email was passed in state or query param
    const searchParams = new URLSearchParams(location.search)
    const passedEmail = location.state?.email || searchParams.get('email') || ''
    if (passedEmail) {
      setEmail(passedEmail)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/client/verify-otp', { email: email.toLowerCase().trim(), otp })
      setStatus('success')
      toast.success('Email verified successfully!')

      if (res.data?.token && res.data?.client) {
        setAuth(res.data.client, res.data.token)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address first.')
      return
    }

    setResending(true)
    try {
      await api.post('/auth/client/resend-verify', { email: email.toLowerCase().trim() })
      toast.success('New OTP sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  const handleProceed = () => {
    const portfolioRedirect = sessionStorage.getItem('portfolio_redirect')
    if (portfolioRedirect) {
      sessionStorage.removeItem('portfolio_redirect')
      navigate(portfolioRedirect)
      return
    }
    navigate('/client-dashboard')
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
                Enter the OTP sent to your registered client email address
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
                <div className="mb-1 flex items-center justify-between">
                  <label className="form-label mb-0">Verification Code (6-digit OTP)</label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || !email}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={resending ? 'animate-spin' : ''} />
                    <span>{resending ? 'Sending...' : 'Resend OTP'}</span>
                  </button>
                </div>
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
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
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
                Your client email address has been successfully verified. You can now access your dashboard and collaborate with freelancers.
              </p>
            </div>
            <button
              onClick={handleProceed}
              className="btn-primary w-full justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              Continue to Dashboard
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

