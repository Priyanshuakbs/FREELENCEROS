import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
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
    <AnimatedPage className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-center mb-6">
          <span className="text-3xl">💼</span>
          <span className="ml-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            FreelanceOS
          </span>
        </div>

        {!success ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Reset Password 🔒</h1>
              <p className="text-gray-400 text-sm mt-1.5">
                Set a secure password that is at least 6 characters long.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-950 text-white rounded-xl pl-10 pr-4 py-3 border border-gray-800 focus:border-indigo-500 focus:outline-none transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-950 text-white rounded-xl pl-10 pr-4 py-3 border border-gray-800 focus:border-indigo-500 focus:outline-none transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 text-center py-4">
            <CheckCircle className="mx-auto text-emerald-500" size={56} />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Password Updated!</h2>
              <p className="text-gray-400 text-sm">
                Your password has been reset successfully. You can now log in to your account with your new password.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                to="/login"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-300 block text-center text-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
