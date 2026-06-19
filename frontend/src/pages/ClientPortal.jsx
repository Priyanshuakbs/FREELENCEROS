import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckSquare, Clock, Calendar, AlertCircle } from 'lucide-react'
import axios from 'axios'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPublicProject()
  }, [token])

  const fetchPublicProject = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const { data } = await axios.get(`${apiURL}/projects/portal/${token}`)
      setProject(data.project)

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

        {/* Read-Only Kanban Grid */}
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
                <span className="bg-gray-850 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
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
                      className="bg-gray-950/60 border border-gray-850 rounded-xl p-4 shadow-sm relative group"
                    >
                      <p className="font-semibold text-gray-200 text-xs leading-normal">{task.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-850 px-8 py-8 text-center text-gray-600 text-xs mt-12 bg-gray-950/20">
        <p>© 2024 FreelanceOS. Project tracking portal generated securely.</p>
      </footer>
    </div>
  )
}
