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
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'

const STATUS_COLORS = {
  active: '#6366f1',
  completed: '#06b6d4',
  'on-hold': '#f59e0b',
  cancelled: '#f43f5e',
}

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  'on-hold': 'On hold',
  cancelled: 'Cancelled',
}

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
  const [projectProgressData, setProjectProgressData] = useState([])
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
      setProjectProgressData(data.projectProgressData || [])
      setRecentActivity(data.recentActivity || [])
      setUpcomingDeadlines(data.upcomingDeadlines || [])
      setTopClients(data.topClients || [])
      
      setPaymentSummary({
        totalReceived: data.overview.totalEarned,
        totalOutstanding: data.overview.outstandingRevenue,
        paidClients: data.overview.paidInvoicesCount,
        recentPayments: data.recentPayments || []
      })
    } catch {
      toast.error('Failed to load dashboard data')
    }
  }

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
  const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const daysUntil = (value) => Math.ceil((new Date(value).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow="Business Overview"
        title={`Welcome back, ${user?.name || 'there'}`}
        description="A focused view of revenue, project health, upcoming deadlines, and the work that needs attention next."
        actions={(
          <>
            <button onClick={() => navigate('/projects')} className="btn-secondary">
              <FolderKanban size={16} /> Open Projects
            </button>
            <button onClick={() => navigate('/invoices')} className="btn-primary">
              <Receipt size={16} /> Review Invoices
            </button>
          </>
        )}
      />

      {overdueCount > 0 ? (
        <SurfaceCard className="border-rose-400/20 bg-rose-500/8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-200">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-100">You have {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}</p>
                <p className="mt-1 text-sm text-rose-200/80">Nudge these clients today to improve cash flow and reduce follow-up friction.</p>
              </div>
            </div>
            <button onClick={() => navigate('/invoices')} className="btn-secondary text-rose-100">
              View overdue invoices
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
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
          onClick={() => navigate('/clients')}
        />
        <MetricCard
          label="Active Projects"
          value={overview.projects}
          icon={BriefcaseBusiness}
          accent="cyan"
          delta={overview.clients}
          deltaLabel="clients engaged"
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
        <MetricCard
          label="Billable Hours"
          value={`${overview.totalHours.toFixed(1)}h`}
          icon={Clock3}
          accent="emerald"
          delta={overview.projects}
          deltaLabel="projects tracked"
          onClick={() => navigate('/time-tracker')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-50">Client collections</p>
              <p className="text-sm text-slate-400">Received payments and pending balances across all clients.</p>
            </div>
            <Wallet className="text-slate-500" size={18} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Received</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(paymentSummary.totalReceived)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">{formatCurrency(paymentSummary.totalOutstanding)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Paid clients</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{paymentSummary.paidClients}</p>
            </div>
          </div>

          <div className="space-y-3">
            {paymentSummary.recentPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                Payments recorded from clients will appear here.
              </div>
            ) : (
              paymentSummary.recentPayments.map((payment) => (
                <div key={payment.id} className="surface-card-compact">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{payment.clientName}</p>
                      <p className="mt-1 text-xs text-slate-500">{payment.note || 'Payment received'}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-300">{formatCurrency(payment.amount)}</p>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{formatDate(payment.date)}</p>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-50">Revenue health</p>
              <p className="text-sm text-slate-400">A quick snapshot of invoicing and collection status.</p>
            </div>
            <Receipt size={18} className="text-slate-500" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Paid invoices</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{overview.paidInvoices}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Pending invoices</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{overview.pendingInvoices}</p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SurfaceCard>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-50">Revenue analytics</p>
              <p className="text-sm text-slate-400">Paid revenue, expenses, and resulting profit across the last six months.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
              Net profit {formatCurrency(overview.netProfit)}
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '18px', color: 'var(--text)' }}
                  formatter={(value, label) => [formatCurrency(value), label === 'revenue' ? 'Revenue' : label === 'expenses' ? 'Expenses' : 'Profit']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="expenses" stroke="#22d3ee" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="mb-6">
            <p className="text-lg font-semibold text-slate-50">Project progress</p>
            <p className="text-sm text-slate-400">A quick scan of delivery momentum across active workspaces.</p>
          </div>
          {projectProgressData.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No project data yet"
              description="Create projects to unlock delivery progress, timelines, and collaboration visibility."
              action={<button onClick={() => navigate('/projects')} className="btn-primary">Open Projects</button>}
            />
          ) : (
            <div className="space-y-3">
              {projectProgressData.map((project) => {
                const barColor = STATUS_COLORS[project.status] || STATUS_COLORS.active
                return (
                  <div key={project.name} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-50">{project.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{STATUS_LABELS[project.status] || project.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-100">{project.progress}%</p>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Progress</p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full border border-white/10 bg-white/[0.03] p-[2px]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(project.progress, 4)}%`,
                          background: `linear-gradient(90deg, ${barColor}, rgba(34, 211, 238, 0.95))`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SurfaceCard className="xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-50">Recent activity</p>
              <p className="text-sm text-slate-400">Latest movements across projects and payments.</p>
            </div>
            <TrendingUp size={18} className="text-slate-500" />
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                Activity will appear here as you work.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="surface-card-compact">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-500" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{formatDate(item.time)}</p>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="mb-5">
            <p className="text-lg font-semibold text-slate-50">Upcoming deadlines</p>
            <p className="text-sm text-slate-400">Projects requiring attention soon.</p>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                No upcoming deadlines found.
              </div>
            ) : (
              upcomingDeadlines.map((item) => {
                const remaining = daysUntil(item.deadline)
                return (
                  <div key={item.id} className="surface-card-compact">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.client}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{formatDate(item.deadline)}</span>
                      <span className={remaining < 0 ? 'text-rose-300' : remaining === 0 ? 'text-amber-300' : 'text-emerald-300'}>
                        {remaining < 0 ? `${Math.abs(remaining)}d overdue` : remaining === 0 ? 'Due today' : `${remaining}d left`}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="mb-5">
            <p className="text-lg font-semibold text-slate-50">Top clients</p>
            <p className="text-sm text-slate-400">Highest-paying relationships in your pipeline.</p>
          </div>
          <div className="space-y-3">
            {topClients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                Paid invoices will populate this list.
              </div>
            ) : (
              topClients.map((client, index) => (
                <div key={client.id} className="surface-card-compact">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-sm font-semibold text-slate-100">
                      {client.name?.slice(0, 1)?.toUpperCase() || index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.invoices} paid invoice{client.invoices > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-100">{formatCurrency(client.revenue)}</p>
                      <p className="text-xs text-slate-500">rank #{index + 1}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <SurfaceCard className="md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <Users size={18} className="text-slate-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Clients</p>
              <p className="text-xs text-slate-500">Active client relationships</p>
            </div>
          </div>
          <p className="mt-6 text-3xl font-semibold text-slate-50">{overview.clients}</p>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <FolderKanban size={18} className="text-slate-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Expenses</p>
              <p className="text-xs text-slate-500">Tracked operational spend</p>
            </div>
          </div>
          <p className="mt-6 text-3xl font-semibold text-slate-50">{formatCurrency(overview.totalExpenses)}</p>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <TrendingUp size={18} className="text-slate-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Net profit</p>
              <p className="text-xs text-slate-500">Revenue minus expenses</p>
            </div>
          </div>
          <p className="mt-6 text-3xl font-semibold text-slate-50">{formatCurrency(overview.netProfit)}</p>
        </SurfaceCard>
      </div>
    </div>
  )
}