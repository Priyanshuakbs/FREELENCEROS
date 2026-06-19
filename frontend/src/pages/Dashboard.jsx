import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FolderOpen, Clock, DollarSign, Wallet, ArrowUpRight, TrendingUp, Edit2, Check, X, Sparkles } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import AnimatedPage from '../components/AnimatedPage'
import useAuthStore from '../store/authStore'
import api from '../lib/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, token, setAuth } = useAuthStore()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    totalHours: 0,
    totalEarned: 0,
    totalExpenses: 0,
    netProfit: 0,
  })
  const [chartData, setChartData] = useState([])
  const [goal, setGoal] = useState(user?.monthlyGoal || 100000)
  const [newGoalInput, setNewGoalInput] = useState(user?.monthlyGoal || 100000)
  const [isEditingGoal, setIsEditingGoal] = useState(false)

  useEffect(() => {
    fetchStats()
    if (user?.monthlyGoal) {
      setGoal(user.monthlyGoal)
      setNewGoalInput(user.monthlyGoal)
    }
  }, [user?.monthlyGoal])

  const fetchStats = async () => {
    try {
      const [clientsRes, projectsRes, invoicesRes, logsRes, expensesRes] = await Promise.all([
        api.get('/clients'),
        api.get('/projects'),
        api.get('/invoices'),
        api.get('/timelogs'),
        api.get('/expenses'),
      ])

      const invoices = invoicesRes.data.invoices
      const logs = logsRes.data.logs
      const expenses = expensesRes.data.expenses

      const totalEarned = invoices
        .filter((i) => i.status === 'paid')
        .reduce((acc, i) => acc + i.total, 0)
        
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
      const netProfit = totalEarned - totalExpenses

      setStats({
        clients: clientsRes.data.clients.length,
        projects: projectsRes.data.projects.length,
        totalHours: (logs.reduce((acc, l) => acc + l.duration, 0) / 60).toFixed(1),
        totalEarned,
        totalExpenses,
        netProfit,
      })

      // Group revenue & expenses for the past 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last6 = Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        const m = d.getMonth()
        const y = d.getFullYear()

        const monthlyRevenue = invoices
          .filter(
            (inv) =>
              inv.status === 'paid' &&
              new Date(inv.createdAt).getMonth() === m &&
              new Date(inv.createdAt).getFullYear() === y
          )
          .reduce((acc, inv) => acc + inv.total, 0)

        const monthlyExpenses = expenses
          .filter(
            (exp) =>
              new Date(exp.date).getMonth() === m &&
              new Date(exp.date).getFullYear() === y
          )
          .reduce((acc, exp) => acc + exp.amount, 0)

        return {
          month: months[m],
          revenue: monthlyRevenue,
          expenses: monthlyExpenses,
        }
      })
      setChartData(last6)
    } catch {}
  }

  const handleSaveGoal = async () => {
    const goalVal = Number(newGoalInput)
    if (!goalVal || goalVal <= 0) {
      toast.error('Please enter a valid monthly target.')
      return
    }

    try {
      const { data } = await api.put('/auth/goal', { monthlyGoal: goalVal })
      setAuth(data.user, token)
      setGoal(data.user.monthlyGoal)
      setIsEditingGoal(false)
      toast.success('Monthly goal updated!')
      if (stats.totalEarned >= goalVal) {
        toast('🎉 Congratulations! You have achieved your monthly target goal!', { icon: '👏' })
      }
    } catch {
      toast.error('Failed to update target')
    }
  }

  const goalProgress = Math.min(100, Math.round((stats.totalEarned / goal) * 100)) || 0

  const cards = [
    { label: 'Total Clients', value: stats.clients, icon: Users, theme: 'indigo', path: '/clients' },
    { label: 'Active Projects', value: stats.projects, icon: FolderOpen, theme: 'emerald', path: '/projects' },
    { label: 'Hours Tracked', value: `${stats.totalHours}h`, icon: Clock, theme: 'amber', path: '/time-tracker' },
    { label: 'Total Revenue', value: `₹${Number(stats.totalEarned).toLocaleString('en-IN')}`, icon: DollarSign, theme: 'sky', path: '/invoices' },
    { label: 'Total Expenses', value: `₹${Number(stats.totalExpenses).toLocaleString('en-IN')}`, icon: Wallet, theme: 'rose', path: '/expenses' },
    { 
      label: 'Net Profit', 
      value: `₹${Number(stats.netProfit).toLocaleString('en-IN')}`, 
      icon: stats.netProfit >= 0 ? TrendingUp : ArrowUpRight, 
      theme: stats.netProfit >= 0 ? 'emerald' : 'rose', 
      path: '/invoices' 
    },
  ]

  const cardThemeMap = {
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500/30 hover:shadow-indigo-500/5',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
    },
    sky: {
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      hoverBorder: 'hover:border-sky-500/30 hover:shadow-sky-500/5',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      hoverBorder: 'hover:border-rose-500/30 hover:shadow-rose-500/5',
    },
  }

  return (
    <AnimatedPage className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative overflow-hidden text-gray-200">
      
      {/* Glow Ambient background details */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Confetti Animation wrapper if goal is reached */}
      {goalProgress >= 100 && (
        <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none flex justify-around select-none z-10">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="text-xl animate-bounce"
              style={{ animationDuration: `${2 + i}s`, animationIterationCount: 'infinite' }}
            >
              🎉
            </span>
          ))}
        </div>
      )}

      {/* Greetings section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400">{user?.name}</span>! 👋
          </h1>
          <p className="text-gray-400 text-xs mt-1.5 font-semibold uppercase tracking-wider">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Goal Target Ring / Progress Banner */}
      <div className="bg-[#111118]/60 border border-white/[0.04] backdrop-blur-md rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {goalProgress >= 100 && (
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="text-emerald-400 animate-pulse" size={24} />
          </div>
        )}
        
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between md:justify-start gap-3">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Monthly Target Tracker</span>
            {isEditingGoal ? (
              <div className="flex items-center gap-1.5 bg-[#0a0a0f] border border-white/10 rounded-xl px-2 py-1">
                <input
                  type="number"
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold w-24 focus:outline-none"
                  autoFocus
                />
                <button onClick={handleSaveGoal} className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"><Check size={12} /></button>
                <button onClick={() => { setIsEditingGoal(false); setNewGoalInput(goal) }} className="p-1 hover:bg-red-500/20 text-red-400 rounded-lg transition"><X size={12} /></button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingGoal(true)}
                className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg border border-indigo-500/10"
                title="Edit Target"
              >
                <Edit2 size={10} /> Edit Goal
              </button>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white tracking-tight">₹{Number(stats.totalEarned).toLocaleString('en-IN')}</p>
            <span className="text-xs text-gray-500 font-medium">earned of ₹{Number(goal).toLocaleString('en-IN')} goal</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/[0.02] rounded-full h-2.5 border border-white/[0.04] overflow-hidden p-[2px]">
            <div
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r relative ${goalProgress >= 100 ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-purple-500'}`}
              style={{ width: `${goalProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-white/[0.06] pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
          <p className="text-3xl font-black text-white">{goalProgress}%</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Completion</p>
        </div>
      </div>

      {/* Grid boxes */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {cards.map(({ label, value, icon: Icon, theme, path }) => (
          <motion.div
            key={label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => navigate(path)}
            className={`bg-[#111118]/60 backdrop-blur-md rounded-2xl p-6 border border-white/[0.04] cursor-pointer shadow-lg transition-all duration-300 ${cardThemeMap[theme]?.hoverBorder || cardThemeMap['indigo'].hoverBorder}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{label}</span>
              <div className={`p-2.5 rounded-xl border ${cardThemeMap[theme]?.iconBg || cardThemeMap['indigo'].iconBg}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts container */}
      <div className="bg-[#111118]/60 backdrop-blur-md rounded-2xl p-6 border border-white/[0.04] shadow-2xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white">Cashflow Analysis</h3>
            <p className="text-xs text-gray-500 mt-0.5">Calculated based on paid invoice revenue vs. expenses for the past 6 months</p>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Revenue
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-pink-500" /> Expenses
            </div>
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="month" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                formatter={(value, name) => [
                  `₹${Number(value).toLocaleString('en-IN')}`, 
                  name === 'revenue' ? 'Revenue' : 'Expenses'
                ]}
              />
              <Bar dataKey="revenue" fill="url(#chartGradient)" stroke="#6366F1" strokeWidth={1} name="revenue" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Line type="monotone" dataKey="expenses" name="expenses" stroke="#EC4899" strokeWidth={2} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AnimatedPage>
  )
}