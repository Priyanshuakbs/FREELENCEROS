import { useState, useEffect } from 'react'
import { Plus, Trash2, X, CheckSquare, Square, Share2, FolderOpen, Paperclip, Download, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import AnimatedPage from '../components/AnimatedPage'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [taskInput, setTaskInput] = useState('')
  const [form, setForm] = useState({ title: '', description: '', client: '', budget: '', deadline: '', status: 'active' })
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuthStore()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [pendingInvites, setPendingInvites] = useState([])

  const [activeTab, setActiveTab] = useState('tasks')
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [billing, setBilling] = useState({ totalBilled: 0, totalPaid: 0 })
  const [uploading, setUploading] = useState(false)

  const fetchMessages = async (projectId) => {
    if (!projectId) return
    try {
      const { data } = await api.get(`/projects/${projectId}/messages`)
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to load messages:', err.message)
    }
  }

  const handleSelectProject = async (project) => {
    try {
      setSelected(project)
      setActiveTab('tasks')
      setMessages([])
      const { data } = await api.get(`/projects/${project._id}`)
      setSelected(data.project)
      setBilling(data.billing || { totalBilled: 0, totalPaid: 0 })
    } catch (err) {
      console.error('Failed to fetch project details:', err.message)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return
    try {
      const { data } = await api.post(`/projects/${selected._id}/messages`, { text: messageInput })
      setMessages(prev => [...prev, data.message])
      setMessageInput('')
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-messages-container')
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
      }, 100)
    } catch {
      toast.error('Failed to send message')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    const toastId = toast.loading('Uploading file...')
    try {
      const { data } = await api.post(`/projects/${selected._id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSelected(data.project)
      toast.success('File uploaded successfully!', { id: toastId })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    const toastId = toast.loading('Deleting file...')
    try {
      const { data } = await api.delete(`/projects/${selected._id}/files/${fileId}`)
      setSelected(data.project)
      toast.success('File deleted successfully!', { id: toastId })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file', { id: toastId })
    }
  }

  useEffect(() => {
    if (selected && activeTab === 'discussion') {
      fetchMessages(selected._id)
      const interval = setInterval(() => {
        fetchMessages(selected._id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selected?._id, activeTab])

  useEffect(() => {
    if (activeTab === 'discussion') {
      const chatContainer = document.getElementById('chat-messages-container')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [activeTab, messages.length])

  const getRemainingTimeText = (deadlineDate) => {
    if (!deadlineDate) return { text: 'No deadline set', type: 'none' };
    const now = new Date();
    const end = new Date(deadlineDate);
    // Strip time for clean day comparison
    now.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`, type: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due today!', type: 'today' };
    } else {
      return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`, type: 'remaining' };
    }
  };

  async function fetchPendingInvites(projectId) {
    try {
      const { data } = await api.get(`/projects/${projectId}/invitations`)
      setPendingInvites(data.invitations)
    } catch {
      console.error('Failed to fetch pending invitations')
    }
  }

  useEffect(() => {
    if (selected) {
      fetchPendingInvites(selected._id)
    } else {
      setPendingInvites([])
    }
  }, [selected?._id])

  const handleInviteCollaborator = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    try {
      const { data } = await api.post(`/projects/${selected._id}/invite`, { email: inviteEmail })
      toast.success(data.message || 'Invitation sent successfully!')
      setInviteEmail('')
      fetchPendingInvites(selected._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCancelInvite = async (inviteId) => {
    if (!confirm('Cancel this pending invitation?')) return
    try {
      await api.delete(`/projects/${selected._id}/invitations/${inviteId}`)
      toast.success('Invitation cancelled!')
      fetchPendingInvites(selected._id)
    } catch {
      toast.error('Failed to cancel invitation')
    }
  }

  async function fetchProjects() {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects)
    } catch {
      toast.error('Failed to load projects')
    }
  }

  async function fetchClients() {
    try {
      const { data } = await api.get('/clients')
      setClients(data.clients)
    } catch {}
  }

  const handleRemoveCollaborator = async (projectId, collaboratorId) => {
    if (!confirm('Remove this collaborator from the project?')) return
    try {
      const { data } = await api.delete(`/projects/${projectId}/collaborators/${collaboratorId}`)
      toast.success('Collaborator removed!')
      // Refresh the selected project detail to show updated collaborators list
      setSelected(data.project)
      fetchProjects()
    } catch {
      toast.error('Failed to remove collaborator')
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/projects', form)
      toast.success('Project created!')
      setShowModal(false)
      setForm({ title: '', description: '', client: '', budget: '', deadline: '', status: 'active' })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Deleted!')
      if (selected?._id === id) setSelected(null)
      fetchProjects()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleShareProject = async (projectId) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/share`)
      const portalURL = `${window.location.origin}/portal/${data.shareToken}`
      await navigator.clipboard.writeText(portalURL)
      toast.success('Shareable Client Portal link copied to clipboard! 📋')
    } catch {
      toast.error('Failed to generate share link')
    }
  }

  const handleAddTask = async (projectId) => {
    if (!taskInput.trim()) return
    try {
      const { data } = await api.post(`/projects/${projectId}/tasks`, { title: taskInput })
      setSelected(data.project)
      setTaskInput('')
      fetchProjects()
    } catch {
      toast.error('Failed to add task')
    }
  }

  const handleToggleTask = async (projectId, taskId) => {
    try {
      const { data } = await api.patch(`/projects/${projectId}/tasks/${taskId}`)
      setSelected(data.project)
      fetchProjects()
    } catch {
      toast.error('Failed to update task')
    }
  }

  const statusThemeMap = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    'on-hold': 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#0a0a0f] text-gray-200 p-6 md:p-8 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
              Draft budgets, milestones, tasks, and invite collaborators
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-indigo-500/10 active:scale-95 shrink-0"
            >
              <Plus size={16} /> New Project
            </button>
          )}
        </div>

        {/* Dual Panel Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Project Cards */}
          <div className="lg:col-span-6 space-y-4">
            {projects.length === 0 ? (
              <div className="bg-[#111118]/65 border border-white/[0.04] rounded-2xl p-12 text-center text-gray-400 backdrop-blur shadow-xl">
                <p className="text-lg font-bold text-white mb-1">No projects found</p>
                <p className="text-xs text-gray-500 font-medium mb-6">Create a project workspace to track milestones.</p>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-550/20 text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95"
                  >
                    Create New Project
                  </button>
                )}
              </div>
            ) : (
              projects.map((project) => {
                const active = selected?._id === project._id
                const completedCount = project.tasks.filter(t => t.completed).length
                const totalCount = project.tasks.length
                const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

                return (
                  <div
                    key={project._id}
                    onClick={() => handleSelectProject(project)}
                    className={`bg-[#111118]/60 backdrop-blur-md rounded-2xl p-5 border cursor-pointer transition-all duration-300 group ${
                      active 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/[0.02]' 
                        : 'border-white/[0.04] hover:border-indigo-500/30 hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 min-w-0 flex-1 pr-4">
                        <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors">
                          {project.title}
                        </h3>
                        {project.client && (
                          <p className="text-xs text-gray-450 font-medium truncate">
                            Client: <strong className="text-gray-300">{project.client.name}</strong>
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusThemeMap[project.status] || 'bg-gray-800 text-gray-450 border-gray-800'}`}>
                            {project.status}
                          </span>
                          {project.budget > 0 && (
                            <span className="text-xs font-bold text-white">
                              ₹{Number(project.budget).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {user?.role === 'admin' && (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleShareProject(project._id)} 
                            title="Copy Client Share Link" 
                            className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition border border-transparent hover:border-indigo-500/20"
                          >
                            <Share2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(project._id)} 
                            className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span>Progress</span>
                        <span>{completedCount}/{totalCount} Tasks ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/[0.02] rounded-full h-1.5 p-[1px] border border-white/[0.04]">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Right Panel: Project Details & Workspace */}
          <div className="lg:col-span-6">
            {selected ? (
              <div className="bg-[#111118]/60 backdrop-blur-md rounded-2xl p-6 border border-white/[0.04] shadow-2xl space-y-6">
                
                {/* Selected header */}
                <div className="flex justify-between items-start gap-4 border-b border-white/[0.04] pb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-white truncate">{selected.title}</h2>
                      <button 
                        onClick={() => handleShareProject(selected._id)} 
                        title="Copy Client Link" 
                        className="p-1 hover:bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-lg transition"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                    {selected.client && <p className="text-xs text-gray-500 font-semibold mt-1">Client: {selected.client.name}</p>}
                  </div>
                  <button 
                    onClick={() => setSelected(null)}
                    className="p-1.5 text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-lg transition"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-white/[0.04] gap-2 pb-px">
                  {[
                    { id: 'tasks', label: 'Tasks' },
                    { id: 'financials', label: 'Financials & Timeline' },
                    { id: 'discussion', label: 'Discussion' },
                    { id: 'files', label: 'Files' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`text-xs font-bold uppercase tracking-wider pb-3 px-4 transition-all duration-200 border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content: Tasks */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {selected.description && (
                      <p className="text-xs text-gray-400 leading-relaxed font-medium bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl">
                        {selected.description}
                      </p>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Milestone Tasks</h3>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selected.tasks && selected.tasks.length > 0 ? (
                          selected.tasks.map((task) => (
                            <div
                              key={task._id}
                              onClick={() => handleToggleTask(selected._id, task._id)}
                              className="flex items-center gap-3 p-3 bg-[#0a0a0f]/80 hover:bg-[#0d0d12] border border-white/[0.03] hover:border-indigo-500/20 rounded-xl cursor-pointer transition"
                            >
                              {task.completed ? (
                                <CheckSquare size={16} className="text-indigo-400 shrink-0" />
                              ) : (
                                <Square size={16} className="text-gray-500 shrink-0" />
                              )}
                              <span className={`text-xs font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                {task.title}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">No tasks set for this project.</p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={taskInput}
                          onChange={(e) => setTaskInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selected._id)}
                          placeholder="Name a new task/milestone..."
                          className="flex-1 bg-[#0a0a0f]/80 text-white text-xs rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
                        />
                        <button
                          onClick={() => handleAddTask(selected._id)}
                          className="bg-indigo-650 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition shadow-md shrink-0"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.04] pt-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Collaborators 👥</h3>
                      
                      {(selected.freelancer === user?.id || user?.role === 'admin') && (
                        <form onSubmit={handleInviteCollaborator} className="flex gap-2">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Invite collaborator email..."
                            className="flex-1 bg-[#0a0a0f]/80 text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none text-xs placeholder-gray-650"
                            required
                          />
                          <button
                            type="submit"
                            disabled={inviteLoading}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                          >
                            {inviteLoading ? 'Sending...' : 'Invite'}
                          </button>
                        </form>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selected.collaborators && selected.collaborators.length > 0 ? (
                          selected.collaborators.map((c) => (
                            <div key={c._id} className="flex items-center justify-between p-2.5 bg-[#0a0a0f]/80 border border-white/[0.03] rounded-xl text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate">{c.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{c.email}</p>
                              </div>
                              {(selected.freelancer === user?.id || user?.role === 'admin') && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCollaborator(selected._id, c._id)}
                                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded-lg transition"
                                  title="Remove Collaborator"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic col-span-2">No collaborators joined yet.</p>
                        )}
                      </div>

                      {pendingInvites && pendingInvites.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/[0.03] space-y-2.5">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Pending Invites
                          </h4>
                          <div className="space-y-2">
                            {pendingInvites.map((invite) => (
                              <div key={invite._id} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs">
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-300 truncate">{invite.inviteeEmail}</p>
                                  <p className="text-[9px] text-gray-500 mt-0.5">Invited: {new Date(invite.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-semibold px-2 py-0.5 rounded-lg">
                                    Pending
                                  </span>
                                  {(selected.freelancer === user?.id || user?.role === 'admin') && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelInvite(invite._id)}
                                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded-lg transition"
                                      title="Revoke Invitation"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Financials & Timeline */}
                {activeTab === 'financials' && (() => {
                  const timeInfo = getRemainingTimeText(selected.deadline);
                  const balanceDue = Math.max(0, billing.totalBilled - billing.totalPaid);
                  
                  const badgeColorMap = {
                    overdue: 'bg-red-500/10 text-red-400 border-red-500/25',
                    today: 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse',
                    remaining: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                    none: 'bg-gray-500/10 text-gray-400 border-gray-500/25'
                  };

                  return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Timeline Card */}
                      <div className="bg-white/[0.02] border border-white/[0.04] p-5 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Timeline & Deadline</h4>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Deadline Date</p>
                            <p className="text-sm font-bold text-white mt-0.5">
                              {selected.deadline ? new Date(selected.deadline).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No deadline set'}
                            </p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border self-start sm:self-center ${badgeColorMap[timeInfo.type] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {timeInfo.text}
                          </span>
                        </div>
                      </div>

                      {/* Financials Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Budget */}
                        <div className="bg-[#111118]/80 border border-white/[0.03] p-4.5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Budget</p>
                          <p className="text-lg font-black text-white">
                            ₹{selected.budget ? Number(selected.budget).toLocaleString('en-IN') : '0'}
                          </p>
                        </div>

                        {/* Billed */}
                        <div className="bg-[#111118]/80 border border-white/[0.03] p-4.5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Amount Billed</p>
                          <p className="text-lg font-black text-indigo-400">
                            ₹{Number(billing.totalBilled).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Paid */}
                        <div className="bg-[#111118]/80 border border-white/[0.03] p-4.5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Amount Paid</p>
                          <p className="text-lg font-black text-emerald-400">
                            ₹{Number(billing.totalPaid).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Balance Due */}
                        <div className="bg-[#111118]/80 border border-white/[0.03] p-4.5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Balance Due</p>
                          <p className={`text-lg font-black ${balanceDue > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                            ₹{balanceDue.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tab Content: Discussion (Chat) */}
                {activeTab === 'discussion' && (
                  <div className="flex flex-col h-[400px] border border-white/[0.04] bg-white/[0.01] rounded-2xl overflow-hidden animate-in fade-in duration-200">
                    <div
                      id="chat-messages-container"
                      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                    >
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-505 space-y-2">
                          <span className="text-2xl">💬</span>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">No messages yet</p>
                          <p className="text-[10px] text-gray-500 text-center px-6">Start a conversation with the client or team about this project.</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.sender?._id === user?.id;
                          const senderRole = msg.sender?.role || 'admin';
                          return (
                            <div
                              key={msg._id}
                              className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-gray-500 font-medium">
                                <span className="font-bold text-gray-300">{isMe ? 'You' : msg.sender?.name}</span>
                                <span className={`text-[8px] font-extrabold uppercase px-1 rounded border ${
                                  senderRole === 'admin' 
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {senderRole === 'admin' ? 'Admin' : 'Client'}
                                </span>
                                <span>•</span>
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                                isMe 
                                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-white/[0.03] border border-white/[0.04] text-gray-200 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.04] bg-[#0c0c12]/80 flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#0a0a0f]/80 text-white text-xs rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none placeholder-gray-650"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-200 shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}

                {/* Tab Content: Files */}
                {activeTab === 'files' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* File Upload Zone */}
                    <div className="border border-dashed border-white/[0.08] hover:border-indigo-500/50 bg-[#0c0c12]/80 rounded-2xl p-6 text-center transition duration-200 relative group cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="project-file-uploader"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <UploadCloud size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Click or drag a file to upload</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1">Supports PDF, DOCX, ZIP, images up to 10MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Shared Files List */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Shared Files ({selected.files?.length || 0})</h3>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {!selected.files || selected.files.length === 0 ? (
                          <div className="text-center p-8 bg-[#0a0a0f]/40 border border-white/[0.02] rounded-2xl text-gray-500">
                            <p className="text-xs italic">No files shared on this project yet.</p>
                          </div>
                        ) : (
                          selected.files.map((file) => {
                            const formattedSize = file.size 
                              ? file.size > 1024 * 1024 
                                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                                : `${(file.size / 1024).toFixed(0)} KB`
                              : 'Unknown'
                            
                            const fileUrl = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${file.url}`
                            
                            // Check if current user is owner, uploader, or admin
                            const isOwner = selected.freelancer === user?.id;
                            const isUploader = file.uploadedBy?._id === user?.id;
                            const isAdmin = user?.role === 'admin';
                            const canDelete = isOwner || isUploader || isAdmin;

                            const uploaderRole = file.uploadedBy?.role || 'admin';

                            return (
                              <div key={file._id} className="flex items-center justify-between p-3.5 bg-[#0a0a0f]/80 border border-white/[0.03] hover:border-indigo-500/20 rounded-2xl transition group">
                                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                                    <Paperclip size={15} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-white truncate" title={file.name}>
                                      {file.name}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-gray-500 font-medium">
                                      <span>{formattedSize}</span>
                                      <span>•</span>
                                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        by <strong className="text-gray-400">{file.uploadedBy?.name || 'Admin'}</strong>
                                        <span className={`text-[8px] font-extrabold uppercase px-1 rounded border ${
                                          uploaderRole === 'admin' 
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                          {uploaderRole === 'admin' ? 'Admin' : 'Client'}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    download 
                                    className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition border border-indigo-500/15"
                                    title="Download File"
                                  >
                                    <Download size={14} />
                                  </a>
                                  {canDelete && (
                                    <button 
                                      onClick={() => handleDeleteFile(file._id)} 
                                      className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl transition border border-transparent hover:border-red-500/20"
                                      title="Delete File"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#111118]/60 backdrop-blur-md rounded-2xl p-12 border border-white/[0.04] shadow-2xl text-center text-gray-400 flex flex-col items-center justify-center min-h-[350px]">
                <FolderOpen className="text-indigo-400/40 mb-4 animate-bounce" size={42} />
                <h3 className="text-lg font-bold text-white mb-1">Select a Workspace</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed font-medium">
                  Click on any project from the directory list on the left to track progress, milestones, and invites.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111118]/90 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Create Workspace</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Setup milestones and target outline</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] rounded-xl transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Project Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Website Redesign"
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Goals and guidelines..."
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650 resize-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Assign Client</label>
                <select
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="">Select client (optional)</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Budget (₹)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="25000"
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Project Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-bold py-3 rounded-xl transition duration-200 shadow-md disabled:opacity-50 text-sm active:scale-95"
              >
                {loading ? 'Creating Project...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}