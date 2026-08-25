import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckSquare, Clock, Calendar, AlertCircle, FileText, Download, Loader2, Receipt } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const COLUMNS = ['todo', 'in-progress', 'review', 'done']

const columnConfig = {
  'todo': { label: 'To Do', icon: '📋', color: 'border-gray-650' },
  'in-progress': { label: 'In Progress', icon: '⚡', color: 'border-blue-500' },
  'review': { label: 'In Review', icon: '👀', color: 'border-yellow-500' },
  'done': { label: 'Done', icon: '✅', color: 'border-green-500' },
}

export default function ClientPortal() {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState({ 'todo': [], 'in-progress': [], 'review': [], 'done': [] })
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'billing'
  const [payingInvoiceId, setPayingInvoiceId] = useState(null)

  useEffect(() => {
    fetchPublicProject()
  }, [token])

  const fetchPublicProject = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const { data } = await axios.get(`${apiURL}/projects/portal/${token}`)
      setProject(data.project)
      setInvoices(data.invoices || [])

      const grouped = { 'todo': [], 'in-progress': [], 'review': [], 'done': [] }
      data.project.tasks.forEach((task) => {
        const col = task.status || 'todo'
        if (grouped[col]) grouped[col].push(task)
      })
      setTasks(grouped)
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied or portal link expired.')
    } finally {
      setLoading(false)
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayInvoice = async (invoice) => {
    setPayingInvoiceId(invoice._id)
    try {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.')
        setPayingInvoiceId(null)
        return
      }

      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const { data } = await axios.post(`${apiURL}/projects/portal/${token}/invoices/${invoice._id}/razorpay-order`)

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'FreelanceOS',
        description: `Payment for Invoice ${data.invoiceNumber || invoice.invoiceNumber}`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
            await axios.post(`${apiURL}/projects/portal/${token}/invoices/${invoice._id}/razorpay-verify`, verifyPayload)
            toast.success('Payment completed successfully!')
            fetchPublicProject()
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.')
          }
        },
        prefill: {
          name: project.client?.name || '',
          email: project.client?.email || '',
          contact: project.client?.phone || '',
        },
        theme: {
          color: '#4f46e5',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment.')
    } finally {
      setPayingInvoiceId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-1.5 bg-gray-800/40 p-5 rounded-2xl border border-gray-800">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          <span className="text-sm font-semibold ml-2 select-none text-gray-300">Syncing with server...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8 text-white">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/20 p-8 rounded-2xl shadow-2xl text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold">Portal Error</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-xs text-gray-500">Please contact your freelancer to generate a new secure shareable link.</p>
        </div>
      </div>
    )
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.completed || t.status === 'done').length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Toaster position="top-right" />
      
      {/* Top Banner */}
      <header className="border-b border-gray-850 bg-gray-900/40 backdrop-blur-md sticky top-0 z-30 px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block bg-indigo-950/40 text-indigo-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border border-indigo-900/30 mb-1.5">
              💼 Client Access Portal
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Managed by <strong className="text-gray-300">{project.freelancer?.name}</strong> for <strong className="text-gray-300">{project.client?.name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Progress</p>
              <p className="text-xl font-extrabold text-white">{progressPercent}%</p>
            </div>
            <div className="w-24 bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800 shrink-0">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Selectors */}
      <div className="max-w-7xl mx-auto px-8 mt-6">
        <div className="flex border-b border-gray-850">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-350'
            }`}
          >
            <CheckSquare size={14} /> Tasks & Progress
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-350'
            }`}
          >
            <FileText size={14} /> Invoices & Billing
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <main className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Project Meta Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-850 rounded-2xl p-5 backdrop-blur flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <CheckSquare size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Tasks Progress</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {completedTasks} / {totalTasks} Completed
              </p>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-850 rounded-2xl p-5 backdrop-blur flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Project Deadline</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'No deadline set'}
              </p>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-850 rounded-2xl p-5 backdrop-blur flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Portal Security</p>
              <p className="text-lg font-bold text-white mt-0.5">SSL Protected</p>
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {COLUMNS.map((col) => (
              <div
                key={col}
                className={`bg-gray-900/40 rounded-2xl border-t-4 ${columnConfig[col].color} border border-gray-850 p-5 min-h-[450px] backdrop-blur`}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{columnConfig[col].icon}</span>
                    <span>{columnConfig[col].label}</span>
                  </h3>
                  <span className="bg-gray-855 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {tasks[col]?.length || 0}
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks[col]?.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-650 border border-dashed border-gray-850 rounded-xl">
                      No tasks in this stage
                    </div>
                  ) : (
                    tasks[col]?.map((task) => (
                      <div
                        key={task._id}
                        className="bg-gray-950/60 border border-gray-855 rounded-xl p-4 shadow-sm relative group"
                      >
                        <p className="font-semibold text-gray-200 text-xs leading-normal">{task.title}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 backdrop-blur space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt size={18} className="text-indigo-400" /> Invoices & Billing
                </h2>
                <p className="text-xs text-gray-450 mt-1">Settle your outstanding invoices securely via Razorpay</p>
              </div>
              <span className="bg-indigo-950/40 text-indigo-400 text-xs px-3 py-1 rounded-full font-bold border border-indigo-900/30">
                {invoices.filter(i => i.status !== 'paid').length} Outstanding
              </span>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-16 text-gray-500 italic text-sm">
                No invoices have been generated for this project yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {invoices.map((invoice) => {
                  const statusColors = {
                    draft: 'bg-gray-800 text-gray-405 border-gray-700',
                    sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  }
                  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                  const pdfUrl = `${apiURL}/projects/portal/${token}/invoices/${invoice._id}/pdf`

                  return (
                    <div key={invoice._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-white text-sm">{invoice.invoiceNumber}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors[invoice.status] || 'bg-gray-800 text-gray-450'}`}>
                            {invoice.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-450 mt-1">
                          <span>Amount: <strong className="text-white">₹{invoice.total?.toLocaleString('en-IN')}</strong></span>
                          <span>•</span>
                          <span>Issued: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                          {invoice.dueDate && (
                            <>
                              <span>•</span>
                              <span className={invoice.status === 'overdue' ? 'text-rose-400 font-bold' : ''}>
                                Due: {new Date(invoice.dueDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/40 hover:bg-gray-850 text-gray-300 hover:text-white rounded-xl text-xs border border-gray-800/80 transition"
                        >
                          <Download size={14} /> Download PDF
                        </a>

                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={() => handlePayInvoice(invoice)}
                            disabled={payingInvoiceId === invoice._id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-bold rounded-xl text-xs transition active:scale-95 disabled:opacity-60"
                          >
                            {payingInvoiceId === invoice._id ? (
                              <><Loader2 size={13} className="animate-spin" /> Processing...</>
                            ) : (
                              'Pay Now'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-850 px-8 py-8 text-center text-gray-600 text-xs mt-12 bg-gray-950/20">
        <p>© 2024 FreelanceOS. Project tracking portal generated securely.</p>
      </footer>
    </div>
  )
}

