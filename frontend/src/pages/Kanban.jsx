import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

const COLUMNS = ['todo', 'in-progress', 'review', 'done']

const columnConfig = {
  'todo': { label: 'To Do', icon: '📋', color: 'border-gray-600' },
  'in-progress': { label: 'In Progress', icon: '⚡', color: 'border-blue-500' },
  'review': { label: 'In Review', icon: '👀', color: 'border-yellow-500' },
  'done': { label: 'Done', icon: '✅', color: 'border-green-500' },
}

export default function Kanban() {
  const [tasks, setTasks] = useState({ 'todo': [], 'in-progress': [], 'review': [], 'done': [] })
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [draggedTask, setDraggedTask] = useState(null)
  const [showAdd, setShowAdd] = useState(null)
  const [newTask, setNewTask] = useState('')

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (selectedProject) fetchTasks() }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects)
      if (data.projects.length > 0) setSelectedProject(data.projects[0]._id)
    } catch {}
  }

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/projects/${selectedProject}`)
      const grouped = { 'todo': [], 'in-progress': [], 'review': [], 'done': [] }
      data.project.tasks.forEach(task => {
        const col = task.status || 'todo'
        if (grouped[col]) grouped[col].push(task)
      })
      setTasks(grouped)
    } catch {}
  }

  const handleDragStart = (task, fromCol) => setDraggedTask({ task, fromCol })

  const handleDrop = async (toCol) => {
    if (!draggedTask || draggedTask.fromCol === toCol) return
    try {
      await api.patch(`/projects/${selectedProject}/tasks/${draggedTask.task._id}/move`, { status: toCol })
      fetchTasks()
    } catch { toast.error('Failed to move task') }
    setDraggedTask(null)
  }

  const handleAddTask = async (col) => {
    if (!newTask.trim()) return
    try {
      await api.post(`/projects/${selectedProject}/tasks`, { title: newTask, status: col })
      setNewTask('')
      setShowAdd(null)
      fetchTasks()
      toast.success('Task added!')
    } catch { toast.error('Failed to add task') }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/projects/${selectedProject}/tasks/${taskId}`)
      fetchTasks()
      toast.success('Deleted!')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#0a0a0f] text-gray-200 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Kanban Board</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
              Drag and drop cards to update task sprint progress
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-[#111118]/80 text-white text-xs font-semibold rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Column Summary Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col} className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-4.5 backdrop-blur-md shadow-lg flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{columnConfig[col].label}</p>
                <p className="text-2xl font-black text-white mt-1">{tasks[col]?.length || 0}</p>
              </div>
              <span className="text-2xl">{columnConfig[col].icon}</span>
            </div>
          ))}
        </div>

        {/* Kanban Board Lanes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col) => (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col)}
              className={`bg-[#111118]/40 border-t-2 ${columnConfig[col].color} border-x border-b border-white/[0.04] rounded-2xl p-4 min-h-[550px] flex flex-col justify-between backdrop-blur-md shadow-2xl transition-all duration-300 hover:bg-[#111118]/50`}
            >
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>{columnConfig[col].icon}</span>
                    <span>{columnConfig[col].label}</span>
                  </h3>
                  <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tasks[col]?.length || 0}
                  </span>
                </div>

                {/* Cards List container */}
                <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
                  {tasks[col]?.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => handleDragStart(task, col)}
                      className="bg-[#0a0a0f]/90 rounded-xl p-4 cursor-grab active:cursor-grabbing border border-white/[0.03] hover:border-indigo-500/35 hover:shadow-lg transition-all duration-200 group flex items-start justify-between gap-3"
                    >
                      <p className="font-semibold text-gray-200 text-xs leading-normal">
                        {task.title}
                      </p>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500/[0.04] border border-red-500/10 text-red-400 rounded-lg hover:bg-red-500/15 shrink-0"
                        title="Delete task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {tasks[col]?.length === 0 && (
                    <div className="text-center py-12 text-gray-600 text-xs italic">
                      Empty Lane
                    </div>
                  )}
                </div>
              </div>

              {/* Inline card creator */}
              <div className="pt-2">
                {showAdd === col ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <input
                      autoFocus
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col)}
                      placeholder="Task title..."
                      className="w-full bg-[#0a0a0f]/80 text-white rounded-xl px-3 py-2 border border-indigo-500 focus:outline-none text-xs placeholder-gray-650"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAddTask(col)} 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-xs font-bold transition active:scale-95 shadow-md"
                      >
                        Add
                      </button>
                      <button 
                        onClick={() => { setShowAdd(null); setNewTask('') }} 
                        className="flex-1 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] text-gray-400 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAdd(col)}
                    className="w-full border border-dashed border-white/[0.05] hover:border-indigo-500/40 hover:bg-indigo-500/[0.02] rounded-xl py-2.5 text-gray-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <Plus size={14} /> Add Card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}