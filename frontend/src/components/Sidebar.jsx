import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, Users, FolderOpen, CheckSquare,
  Clock, FileText, LogOut, ChevronRight, Wallet, Percent
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: TrendingUp },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'Projects', path: '/projects', icon: FolderOpen },
  { name: 'Kanban', path: '/kanban', icon: CheckSquare },
  { name: 'Time Tracker', path: '/time-tracker', icon: Clock },
  { name: 'Invoices', path: '/invoices', icon: FileText },
  { name: 'Expenses', path: '/expenses', icon: Wallet },
  { name: 'Contracts', path: '/contracts', icon: FileText },
  { name: 'Tax Estimator', path: '/tax-estimator', icon: Percent },
]

export default function Sidebar({ mobile, collapsed: controlledCollapsed, setCollapsed: controlledSetCollapsed, closeSidebar }) {
  const [localCollapsed, setLocalCollapsed] = useState(true)
  const isCollapsed = mobile ? false : (controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed)
  const setIsCollapsed = controlledSetCollapsed || setLocalCollapsed
  
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out!')
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div
      onMouseEnter={() => !mobile && setIsCollapsed(false)}
      onMouseLeave={() => !mobile && setIsCollapsed(true)}
      className={`h-screen bg-[#07070a]/95 backdrop-blur-xl border-r border-white/[0.04] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 z-40 relative ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      {/* Top Section */}
      <div>
        {/* Brand/Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.04]">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-lg shrink-0 shadow-lg shadow-indigo-500/20 relative group-hover:scale-105 transition-transform duration-200">
              <span className="text-white text-base">💼</span>
              <div className="absolute inset-0 rounded-xl bg-indigo-400/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className={`ml-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-36 opacity-100'}`}>
              <p className="font-bold text-sm text-white tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200">
                FreelanceOS
              </p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider capitalize whitespace-nowrap">{user?.plan || 'Free'} plan</p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          {mobile && (
            <button 
              onClick={closeSidebar}
              className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems
            .filter(({ name }) => user?.role === 'admin' || ['Projects', 'Kanban', 'Time Tracker'].includes(name))
            .map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => mobile && closeSidebar && closeSidebar()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative border border-transparent ${
                  isActive
                    ? 'text-white font-medium bg-gradient-to-r from-indigo-600/10 to-purple-600/5 border-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.02]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    size={18} 
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'
                    }`} 
                  />
                  <span className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-32 opacity-100'}`}>
                    {name}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeNavBackground"
                      className="absolute left-0 top-1/4 w-[3px] h-1/2 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-14 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all origin-left bg-[#0c0c12] text-gray-200 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-white/[0.06] shadow-2xl z-50 pointer-events-none whitespace-nowrap">
                      {name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Info + Logout */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-white/[0.01] border border-white/[0.02] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md">
            {getInitials(user?.name)}
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-36 opacity-100'}`}>
            <p className="text-xs font-semibold text-gray-200 truncate whitespace-nowrap">{user?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider whitespace-nowrap">{user?.role || 'user'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-350 hover:bg-red-500/[0.06] border border-transparent hover:border-red-500/10 transition-all group relative"
        >
          <LogOut size={16} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-32 opacity-100'}`}>
            Logout
          </span>
          {isCollapsed && (
            <div className="absolute left-14 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all origin-left bg-[#0c0c12] text-red-400 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-500/10 shadow-2xl z-50 pointer-events-none whitespace-nowrap">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  )
}