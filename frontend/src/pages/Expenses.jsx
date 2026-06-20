import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Calendar, CreditCard, Plus, Tag, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import AnimatedPage from '../components/AnimatedPage'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import MetricCard from '../components/ui/MetricCard'
import EmptyState from '../components/ui/EmptyState'

const CATEGORIES = ['Software', 'Hardware', 'Marketing', 'Office', 'Travel', 'Others']

const COLORS = {
  Software: '#6366F1',
  Hardware: '#EC4899',
  Marketing: '#3B82F6',
  Office: '#10B981',
  Travel: '#F59E0B',
  Others: '#6B7280',
}

const emptyForm = {
  title: '',
  amount: '',
  category: 'Software',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses')
      setExpenses(data.expenses || [])
    } catch {
      toast.error('Failed to load expenses')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.title.trim() || !formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please add a valid expense title and amount')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
      })
      setExpenses((prev) => [data.expense, ...prev])
      setFormData(emptyForm)
      toast.success('Expense logged successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return
    try {
      await api.delete(`/expenses/${id}`)
      setExpenses((prev) => prev.filter((item) => item._id !== id))
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const now = new Date()
    const monthly = expenses
      .filter((item) => {
        const date = new Date(item.date)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const categoryTotals = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0)
      return acc
    }, {})

    const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name] || COLORS.Others,
    }))

    return {
      total,
      monthly,
      chartData,
      topCategory: chartData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A',
    }
  }, [expenses])

  return (
    <AnimatedPage className="page-container space-y-8">
      <PageHeader
        eyebrow="Business Spend"
        title="Expenses"
        description="Track software, travel, office, and operational costs with a clean ledger and category insights."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Total expenses" value={`₹${Number(metrics.total).toLocaleString('en-IN')}`} icon={CreditCard} accent="rose" />
        <MetricCard label="This month" value={`₹${Number(metrics.monthly).toLocaleString('en-IN')}`} icon={Calendar} accent="amber" />
        <MetricCard label="Top category" value={metrics.topCategory} icon={Tag} accent="indigo" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-lg font-semibold text-slate-50">Log expense</p>
            <p className="text-sm text-slate-400">Capture every spend with category, date, and note context.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Expense title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="input-shell w-full"
                placeholder="Photoshop subscription"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                  className="input-shell w-full"
                  placeholder="2499"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Category</label>
                <select
                  value={formData.category}
                  onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                  className="input-shell w-full"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                className="input-shell w-full"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                className="input-shell w-full resize-none"
                placeholder="Optional notes about this spend..."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              <Plus size={16} /> {loading ? 'Saving...' : 'Log expense'}
            </button>
          </form>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-50">Category breakdown</p>
                <p className="text-sm text-slate-400">Visual split of business spending.</p>
              </div>
            </div>

            {metrics.chartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.chartData} dataKey="value" innerRadius={55} outerRadius={92} paddingAngle={3}>
                      {metrics.chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '18px', color: 'var(--text)' }}
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No expense data"
                description="Add expenses to unlock category analytics and budget visibility."
              />
            )}
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-50">Expense ledger</p>
              <p className="text-sm text-slate-400">Recent spend entries with fast delete actions.</p>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No expenses recorded"
                description="Your operating costs will show up here once you start logging them."
              />
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense._id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-50">{expense.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {expense.notes ? <p className="mt-2 text-sm leading-6 text-slate-400">{expense.notes}</p> : null}
                      </div>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-3 text-rose-200 transition hover:bg-rose-500/16"
                        title="Delete expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          borderColor: `${COLORS[expense.category] || COLORS.Others}30`,
                          backgroundColor: `${COLORS[expense.category] || COLORS.Others}10`,
                          color: COLORS[expense.category] || COLORS.Others,
                        }}
                      >
                        {expense.category}
                      </span>
                      <p className="text-sm font-semibold text-slate-50">₹{Number(expense.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </AnimatedPage>
  )
}
