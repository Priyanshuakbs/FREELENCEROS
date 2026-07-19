import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BadgeIndianRupee,
  CheckSquare,
  ChevronLeft,
  Clock3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  PhoneCall,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const adminSections = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, description: 'Business overview' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Leads', path: '/leads', icon: PhoneCall, description: 'CRM & pipeline' },
      { name: 'Clients', path: '/clients', icon: Users, description: 'Client relationships' },
      { name: 'Projects', path: '/projects', icon: FolderKanban, description: 'Project delivery' },
      { name: 'Kanban', path: '/kanban', icon: CheckSquare, description: 'Task board' },
      { name: 'Time Tracker', path: '/time-tracker', icon: Clock3, description: 'Billable hours' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Invoices', path: '/invoices', icon: FileText, description: 'Billing & collections' },
      { name: 'Analytics', path: '/expenses', icon: Wallet, description: 'Revenue & spend' },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Settings', path: '/profile', icon: User, description: 'Profile & preferences' },
    ],
  },
]

const userSections = [
  {
    label: 'Workspace',
    items: [
      { name: 'Projects', path: '/projects', icon: FolderKanban, description: 'Active work' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Kanban', path: '/kanban', icon: CheckSquare, description: 'Task board' },
      { name: 'Time Tracker', path: '/time-tracker', icon: Clock3, description: 'Billable hours' },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Settings', path: '/profile', icon: User, description: 'Profile & preferences' },
    ],
  },
]

export default function Sidebar({
  mobile = false,
  collapsed: controlledCollapsed,
  setCollapsed: controlledSetCollapsed,
  closeSidebar,
}) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isCollapsed = mobile ? false : controlledCollapsed
  const sections = user?.role === 'admin' ? adminSections : userSections

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside
      className={`relative h-screen ${mobile ? 'w-[88vw] max-w-[320px] p-4' : 'p-4 pl-4 pr-0'}`}
    >
      <div
        className={`sidebar-shell flex h-full flex-col overflow-hidden transition-[width] duration-300 ${
          mobile ? 'w-full' : isCollapsed ? 'w-[88px]' : 'w-[276px]'
        }`}
      >
        {/* ── Logo / Brand ── */}
        <div className="border-b border-white/5 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_16px_32px_-20px_rgba(99,102,241,0.7)]">
                <BadgeIndianRupee size={20} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-wide text-slate-50">FreelanceOS</p>
                  <p className="truncate text-xs text-slate-400">Premium freelancer workspace</p>
                </div>
              )}
            </div>

            {mobile ? (
              <button onClick={closeSidebar} className="btn-secondary px-3 py-2">
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                onClick={() => controlledSetCollapsed?.(!isCollapsed)}
                className="btn-secondary hidden px-3 py-2 lg:inline-flex"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* ── User Profile Card ── */}
        <div className="px-3 py-4">
          <div
            className={`rounded-[22px] border border-white/5 bg-white/[0.03] p-3 ${
              isCollapsed ? 'flex justify-center' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/5">
                <span className="text-sm font-semibold text-slate-200">
                  {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{user?.name || 'Workspace'}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email || 'Account connected'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Nav Sections ── */}
        <div className="sidebar-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.label}>
                {!isCollapsed && (
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {section.label}
                  </p>
                )}
                <nav className="space-y-1.5">
                  {section.items.map(({ name, path, icon: Icon, description }) => (
                    <NavLink key={path} to={path} onClick={() => mobile && closeSidebar?.()}>
                      {({ isActive }) => (
                        <motion.div
                          whileHover={{ x: mobile ? 0 : 3 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className={`group relative flex items-center gap-3 rounded-[20px] px-3 py-3 transition duration-200 ${
                            isActive
                              ? 'bg-indigo-500/10 text-slate-50'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-400 to-cyan-400" />
                          )}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] transition ${
                              isActive
                                ? 'bg-indigo-500/14 text-indigo-100'
                                : 'bg-white/[0.03] text-slate-400 group-hover:bg-white/[0.05] group-hover:text-slate-200'
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          {!isCollapsed && (
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{name}</p>
                              <p className="truncate text-xs text-slate-500">{description}</p>
                            </div>
                          )}

                          {/* Tooltip when collapsed */}
                          {isCollapsed && (
                            <div className="pointer-events-none absolute left-[72px] z-50 whitespace-nowrap rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                              {name}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* ── Logout ── */}
        <div className="border-t border-white/5 p-3">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-[22px] bg-rose-500/10 px-3 py-3 text-rose-200 transition hover:bg-rose-500/15"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-rose-500/15 transition group-hover:bg-rose-500/25">
              <LogOut size={18} />
            </div>
            {!isCollapsed && (
              <div className="text-left">
                <p className="text-sm font-medium">Log out</p>
                <p className="text-xs text-rose-200/70">End current session</p>
              </div>
            )}

            {/* Tooltip when collapsed */}
            {isCollapsed && (
              <div className="pointer-events-none absolute left-[72px] z-50 whitespace-nowrap rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                Log out
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}