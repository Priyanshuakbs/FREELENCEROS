import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      toast.success('Password reset link sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.')
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

        {!submitted ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Forgot Password? 🔒</h1>
              <p className="text-gray-400 text-sm mt-1.5">
                No worries! Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-950 text-white rounded-xl pl-10 pr-4 py-3 border border-gray-800 focus:border-indigo-500 focus:outline-none transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all text-sm font-medium pt-2"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-6 text-center py-4">
            <CheckCircle className="mx-auto text-emerald-500" size={56} />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Check Your Inbox!</h2>
              <p className="text-gray-400 text-sm px-2">
                We have sent a password reset link to <strong className="text-gray-200">{email}</strong>. Please check your inbox and click the link to set your new password.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                to="/login"
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold py-3 rounded-xl transition duration-305 block text-center text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
