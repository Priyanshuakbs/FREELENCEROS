import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  FolderKanban,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import Sidebar from './Sidebar'
import ChatbotWidget from './ChatbotWidget'
import AnimatedPage from './AnimatedPage'
import GlobalSearch from './GlobalSearch'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'

const breadcrumbMap = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projects',
  '/kanban': 'Kanban',
  '/time-tracker': 'Time Tracker',
  '/invoices': 'Invoices',
  '/expenses': 'Analytics',
  '/profile': 'Settings',
  '/contracts': 'Contracts',
  '/tax-estimator': 'Tax Estimator',
  '/proposals': 'Proposals',
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [resending, setResending] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)

  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, applyTheme } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const lastScrollY = useRef(0)

  useEffect(() => {
    applyTheme()
  }, [theme, applyTheme])

  useEffect(() => {
    setNotificationsOpen(false)
    setProfileOpen(false)
    setQuickActionsOpen(false)
    setSidebarOpen(false)
  }, [location.pathname])

  const currentPage = useMemo(() => breadcrumbMap[location.pathname] || 'Workspace', [location.pathname])

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/projects/invitations/pending')
      setNotifications(data.invitations || [])
    } catch (err) {
      if (err.response) {
        console.error('Failed to load notifications:', err.message)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined

    const refreshTimer = window.setTimeout(() => {
      void fetchNotifications()
    }, 0)
    const interval = setInterval(fetchNotifications, 12000)
    return () => {
      clearTimeout(refreshTimer)
      clearInterval(interval)
    }
  }, [user, fetchNotifications])

  const handleKeyDown = useCallback((event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      setSearchOpen((prev) => !prev)
    }
    if (event.key === 'Escape') {
      setSearchOpen(false)
      setNotificationsOpen(false)
      setProfileOpen(false)
      setQuickActionsOpen(false)
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY <= 24) {
        setHeaderVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      const scrollingDown = currentScrollY > lastScrollY.current
      const significantMove = Math.abs(currentScrollY - lastScrollY.current) > 10

      if (significantMove) {
        setHeaderVisible(!scrollingDown)
        lastScrollY.current = currentScrollY
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAccept = async (token) => {
    try {
      toast.loading('Accepting invitation...', { id: 'accept-invite' })
      const { data } = await api.post(`/projects/invite/accept/${token}`)
      toast.success(data.message || 'Joined project successfully!', { id: 'accept-invite' })
      setNotificationsOpen(false)
      fetchNotifications()
      setTimeout(() => window.location.reload(), 1000)
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

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="relative flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
        )}

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -28, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 26 }}
              className="fixed inset-y-0 left-0 z-40"
            >
              <Sidebar mobile collapsed={false} setCollapsed={() => {}} closeSidebar={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-20 px-4 pt-4 transition-transform duration-300 sm:px-6 lg:px-6 ${
              headerVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)]'
            }`}
          >
            <div className="header-bar">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="btn-secondary px-3 py-2"
                  aria-label="Open navigation"
                  title="Open navigation"
                >
                  <Menu size={18} />
                </button>

                <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-400 md:flex">
                  <span className="text-slate-500">Workspace</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-100">{currentPage}</span>
                </div>
              </div>

              <button
                onClick={() => setSearchOpen(true)}
                className="header-search"
              >
                <Search size={16} style={{ color: 'var(--text-faint)' }} />
                <span className="truncate" style={{ color: 'var(--text-faint)' }}>Search clients, projects, invoices, or tasks</span>
                <span className="ml-auto rounded-lg px-2 py-1 text-[11px]" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-soft)', color: 'var(--text-faint)' }}>
                  Ctrl K
                </span>
              </button>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <button onClick={toggleTheme} className="btn-secondary px-3 py-2" title="Toggle theme">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => {
                      setQuickActionsOpen((prev) => !prev)
                      setNotificationsOpen(false)
                      setProfileOpen(false)
                    }}
                    className="btn-secondary hidden px-3 py-2 sm:inline-flex"
                    title="Quick actions"
                  >
                    <Plus size={16} />
                    <span className="hidden md:inline">Quick actions</span>
                  </button>

                  <AnimatePresence>
                    {quickActionsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-3 w-[260px] overflow-hidden dropdown-panel shadow-2xl"
                      >
                        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Quick actions</p>
                          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Jump to common freelancer flows</p>
                        </div>
                        <div className="p-2">
                          <QuickActionItem icon={Users} label="Add client" onClick={() => navigate('/clients')} />
                          <QuickActionItem icon={FolderKanban} label="New project" onClick={() => navigate('/projects')} />
                          <QuickActionItem icon={FileText} label="New invoice" onClick={() => navigate('/invoices')} />
                          <QuickActionItem icon={Clock3} label="Open timer" onClick={() => navigate('/time-tracker')} />
                          <QuickActionItem icon={Wallet} label="View analytics" onClick={() => navigate('/expenses')} />
                          <QuickActionItem icon={User} label="Settings" onClick={() => navigate('/profile')} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev)
                      setProfileOpen(false)
                      setQuickActionsOpen(false)
                    }}
                    className="btn-secondary relative px-3 py-2"
                    title="Notifications"
                  >
                    <Bell size={16} />
                    {notifications.length > 0 && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden dropdown-panel shadow-2xl"
                      >
                        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
                            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Project invites and updates</p>
                          </div>
                          {notifications.length > 0 ? (
                            <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-200">
                              {notifications.length} pending
                            </span>
                          ) : null}
                        </div>

                        <div className="max-h-80 space-y-2 overflow-y-auto p-3">
                          {notifications.length === 0 ? (
                            <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ border: '1px dashed var(--border)', color: 'var(--text-subtle)' }}>
                              No pending notifications
                            </div>
                          ) : (
                            notifications.map((item) => (
                              <div key={item._id} className="rounded-2xl p-4" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-soft)' }}>
                                <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{item.inviter?.name}</span>{' '}
                                  invited you to join{' '}
                                  <span className="font-semibold text-indigo-400">{item.project?.title}</span>.
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                  <button onClick={() => handleDecline(item.token)} className="btn-secondary px-3 py-2 text-xs">
                                    <X size={14} /> Decline
                                  </button>
                                  <button onClick={() => handleAccept(item.token)} className="btn-primary px-3 py-2 text-xs">
                                    <Check size={14} /> Accept
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {user && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setProfileOpen((prev) => !prev)
                        setNotificationsOpen(false)
                        setQuickActionsOpen(false)
                      }}
                      className="flex items-center gap-3 rounded-[20px] px-3 py-2 transition" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-soft)' }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                        {user.name?.slice(0, 1)?.toUpperCase() || 'U'}
                      </div>
                      <div className="hidden text-left sm:block">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-subtle)' }}>{user.role}</p>
                      </div>
                      <ChevronDown size={16} className="hidden text-slate-500 sm:block" />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute right-0 mt-3 w-64 overflow-hidden dropdown-panel shadow-2xl"
                        >
                          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{user.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{user.email}</p>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setProfileOpen(false)
                                navigate('/profile')
                              }}
                              className="dropdown-item"
                            >
                              <User size={16} /> Profile
                            </button>
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-rose-400 transition hover:bg-rose-500/10"
                            >
                              <LogOut size={16} /> Log out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 pb-8">
            {user && !user.isVerified && (
              <div className="px-4 pt-4 sm:px-6 lg:px-8">
                <div className="rounded-[24px] border border-amber-400/15 bg-amber-500/10 px-5 py-4 shadow-[0_18px_40px_-30px_rgba(245,158,11,0.7)] sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Your email is not verified yet.</p>
                    <p className="text-sm text-amber-200/80">Verify your email to unlock full collaboration and invite flows.</p>
                  </div>
                  <button onClick={handleResendVerification} disabled={resending} className="btn-secondary mt-3 text-amber-100 sm:mt-0">
                    {resending ? 'Sending...' : 'Resend verification'}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <AnimatedPage key={location.pathname}>
                {children}
              </AnimatedPage>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {user?.role === 'admin' ? <ChatbotWidget /> : null}
    </div>
  )
}

function QuickActionItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="dropdown-item"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-soft)' }}>
        <Icon size={16} />
      </span>
      <span>{label}</span>
    </button>
  )
}
