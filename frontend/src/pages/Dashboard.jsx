import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  DollarSign,
  FolderKanban,
  Receipt,
  Wallet,
  TrendingUp,
  Users,
  MessageSquare,
  CheckSquare,
  Copy,
  ExternalLink,
  Sparkles,
  PhoneCall,
  Scale,
  Calculator,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import SurfaceCard from '../components/ui/SurfaceCard'
import StatusBadge from '../components/ui/StatusBadge'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [overview, setOverview] = useState({
    clients: 0,
    projects: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    totalHours: 0,
    totalEarned: 0,
    totalExpenses: 0,
    netProfit: 0,
  })
  const [cashflowData, setCashflowData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [topClients, setTopClients] = useState([])
  const [paymentSummary, setPaymentSummary] = useState({
    totalReceived: 0,
    totalOutstanding: 0,
    paidClients: 0,
    recentPayments: [],
  })
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/admin/summary')

      setOverview({
        clients: data.overview.clientsCount,
        projects: data.overview.projectsCount,
        paidInvoices: data.overview.paidInvoicesCount,
        pendingInvoices: data.overview.pendingInvoicesCount,
        totalHours: data.overview.totalHours,
        totalEarned: data.overview.totalEarned,
        totalExpenses: data.overview.totalExpenses,
        netProfit: data.overview.netProfit,
      })

      setOverdueCount(data.overview.overdueCount)
      setCashflowData(data.cashflowData || [])
      setRecentActivity(data.recentActivity || [])
      setUpcomingDeadlines(data.upcomingDeadlines || [])
      setTopClients(data.topClients || [])

      setPaymentSummary({
        totalReceived: data.overview.totalEarned,
        totalOutstanding: data.overview.outstandingRevenue,
        paidClients: data.overview.paidInvoicesCount,
        recentPayments: data.recentPayments || [],
      })
    } catch {
      toast.error('Failed to load dashboard data')
    }
  }

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const portfolioUrl = `${window.location.origin}/portfolio/${user?.username || user?._id || user?.id || ''}`

  const copyPortfolioLink = () => {
    navigator.clipboard.writeText(portfolioUrl)
    toast.success('Public portfolio link copied to clipboard!')
  }

  const workspaceModules = [
    {
      title: 'CRM & Leads Pipeline',
      description: 'Capture inbound leads, send formal proposals, and track client inquiries.',
      icon: PhoneCall,
      path: '/leads',
      badge: 'Client Acquisition',
      accent: 'from-blue-500/20 to-indigo-500/20 text-blue-500',
    },
    {
      title: 'Projects & Workspaces',
      description: 'Track active deliverables, milestones, upload code/design assets, and collaborate.',
      icon: FolderKanban,
      path: '/projects',
      badge: `${overview.projects} Active`,
      accent: 'from-indigo-500/20 to-purple-500/20 text-indigo-500',
    },
    {
      title: 'Direct Client Chat',
      description: 'One-on-one real-time chat with clients, proposal negotiations & questions.',
      icon: MessageSquare,
      path: '/messages',
      badge: 'Real-time',
      accent: 'from-violet-500/20 to-pink-500/20 text-violet-500',
    },
    {
      title: 'Kanban Task Board',
      description: 'Drag & drop tasks across Todo, In Progress, Review, and Done stages.',
      icon: CheckSquare,
      path: '/kanban',
      badge: 'Workflow',
      accent: 'from-amber-500/20 to-orange-500/20 text-amber-500',
    },
    {
      title: 'Invoices & Online Billing',
      description: 'Generate professional GST invoices, track payment status & Razorpay collections.',
      icon: Receipt,
      path: '/invoices',
      badge: `${overview.pendingInvoices} Pending`,
      accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
    },
    {
      title: 'Billable Time Tracker',
      description: 'Live stopwatch & timesheet logs to bill clients accurately for every hour.',
      icon: Clock3,
      path: '/time-tracker',
      badge: `${overview.totalHours.toFixed(1)}h Total`,
      accent: 'from-cyan-500/20 to-blue-500/20 text-cyan-500',
    },
    {
      title: 'Expenses & Net Profit',
      description: 'Track operational costs, software subscriptions, tax write-offs & net margin.',
      icon: Wallet,
      path: '/expenses',
      badge: formatCurrency(overview.totalExpenses),
      accent: 'from-rose-500/20 to-red-500/20 text-rose-500',
    },
    {
      title: 'Explore Freelancers Directory',
      description: 'Discover verified talent, browse skills, explore portfolios, or get hired.',
      icon: Globe,
      path: '/freelancers',
      badge: 'Marketplace',
      accent: 'from-purple-500/20 to-indigo-500/20 text-purple-500',
    },
    {
      title: 'Legal Milestone Contracts',
      description: 'Draft binding freelance agreements, protect intellectual property & sign terms.',
      icon: Scale,
      path: '/contracts',
      badge: 'Legal Shield',
      accent: 'from-slate-500/20 to-zinc-500/20 text-slate-400',
    },
    {
      title: 'Advance Tax Estimator',
      description: 'Estimate income tax liabilities, presumptive tax (44ADA), and tax dates.',
      icon: Calculator,
      path: '/tax-estimator',
      badge: 'Finances',
      accent: 'from-yellow-500/20 to-amber-500/20 text-amber-500',
    },
    {
      title: 'Profile & Public Showcase',
      description: 'Manage username handle, skills, services, billing bank accounts, and portfolio.',
      icon: User,
      path: '/profile',
      badge: 'Settings',
      accent: 'from-indigo-500/20 to-sky-500/20 text-indigo-500',
    },
  ]

  return (
    <div className="page-container space-y-8 pb-12">
      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="FreelanceOS Workspace Central"
        title={`Welcome back, ${user?.name || 'Freelancer'}! 👋`}
        description="Your unified hub to manage clients, track active deliverables, chat in real-time, and get paid."
        actions={(
          <>
            <button onClick={() => navigate('/leads')} className="btn-secondary">
              <PhoneCall size={15} /> Leads CRM
            </button>
            <button onClick={() => navigate('/projects')} className="btn-secondary">
              <FolderKanban size={15} /> Projects
            </button>
            <button onClick={() => navigate('/messages')} className="btn-primary">
              <MessageSquare size={15} /> Open Messages
            </button>
          </>
        )}
      />

      {/* ── Public Portfolio Hero Banner ── */}
      <div className="rounded-[28px] border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[var(--bg-card)] p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-500">
                <ShieldCheck size={13} /> Verified Freelancer
              </span>
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-400">
                <Sparkles size={13} /> Public Portfolio Live
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">
              Share your portfolio link with prospective clients
            </h2>
            <p className="text-xs md:text-sm text-[var(--text-subtle)] leading-relaxed">
              Clients can view your verified work showcases, review your skills, and start a direct inquiry chat with you immediately.
            </p>
            <p className="text-xs font-mono text-indigo-400 dark:text-indigo-300 break-all bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 inline-block">
              {portfolioUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={copyPortfolioLink}
              className="btn-secondary px-4 py-2.5 text-xs flex items-center gap-2"
            >
              <Copy size={14} />
              <span>Copy Link</span>
            </button>
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary px-4 py-2.5 text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <ExternalLink size={14} />
              <span>Preview Portfolio</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Overdue Alerts Banner ── */}
      {overdueCount > 0 && (
        <SurfaceCard className="border-rose-400/20 bg-rose-500/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-500">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  You have {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  Send a reminder to these clients to expedite collections and maintain healthy cashflow.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/invoices')} className="btn-secondary text-rose-500">
              View overdue invoices
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* ── Key Metrics Overview ── */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(overview.totalEarned)}
          icon={DollarSign}
          accent="indigo"
          delta={Math.round((overview.netProfit / Math.max(overview.totalEarned || 1, 1)) * 100)}
          deltaLabel="profit margin"
          onClick={() => navigate('/invoices')}
        />
        <MetricCard
          label="Total Clients"
          value={overview.clients}
          icon={Users}
          accent="violet"
          delta={paymentSummary.paidClients}
          deltaLabel="fully paid"
          onClick={() => navigate('/leads')}
        />
        <MetricCard
          label="Active Projects"
          value={overview.projects}
          icon={BriefcaseBusiness}
          accent="cyan"
          delta={overview.clients}
          deltaLabel="workspaces"
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          label="Pending Invoices"
          value={overview.pendingInvoices}
          icon={Receipt}
          accent="rose"
          delta={overview.paidInvoices}
          deltaLabel="paid so far"
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* ── All Workspace Apps & Modules Hub ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Workspace Applications & Modules</h2>
            <p className="text-xs text-[var(--text-subtle)]">
              Direct access to all platform tools for lead gen, delivery, chat, billing, and taxes.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-500">
            {workspaceModules.length} Modules Active
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspaceModules.map((mod) => {
            const Icon = mod.icon
            return (
              <div
                key={mod.title}
                onClick={() => navigate(mod.path)}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-indigo-500/40 hover:shadow-xl transition duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${mod.accent} flex items-center justify-center border border-[var(--border)]`}>
                      <Icon size={20} />
                    </div>
                    <span className="rounded-full bg-[var(--bg-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-subtle)]">
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] group-hover:text-indigo-500 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-[var(--text-subtle)] mt-1 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-soft)] mt-4 flex items-center justify-between text-xs font-semibold text-indigo-500">
                  <span>Open Module</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Revenue Cashflow & Analytics ── */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SurfaceCard>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-[var(--text)]">Revenue & Cashflow Analytics</p>
              <p className="text-xs text-[var(--text-subtle)]">Paid earnings, expenses, and net profit over time.</p>
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-emerald-500">
              Net Profit: {formatCurrency(overview.netProfit)}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '16px',
                    color: 'var(--text)',
                  }}
                  formatter={(value, label) => [
                    formatCurrency(value),
                    label === 'revenue' ? 'Revenue' : label === 'expenses' ? 'Expenses' : 'Profit',
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="expenses" stroke="#06b6d4" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        {/* ── Top Clients Summary ── */}
        <SurfaceCard>
          <div className="mb-4">
            <p className="text-base font-semibold text-[var(--text)]">Top Client Accounts</p>
            <p className="text-xs text-[var(--text-subtle)]">Highest revenue client relationships in your pipeline.</p>
          </div>
          <div className="space-y-3">
            {topClients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-xs text-[var(--text-subtle)]">
                Paid invoices from clients will populate this list automatically.
              </div>
            ) : (
              topClients.map((c, index) => (
                <div key={c.id} className="surface-card-compact flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-bold text-indigo-500">
                      {c.name?.slice(0, 1)?.toUpperCase() || index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{c.name}</p>
                      <p className="text-[11px] text-[var(--text-subtle)]">{c.invoices} paid invoice{c.invoices > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">{formatCurrency(c.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}