import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2, KeyRound, RefreshCw, LogOut } from 'lucide-react'
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
    <AnimatedPage className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
        <div className="flex items-center justify-center mb-6">
          <span className="text-3xl">💼</span>
          <span className="ml-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            FreelanceOS
          </span>
        </div>

        {status === 'pending' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Verify Your Email 📧</h1>
              <p className="text-gray-400 text-sm mt-2">
                We sent a 6-digit verification code to
              </p>
              <p className="text-indigo-400 font-semibold text-sm mt-0.5">
                {user?.email || 'your registered email'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block text-left">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <KeyRound size={16} />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-950 text-white rounded-xl pl-10 pr-4 py-3 border border-gray-800 focus:border-indigo-500 focus:outline-none transition-all text-center text-lg tracking-[0.5em] font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            <div className="flex flex-col gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-gray-400 hover:text-white transition-all text-xs font-medium flex items-center justify-center gap-1.5 py-1 disabled:opacity-50"
              >
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                Didn't get the code? Resend OTP
              </button>

              <button
                onClick={handleLogout}
                className="text-rose-400 hover:text-rose-300 transition-all text-xs font-medium flex items-center justify-center gap-1.5 py-1"
              >
                <LogOut size={14} />
                Sign Out / Use Another Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <CheckCircle className="mx-auto text-emerald-500" size={56} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">All Verified!</h2>
              <p className="text-gray-400 text-sm">
                Your email address has been successfully verified. You now have full access to FreelanceOS.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition duration-300 block text-center"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
