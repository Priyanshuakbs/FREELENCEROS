import { useState, useEffect } from 'react'
import { Menu, User, Bell, Check, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import Sidebar from './Sidebar'
import ChatbotWidget from './ChatbotWidget'
import AnimatedPage from './AnimatedPage'
import useAuthStore from '../store/authStore'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuthStore()
  const location = useLocation()
  const [resending, setResending] = useState(false)

  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/projects/invitations/pending')
      setNotifications(data.invitations || [])
    } catch (err) {
      console.error('Failed to load notifications:', err.message)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const handleAccept = async (token) => {
    try {
      toast.loading('Accepting invitation...', { id: 'accept-invite' })
      const { data } = await api.post(`/projects/invite/accept/${token}`)
      toast.success(data.message || 'Joined project successfully!', { id: 'accept-invite' })
      setNotificationsOpen(false)
      fetchNotifications()
      // Refresh window to display newly joined projects
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join project.', { id: 'accept-invite' })
    }
  }

  const handleDecline = async (token) => {
    try {
      toast.loading('Declining invitation...', { id: 'decline-invite' })
      const { data } = await api.post(`/projects/invite/reject/${token}`)
      toast.success(data.message || 'Invitation declined.', { id: 'decline-invite' })
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline invite.', { id: 'decline-invite' })
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      toast.loading('Sending verification email...', { id: 'resend-verify' })
      const { data } = await api.post('/auth/resend-verify')
      toast.success(data.message || 'Verification link sent!', { id: 'resend-verify' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification.', { id: 'resend-verify' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          mobile
          collapsed={false}
          setCollapsed={() => {}}
          closeSidebar={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Top Navbar */}
       <header className="h-16 shrink-0 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl transition"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {!sidebarOpen && (
              <h2 className="font-bold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 lg:hidden">
                FreelanceOS
              </h2>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl transition relative"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-900 animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-850 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 pb-2 border-b border-gray-800 flex justify-between items-center">
                      <span className="font-bold text-sm text-white">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] bg-indigo-600/30 text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                          {notifications.length} pending
                        </span>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto mt-2 px-2 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-xs italic">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n._id} className="p-3 hover:bg-gray-800/40 rounded-xl border border-transparent hover:border-gray-800/40 transition duration-150 flex flex-col gap-2">
                            <p className="text-xs text-gray-300 leading-normal text-left">
                              <strong className="text-white">{n.inviter?.name}</strong> invited you to collaborate on project <strong className="text-indigo-400">"{n.project?.title}"</strong>.
                            </p>
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                onClick={() => handleDecline(n.token)}
                                className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                              >
                                <X size={10} /> Decline
                              </button>
                              <button
                                onClick={() => handleAccept(n.token)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition flex items-center gap-1 shadow-sm"
                              >
                                <Check size={10} /> Accept
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-850/40 rounded-xl border border-gray-800 select-none">
                <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <User size={12} />
                </div>
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  Logged in: <span className="text-white">{user.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
                    {user.role}
                  </span>
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable container for dashboard contents */}
        <main className="flex-1 overflow-y-auto">
          {user && !user.isVerified && (
            <div className="bg-amber-600/10 border-b border-amber-500/20 px-8 py-3 flex items-center justify-between gap-4 text-amber-200 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span>Your email address is unverified. Please check your inbox for the verification link.</span>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 active:scale-95 text-amber-300 font-bold shrink-0"
              >
                {resending ? 'Sending...' : 'Resend Verification Link'}
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              {children}
            </AnimatedPage>
          </AnimatePresence>
        </main>
      </div>

      {/* Chatbot Helper Widget */}
      {user?.role === 'admin' && <ChatbotWidget />}
    </div>
  )
}