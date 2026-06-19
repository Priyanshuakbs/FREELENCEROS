import { useState, useEffect } from 'react'
import { Plus, Trash2, CreditCard, Calendar, Tag, FileText, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import toast from 'react-hot-toast'
import api from '../lib/axios'

const CATEGORIES = ['Software', 'Hardware', 'Marketing', 'Office', 'Travel', 'Others']

const COLORS = {
  Software: '#6366F1',   // indigo-500
  Hardware: '#EC4899',   // pink-500
  Marketing: '#3B82F6',  // blue-500
  Office: '#10B981',     // emerald-500
  Travel: '#F59E0B',     // amber-500
  Others: '#6B7280',     // gray-500
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Software',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses')
      setExpenses(data.expenses)
    } catch {
      toast.error('Failed to load expenses')
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please fill in a valid title and amount.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
      })
      setExpenses([data.expense, ...expenses])
      setFormData({
        title: '',
        amount: '',
        category: 'Software',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      toast.success('Expense logged successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log expense')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return

    try {
      await api.delete(`/expenses/${id}`)
      setExpenses(expenses.filter((e) => e._id !== id))
      toast.success('Expense deleted!')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  // Calculate metrics
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
  
  const thisMonthExpenses = expenses
    .filter((e) => {
      const expDate = new Date(e.date)
      const now = new Date()
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    })
    .reduce((acc, e) => acc + e.amount, 0)

  // Category breakdown calculations for charts
  const categoryDataObj = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const chartData = Object.keys(categoryDataObj).map((cat) => ({
    name: cat,
    value: categoryDataObj[cat],
    color: COLORS[cat] || '#6B7280',
  }))

  const topCategory = chartData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in text-gray-250 relative overflow-hidden">
      {/* Glow ambient background lights */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Expense <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-300 to-rose-400">Tracker</span> 💳
        </h1>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">Track licenses, assets, travel logs, and operations payouts.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-lg flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Expenses</span>
            <p className="text-3xl font-black text-white tracking-tight mt-1">
              ₹{Number(totalExpenses).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <CreditCard size={18} />
          </div>
        </div>

        <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-lg flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Expenses This Month</span>
            <p className="text-3xl font-black text-white tracking-tight mt-1">
              ₹{Number(thisMonthExpenses).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Calendar size={18} />
          </div>
        </div>

        <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-lg flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Top Category</span>
            <p className="text-3xl font-black text-white tracking-tight capitalize mt-1">
              {topCategory}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Tag size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Log Form Panel */}
        <div className="lg:col-span-1 bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Log Expense</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Expense Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Photoshop Subscription"
                className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="2499"
                  className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all text-xs"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Billing Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Expense Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                placeholder="Details of expense (optional)..."
                className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-rose-500/10 transition duration-300 flex items-center justify-center gap-2 text-xs disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              {loading ? 'Logging Expense...' : 'Log Expense'}
            </button>
          </form>
        </div>

        {/* Expense logs and visualization charts */}
        <div className="lg:col-span-2 space-y-6">
          {chartData.length > 0 && (
            <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur shadow-xl">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Category Breakdown</h2>
              <div className="w-full h-48 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#07070a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontSize: '11px' }}
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Logs panel grid table */}
          <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur shadow-xl">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Expense Log Register</h2>
            {expenses.length === 0 ? (
              <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={36} className="text-gray-600 animate-pulse" />
                <p className="text-base font-bold text-white">No expenses recorded</p>
                <p className="text-xs text-gray-500 max-w-xs leading-normal">File software keys, cloud servers, or other operational payouts on the left form.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pt-1">Expense</th>
                      <th className="pb-3 pt-1">Category</th>
                      <th className="pb-3 pt-1">Date</th>
                      <th className="pb-3 pt-1 text-right">Amount</th>
                      <th className="pb-3 pt-1 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-gray-300">
                    {expenses.map((e) => (
                      <tr key={e._id} className="group hover:bg-white/[0.01] transition-all duration-200">
                        <td className="py-3.5 pr-2">
                          <p className="font-bold text-white truncate max-w-[160px]">{e.title}</p>
                          {e.notes && <p className="text-[10px] text-gray-500 truncate max-w-[160px]">{e.notes}</p>}
                        </td>
                        <td className="py-3.5">
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-md font-bold border"
                            style={{
                              borderColor: `${COLORS[e.category]}40`,
                              backgroundColor: `${COLORS[e.category]}10`,
                              color: COLORS[e.category],
                            }}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {new Date(e.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 text-right font-bold text-white">
                          ₹{Number(e.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => handleDelete(e._id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/10"
                            title="Delete log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
