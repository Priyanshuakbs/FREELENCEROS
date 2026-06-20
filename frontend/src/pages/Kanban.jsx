import { useEffect, useMemo, useState } from 'react'
import { Check, CircleDashed, Plus, Sparkles, Trash2, CalendarDays, Flag, Tag, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'

const COLUMNS = ['todo', 'in-progress', 'review', 'done']

const columnConfig = {
  todo: { label: 'To Do', tone: 'slate', ring: 'border-slate-400/20', accent: 'from-slate-400 to-slate-500' },
  'in-progress': { label: 'In Progress', tone: 'indigo', ring: 'border-indigo-400/20', accent: 'from-indigo-400 to-violet-500' },
  review: { label: 'In Review', tone: 'amber', ring: 'border-amber-400/20', accent: 'from-amber-400 to-orange-500' },
  done: { label: 'Done', tone: 'emerald', ring: 'border-emerald-400/20', accent: 'from-emerald-400 to-cyan-400' },
}

const priorityTone = {
  low: 'bg-slate-500/12 text-slate-300 border-slate-400/20',
  medium: 'bg-cyan-500/12 text-cyan-300 border-cyan-400/20',
  high: 'bg-rose-500/12 text-rose-300 border-rose-400/20',
}

const emptyBoard = { todo: [], 'in-progress': [], review: [], done: [] }

const formatDue = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No due date'

export default function Kanban() {
  const [tasks, setTasks] = useState(emptyBoard)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [draggedTask, setDraggedTask] = useState(null)
  const [showAdd, setShowAdd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium',
    dueDate: '',
    tags: '',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) fetchTasks()
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      const nextProjects = data.projects || []
      setProjects(nextProjects)
      if (!selectedProject && nextProjects.length > 0) {
        setSelectedProject(nextProjects[0]._id)
      }
      setLoading(false)
    } catch {
      toast.error('Failed to load projects')
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/projects/${selectedProject}`)
      const grouped = { ...emptyBoard }
      data.project.tasks.forEach((task) => {
        const col = task.status || 'todo'
        if (grouped[col]) grouped[col].push(task)
      })
      setTasks(grouped)
    } catch {
      toast.error('Failed to load board tasks')
    }
  }

  const handleDragStart = (task, fromCol) => setDraggedTask({ task, fromCol })

  const handleDrop = async (toCol) => {
    if (!draggedTask || draggedTask.fromCol === toCol) return
    try {
      await api.patch(`/projects/${selectedProject}/tasks/${draggedTask.task._id}/move`, { status: toCol })
      await fetchTasks()
    } catch {
      toast.error('Failed to move task')
    } finally {
      setDraggedTask(null)
    }
  }

  const handleAddTask = async (col) => {
    if (!newTask.title.trim()) return
    try {
      await api.post(`/projects/${selectedProject}/tasks`, {
        title: newTask.title,
        status: col,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        tags: newTask.tags,
      })
      setNewTask({ title: '', priority: 'medium', dueDate: '', tags: '' })
      setShowAdd(null)
      fetchTasks()
      toast.success('Task added')
    } catch {
      toast.error('Failed to add task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/projects/${selectedProject}/tasks/${taskId}`)
      fetchTasks()
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleToggleTask = async (taskId) => {
    try {
      await api.patch(`/projects/${selectedProject}/tasks/${taskId}`)
      fetchTasks()
    } catch {
      toast.error('Failed to update task')
    }
  }

  const summary = useMemo(() => {
    return COLUMNS.map((col) => ({ key: col, count: tasks[col]?.length || 0 }))
  }, [tasks])

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow="Task Management"
        title="Kanban Board"
        description="Drag cards between stages, tag work items, set priorities, and keep due dates visible at a glance."
        actions={(
          <div className="w-full sm:w-[280px]">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-shell w-full"
            >
              {projects.map((project) => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </select>
          </div>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <MetricColumn key={item.key} column={item.key} count={item.count} />
        ))}
      </div>

      {!selectedProject && !loading ? (
        <EmptyState
          icon={CircleDashed}
          title="No project selected"
          description="Pick a project to see its task board."
        />
      ) : null}

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1120px] gap-5 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const config = columnConfig[col]
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col)}
                className="min-h-[680px]"
              >
                <SurfaceCard className={`h-full border-t-4 ${config.ring} bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.72))]`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${config.accent}`} />
                        <h3 className="text-sm font-semibold text-slate-50">{config.label}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{tasks[col]?.length || 0} cards</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                      {config.label}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <AnimatePresence>
                      {tasks[col]?.length > 0 ? tasks[col].map((task) => (
                        <motion.div
                          key={task._id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          draggable
                          onDragStart={() => handleDragStart(task, col)}
                          className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_40px_-24px_rgba(2,6,23,0.8)] transition hover:border-white/15 hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 cursor-grab text-slate-500 active:cursor-grabbing">
                              <GripVertical size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  onClick={() => handleToggleTask(task._id)}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] transition ${task.completed ? 'border-emerald-400/20 bg-emerald-500/12 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}
                                >
                                  {task.completed ? 'Done' : 'Open'}
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="rounded-full border border-rose-400/15 bg-rose-500/10 p-2 text-rose-200 opacity-0 transition group-hover:opacity-100"
                                  title="Delete task"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              <p className={`mt-3 text-sm leading-6 font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                                {task.title}
                              </p>

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${priorityTone[task.priority] || priorityTone.medium}`}>
                                  <Flag size={10} className="mr-1 inline-block" /> {task.priority || 'medium'}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                                  <CalendarDays size={10} className="mr-1 inline-block" /> {formatDue(task.dueDate)}
                                </span>
                                {(task.tags || []).map((tag) => (
                                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
                                    <Tag size={10} className="mr-1 inline-block" /> {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                          <p className="text-sm font-medium text-slate-200">No tasks here</p>
                          <p className="mt-2 text-xs text-slate-500">Drop a task into this column or create a new one.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-4">
                    {showAdd === col ? (
                      <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                        <input
                          autoFocus
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col)}
                          placeholder="Task title..."
                          className="input-shell w-full"
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                            className="input-shell w-full"
                          >
                            <option value="low">Low priority</option>
                            <option value="medium">Medium priority</option>
                            <option value="high">High priority</option>
                          </select>
                          <input
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                            className="input-shell w-full"
                          />
                          <input
                            type="text"
                            value={newTask.tags}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, tags: e.target.value }))}
                            placeholder="tags"
                            className="input-shell w-full"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddTask(col)}
                            className="btn-primary flex-1 py-2.5"
                          >
                            Add Task
                          </button>
                          <button
                            onClick={() => {
                              setShowAdd(null)
                              setNewTask({ title: '', priority: 'medium', dueDate: '', tags: '' })
                            }}
                            className="btn-secondary flex-1 py-2.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAdd(col)}
                        className="btn-secondary w-full justify-center border-dashed py-3"
                      >
                        <Plus size={16} /> Add task
                      </button>
                    )}
                  </div>
                </SurfaceCard>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricColumn({ column, count }) {
  const icons = {
    todo: CircleDashed,
    'in-progress': Sparkles,
    review: Flag,
    done: Check,
  }
  const Icon = icons[column]
  return (
    <SurfaceCard className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{columnConfig[column].label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-50">{count}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${columnConfig[column].ring} bg-white/[0.03]`}>
        <Icon size={18} className="text-slate-200" />
      </div>
    </SurfaceCard>
  )
}
