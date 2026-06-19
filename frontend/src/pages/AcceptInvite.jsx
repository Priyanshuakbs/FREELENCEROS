import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Users, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import AnimatedPage from '../components/AnimatedPage'
import toast from 'react-hot-toast'

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { token: userToken } = useAuthStore()

  const [status, setStatus] = useState('pending') // 'pending' | 'success' | 'error' | 'unauthenticated'
  const [errorMsg, setErrorMsg] = useState('')

  const handleAccept = async () => {
    try {
      const { data } = await api.post(`/projects/invite/accept/${token}`)
      setStatus('success')
      toast.success(data.message || 'Joined project successfully!')
      setTimeout(() => {
        navigate('/projects')
      }, 2000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.response?.data?.message || 'Failed to accept invitation.')
      toast.error('Could not join project.')
    }
  };

  useEffect(() => {
    if (userToken) {
      handleAccept()
    } else {
      localStorage.setItem('invitation_token', token)
      setStatus('unauthenticated')
    }
  }, [token, userToken])

  return (
    <AnimatedPage className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center shadow-xl">
        <div className="h-16 flex items-center justify-center mb-6">
          <span className="text-3xl">🤝</span>
          <span className="ml-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            FreelanceOS Invite
          </span>
        </div>

        {status === 'pending' && (
          <div className="space-y-4 py-8">
            <Loader2 className="mx-auto text-indigo-500 animate-spin" size={48} />
            <h2 className="text-xl font-bold text-white">Accepting invitation...</h2>
            <p className="text-gray-400 text-sm">Validating invite parameters and adding you to the team.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <CheckCircle className="mx-auto text-emerald-500" size={56} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Invite Accepted!</h2>
              <p className="text-gray-400 text-sm">
                You are now a collaborator on the project. Redirecting you to your projects dashboard...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4">
            <AlertTriangle className="mx-auto text-rose-500" size={56} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Invalid Invitation</h2>
              <p className="text-rose-400/80 text-sm">{errorMsg}</p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                to="/login"
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold py-3 rounded-xl transition duration-300 block text-center text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'unauthenticated' && (
          <div className="space-y-6 py-2">
            <Users className="mx-auto text-indigo-400" size={56} />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Collaboration Invite 🤝</h2>
              <p className="text-gray-400 text-sm">
                You have been invited to collaborate on a freelance project. To accept and view the details, please sign in or register a new account.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition duration-300 block text-center text-sm"
              >
                Log In to Accept
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-750 text-gray-300 font-semibold py-3 rounded-xl transition duration-300 block text-center text-sm"
              >
                Sign Up & Register
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
