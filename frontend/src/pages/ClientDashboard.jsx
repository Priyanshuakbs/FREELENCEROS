import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeIndianRupee,
  Briefcase,
  FileText,
  MessageSquare,
  Paperclip,
  CheckCircle,
  Clock,
  LogOut,
  Mail,
  Phone,
  Building,
  MapPin,
  Edit2,
  Lock,
  Download,
  Upload,
  Send,
  Trash2,
  CheckSquare,
  AlertCircle,
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useClientAuthStore from '../store/clientAuthStore'
import AnimatedPage from '../components/AnimatedPage'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { client, logout, updateProfile } = useClientAuthStore()
  
  // Dashboard state
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const [projectTab, setProjectTab] = useState('scope') // 'scope' | 'tasks' | 'files' | 'chat'

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)

  // Payments state
  const [payingInvoiceId, setPayingInvoiceId] = useState(null)

  // Chat state
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (data?.projects?.[activeProjectIndex]) {
      fetchProjectMessages(data.projects[activeProjectIndex]._id)
    }
  }, [activeProjectIndex, data])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/dashboard/client/summary')
      setData(res.data)
      if (res.data?.client) {
        updateProfile(res.data.client)
        setProfileForm({
          name: res.data.client.name || '',
          email: res.data.client.email || '',
          phone: res.data.client.phone || '',
          company: res.data.client.company || '',
          address: res.data.client.address || ''
        })
      }
    } catch (err) {
      toast.error('Failed to load dashboard details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectMessages = async (projectId) => {
    try {
      setChatLoading(true)
      const res = await api.get(`/dashboard/client/projects/${projectId}/messages`)
      setMessages(res.data.messages || [])
    } catch {
      toast.error('Failed to load messages.')
    } finally {
      setChatLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await api.put('/dashboard/client/profile', profileForm)
      updateProfile(res.data.client)
      toast.success('Profile updated successfully!')
      setShowProfileModal(false)
      fetchDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAcceptPRD = async (projectId) => {
    const toastId = toast.loading('Accepting scope document...')
    try {
      const res = await api.post(`/projects/${projectId}/prd/accept`)
      toast.success('Scope document accepted successfully!', { id: toastId })
      fetchDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept PRD', { id: toastId })
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !data?.projects?.[activeProjectIndex]) return
    const projectId = data.projects[activeProjectIndex]._id
    try {
      const res = await api.post(`/dashboard/client/projects/${projectId}/messages`, { text: messageInput })
      setMessages(prev => [...prev, res.data.message])
      setMessageInput('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !data?.projects?.[activeProjectIndex]) return
    const projectId = data.projects[activeProjectIndex]._id

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploadingFile(true)
    const toastId = toast.loading('Uploading file to project...')
    try {
      await api.post(`/dashboard/client/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('File uploaded successfully!', { id: toastId })
      fetchDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file', { id: toastId })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    if (!data?.projects?.[activeProjectIndex]) return
    const projectId = data.projects[activeProjectIndex]._id

    const toastId = toast.loading('Deleting file...')
    try {
      await api.delete(`/dashboard/client/projects/${projectId}/files/${fileId}`)
      toast.success('File deleted successfully!', { id: toastId })
      fetchDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file', { id: toastId })
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
    setPayingInvoiceId(invoice.id)
    try {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.')
        setPayingInvoiceId(null)
        return
      }

      const { data: orderData } = await api.post(`/dashboard/client/invoices/${invoice.id}/razorpay-order`)

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'FreelanceOS',
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
            await api.post(`/dashboard/client/invoices/${invoice.id}/razorpay-verify`, verifyPayload)
            toast.success('Payment completed successfully!')
            fetchDashboardData()
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.')
          }
        },
        prefill: {
          name: client?.name || '',
          email: client?.email || '',
          contact: client?.phone || '',
        },
        theme: {
          color: '#6366f1',
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

  const handleLogout = () => {
    logout()
    navigate('/client-login')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-indigo-400">
        <Clock className="mr-2 animate-spin" /> Loading client dashboard...
      </div>
    )
  }

  const currentProject = data?.projects?.[activeProjectIndex]

  return (
    <AnimatedPage className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Background visual blobs */}
      <div className="pointer-events-none absolute top-10 left-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] z-0" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[120px] z-0" />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl relative z-10 space-y-6">
        
        {/* Navigation / Header */}
        <header className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg">
              <BadgeIndianRupee size={18} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-black text-transparent">
              FreelanceOS Client
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/freelancers')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <Users size={14} /> Find Freelancers
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <MessageSquare size={14} /> Messages
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{client?.name}</p>
              <p className="text-xs text-indigo-400">{client?.company || 'Client Profile'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Profile & Payments */}
          <div className="space-y-6">
            
            {/* Profile Info */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Building size={18} className="text-indigo-400" /> Account Profile
                </h2>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="p-2 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg transition"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <Building size={16} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Company</p>
                    <p className="font-medium text-slate-200">{client?.company || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
                    <p className="font-medium text-slate-200">{client?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Phone</p>
                    <p className="font-medium text-slate-200">{client?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Address</p>
                    <p className="font-medium text-slate-200 whitespace-pre-wrap">{client?.address || 'N/A'}</p>
                  </div>
                </div>
                
                {/* GST / PAN numbers */}
                {(client?.gstNumber || client?.panNumber) && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                    {client.gstNumber && (
                      <p className="text-slate-400">GSTIN: <span className="font-mono text-slate-200 font-semibold ml-1">{client.gstNumber}</span></p>
                    )}
                    {client.panNumber && (
                      <p className="text-slate-400">PAN: <span className="font-mono text-slate-200 font-semibold ml-1">{client.panNumber}</span></p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" /> Invoices & Billing
              </h2>
              {data?.invoices?.length === 0 ? (
                <p className="text-sm text-slate-500">No invoices generated yet.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {data?.invoices?.map((inv) => (
                    <div key={inv.id} className="p-3 bg-slate-900/80 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs transition hover:border-slate-800">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">{inv.invoiceNumber}</p>
                        <p className="text-slate-400 font-semibold">₹{inv.total.toLocaleString('en-IN')}</p>
                        <p className="text-slate-500 font-medium">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'Upon receipt'}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          {inv.status === 'paid' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-semibold text-[10px]">PAID</span>
                          ) : inv.status === 'overdue' ? (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md font-semibold text-[10px]">OVERDUE</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-semibold text-[10px]">PENDING</span>
                          )}
                        </div>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handlePayInvoice(inv)}
                            disabled={payingInvoiceId === inv.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition disabled:opacity-50"
                          >
                            {payingInvoiceId === inv.id ? 'Processing...' : 'Pay'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Project list & drill down details */}
          <div className="lg:col-span-2 space-y-6">
            {data?.projects?.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800 p-12 rounded-2xl text-center space-y-4">
                <Briefcase size={48} className="mx-auto text-slate-600" />
                <h3 className="text-lg font-bold">No Projects Assigned</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">There are no active projects registered under your account at this moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Project Selector Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {data.projects.map((proj, idx) => (
                    <button
                      key={proj._id}
                      onClick={() => {
                        setActiveProjectIndex(idx)
                        setProjectTab('scope')
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex-shrink-0 border ${
                        activeProjectIndex === idx
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      {proj.title}
                    </button>
                  ))}
                </div>

                {/* Project Details Box */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  
                  {/* Project Info Header */}
                  <div className="p-6 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-100">{currentProject?.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">Status: <span className="text-indigo-400 font-bold uppercase">{currentProject?.status}</span></p>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
                      <div>
                        <p className="text-slate-500 uppercase font-semibold">Budget</p>
                        <p className="text-sm font-black text-slate-200">₹{currentProject?.budget?.toLocaleString('en-IN') || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-semibold">Deadline</p>
                        <p className="text-sm font-black text-slate-200">{currentProject?.deadline ? new Date(currentProject.deadline).toLocaleDateString('en-IN') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inner Tab bar */}
                  <div className="flex border-b border-slate-800/50 bg-slate-900/20 text-xs font-semibold">
                    <button
                      onClick={() => setProjectTab('scope')}
                      className={`flex-1 py-3 text-center transition ${projectTab === 'scope' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Scope & PRD
                    </button>
                    <button
                      onClick={() => setProjectTab('tasks')}
                      className={`flex-1 py-3 text-center transition ${projectTab === 'tasks' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Tasks Progress
                    </button>
                    <button
                      onClick={() => setProjectTab('files')}
                      className={`flex-1 py-3 text-center transition ${projectTab === 'files' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Files & Assets ({currentProject?.files?.length || 0})
                    </button>
                    <button
                      onClick={() => setProjectTab('chat')}
                      className={`flex-1 py-3 text-center transition ${projectTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Project Chat
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-6">
                    
                    {/* Scope & PRD Tab */}
                    {projectTab === 'scope' && (
                      <div className="space-y-6">
                        {!currentProject?.prd ? (
                          <div className="py-6 text-center text-slate-500 space-y-2">
                            <FileText size={40} className="mx-auto text-slate-700 animate-pulse" />
                            <p className="text-sm font-semibold">No PRD Created Yet</p>
                            <p className="text-xs text-slate-500">Your freelancer hasn't drafted a Project Requirements Document for this project yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3">
                              <div className="text-xs">
                                <p className="text-slate-400 font-medium">PRD Document version: <span className="font-bold text-slate-200">v{currentProject.prd.version}</span></p>
                                <p className="text-slate-500 font-medium mt-0.5">Created by: {currentProject.prd.createdBy?.name || 'Freelancer'}</p>
                              </div>
                              <div>
                                {currentProject.prd.status === 'accepted' ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
                                    <CheckCircle size={14} /> Accepted on {new Date(currentProject.prd.acceptedAt).toLocaleDateString('en-IN')}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAcceptPRD(currentProject._id)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                                  >
                                    <CheckCircle size={14} /> Accept Scope
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Scope Text content */}
                            <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                              {currentProject.prd.content}
                            </div>

                            {currentProject.prd.status === 'accepted' && (
                              <p className="text-[10px] text-slate-500 italic text-right">
                                Electronically accepted from IP Address: {currentProject.prd.acceptedIp || 'Captured'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tasks (Read-only) Tab */}
                    {projectTab === 'tasks' && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Kanban Board Tasks (Read Only)</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {['todo', 'in-progress', 'review', 'done'].map((col) => {
                            const colTasks = currentProject?.tasks?.filter(t => t.status === col) || []
                            const colTitles = {
                              'todo': 'To Do',
                              'in-progress': 'In Progress',
                              'review': 'In Review',
                              'done': 'Completed'
                            }
                            const colColors = {
                              'todo': 'border-slate-800',
                              'in-progress': 'border-blue-500/30',
                              'review': 'border-amber-500/30',
                              'done': 'border-emerald-500/30'
                            }

                            return (
                              <div key={col} className={`p-3 bg-slate-950/60 rounded-xl border ${colColors[col]} space-y-3 min-h-[250px]`}>
                                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                  <span className="text-xs font-black text-slate-200 uppercase">{colTitles[col]}</span>
                                  <span className="text-[10px] font-bold bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                                </div>
                                
                                <div className="space-y-2">
                                  {colTasks.length === 0 ? (
                                    <p className="text-[10px] text-slate-600 text-center py-4 italic">No tasks in column</p>
                                  ) : (
                                    colTasks.map((t) => (
                                      <div key={t._id} className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg text-xs space-y-1.5 hover:border-slate-700/60 transition">
                                        <p className="font-semibold text-slate-200">{t.title}</p>
                                        <div className="flex items-center justify-between text-[9px] text-slate-500">
                                          <span className={`px-1 rounded font-semibold ${
                                            t.priority === 'high' ? 'bg-rose-500/10 text-rose-400' :
                                            t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-slate-500/10 text-slate-400'
                                          }`}>
                                            {t.priority}
                                          </span>
                                          {t.dueDate && (
                                            <span>{new Date(t.dueDate).toLocaleDateString('en-IN')}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Files Tab */}
                    {projectTab === 'files' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Project Assets & Contracts</p>
                          <label className={`flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload size={14} /> Upload File
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={uploadingFile}
                            />
                          </label>
                        </div>

                        {currentProject?.files?.length === 0 ? (
                          <div className="py-6 text-center text-slate-500">
                            <Paperclip size={40} className="mx-auto text-slate-800 mb-1" />
                            <p className="text-xs font-semibold">No assets uploaded yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentProject.files.map((file) => {
                              const uploadedByClient = !file.uploadedBy
                              return (
                                <div key={file._id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                                  <div className="space-y-0.5 pr-2 max-w-[80%]">
                                    <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''} • Uploaded by {uploadedByClient ? 'You' : (file.uploadedBy?.name || 'Freelancer')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={file.url}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 hover:bg-slate-900 border border-slate-800/60 rounded-lg text-indigo-400 hover:text-indigo-300 transition"
                                    >
                                      <Download size={14} />
                                    </a>
                                    {uploadedByClient && (
                                      <button
                                        onClick={() => handleDeleteFile(file._id)}
                                        className="p-1.5 hover:bg-slate-900 border border-slate-800/60 rounded-lg text-rose-400 hover:text-rose-300 transition"
                                      >
                                        <Trash2 size={14} />
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

                    {/* Chat Tab */}
                    {projectTab === 'chat' && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Collaboration Thread</p>
                        
                        {/* Messages Box */}
                        <div
                          id="chat-messages-container"
                          className="h-[300px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-4 pr-2"
                        >
                          {chatLoading && messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-xs text-slate-500">Loading chat history...</div>
                          ) : messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-xs text-slate-500 italic">No messages sent yet. Say hi to your freelancer!</div>
                          ) : (
                            messages.map((msg) => {
                              const isSelf = msg.senderModel === 'Client' || (msg.sender && msg.sender._id === client.id)
                              return (
                                <div key={msg._id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">{isSelf ? 'You' : (msg.sender?.name || 'Freelancer')}</span>
                                  <div className={`p-2.5 max-w-[80%] rounded-2xl text-xs ${
                                    isSelf ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800'
                                  }`}>
                                    {msg.text}
                                  </div>
                                  <span className="text-[8px] text-slate-600 font-medium">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Send Form */}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="input-shell flex-1 text-xs"
                          />
                          <button
                            type="submit"
                            disabled={!messageInput.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center"
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-100">Edit Profile Details</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold text-left">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="input-shell w-full"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input-shell w-full"
                  required
                />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input-shell w-full"
                />
              </div>
              <div>
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  className="input-shell w-full"
                />
              </div>
              <div>
                <label className="form-label">Physical Address</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="input-shell w-full h-20 resize-none"
                />
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-800/80 rounded-xl text-slate-300 transition text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition text-xs font-bold"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}
