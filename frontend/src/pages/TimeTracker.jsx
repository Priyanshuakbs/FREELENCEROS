import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

export default function TimeTracker() {
  const [logs, setLogs] = useState([])
  const [projects, setProjects] = useState([])
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({ project: '', description: '', hourlyRate: 0 })
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchLogs()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  async function fetchLogs() {
    try {
      const { data } = await api.get('/timelogs')
      setLogs(data.logs)
    } catch {
      toast.error('Failed to load logs')
    }
  }

  async function fetchProjects() {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects)
    } catch {}
  }

  const handleStop = async () => {
    setRunning(false)
    if (seconds < 60) {
      toast.error('Track at least 1 minute!')
      setSeconds(0)
      return
    }
    try {
      await api.post('/timelogs', {
        ...form,
        duration: Math.floor(seconds / 60),
      })
      toast.success('Time logged!')
      setSeconds(0)
      fetchLogs()
    } catch {
      toast.error('Failed to save log')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/timelogs/${id}`)
      toast.success('Deleted!')
      fetchLogs()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const totalMinutes = logs.reduce((acc, log) => acc + log.duration, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-250 p-6 md:p-8 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="border-b border-white/[0.04] pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Time Tracker</h1>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
            Log billable hours, rates, and projects in real-time
          </p>
        </div>

        {/* Digital Timer Panel */}
        <div className="bg-[#111118]/60 backdrop-blur-md rounded-3xl p-8 border border-white/[0.04] shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
          
          <div className="text-7xl font-mono font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 tracking-wider drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            {formatTime(seconds)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 text-left">
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Associated Project</label>
              <select
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                disabled={running}
                className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Hourly Rate (₹)</label>
              <input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                disabled={running}
                placeholder="1500"
                className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">What are you working on?</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={running}
                placeholder="Description of task deliverables..."
                className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-3 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-655"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!running ? (
              <button
                onClick={() => setRunning(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white text-sm font-bold px-8 py-3.5 rounded-xl transition duration-200 shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
              >
                <Play size={16} /> Start Tracker
              </button>
            ) : (
              <>
                <button
                  onClick={() => setRunning(false)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-650 hover:from-amber-500 hover:to-yellow-550 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition duration-200 shadow-md active:scale-95 cursor-pointer"
                >
                  <Pause size={16} /> Pause
                </button>
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-550 hover:to-rose-500 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition duration-205 shadow-md active:scale-95 cursor-pointer"
                >
                  <Square size={16} /> Save Log
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-lg">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Accumulated Hours</p>
            <p className="text-3xl font-black mt-2 text-indigo-400 tracking-tight">{totalHours}h</p>
          </div>
          <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md shadow-lg">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Active Sessions</p>
            <p className="text-3xl font-black mt-2 text-white tracking-tight">{logs.length}</p>
          </div>
        </div>

        {/* Logs Register */}
        <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h2 className="text-base font-bold text-white">Time Logs History</h2>
          </div>
          {logs.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-xs italic">
              No previous logs recorded — start tracking above to log hours!
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {logs.map((log) => (
                <div key={log._id} className="p-4.5 flex justify-between items-center hover:bg-white/[0.01] transition group">
                  <div className="space-y-1 pr-4 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{log.description || 'Untitled Session'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      {log.project && (
                        <span className="text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">
                          {log.project.title}
                        </span>
                      )}
                      <span>•</span>
                      <span>Duration: {log.duration} mins</span>
                      {log.hourlyRate > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            Earnings: ₹{((log.duration / 60) * log.hourlyRate).toFixed(0)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(log._id)} 
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                    title="Delete log"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}