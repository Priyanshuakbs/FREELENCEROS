import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Users,
  Sparkles,
  MapPin,
  Briefcase,
  Star,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Filter,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useClientAuthStore from '../store/clientAuthStore'
import AnimatedPage from '../components/AnimatedPage'

const POPULAR_SKILLS = [
  'All',
  'React',
  'Node.js',
  'UI/UX Design',
  'Next.js',
  'Full Stack',
  'Mobile Apps',
  'Python',
  'WordPress',
  'TailwindCSS',
]

export default function FreelancersDirectory() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { client } = useClientAuthStore()
  const isAuthenticated = Boolean(user || client)

  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('All')

  // Contact Modal State
  const [activeFreelancer, setActiveFreelancer] = useState(null)
  const [contactMessage, setContactMessage] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [contacting, setContacting] = useState(false)

  useEffect(() => {
    fetchFreelancers()
  }, [])

  const fetchFreelancers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/freelancers')
      setFreelancers(res.data.freelancers || [])
    } catch (err) {
      console.error('Failed to load freelancers:', err)
      toast.error('Failed to load freelancers directory')
    } finally {
      setLoading(false)
    }
  }

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      const matchesSearch =
        !search.trim() ||
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.title?.toLowerCase().includes(search.toLowerCase()) ||
        f.company?.toLowerCase().includes(search.toLowerCase()) ||
        f.bio?.toLowerCase().includes(search.toLowerCase()) ||
        (Array.isArray(f.skills) && f.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())))

      const matchesSkill =
        selectedSkill === 'All' ||
        (Array.isArray(f.skills) && f.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase()))

      return matchesSearch && matchesSkill
    })
  }, [freelancers, search, selectedSkill])

  const handleContactClick = (f) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('portfolio_redirect', `/portfolio/${f.username || f._id}?action=contact`)
      toast('Please log in to hire or message this freelancer', { icon: '🔑' })
      navigate('/client-login')
      return
    }
    setActiveFreelancer(f)
  }

  const submitContact = async (e) => {
    e?.preventDefault()
    if (!activeFreelancer) return

    setContacting(true)
    try {
      const res = await api.post(`/freelancers/${activeFreelancer._id}/contact`, {
        message: contactMessage.trim() || "Hi, I am interested in working with you on a project.",
        projectTitle: projectTitle.trim() || 'Project Inquiry',
      })

      const convId = res.data.conversationId
      toast.success('Conversation started! Redirecting to chat...')
      setActiveFreelancer(null)
      navigate(`/messages/${convId}`)
    } catch (err) {
      console.error('Failed to contact freelancer:', err)
      toast.error(err.response?.data?.message || 'Failed to start conversation')
    } finally {
      setContacting(false)
    }
  }

  const backendOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

  return (
    <AnimatedPage className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── Navigation Bar ── */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-panel-strong)] backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              F
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">FreelanceOS</p>
              <p className="text-[10px] text-[var(--text-subtle)]">Talent Directory</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {client ? (
              <button
                onClick={() => navigate('/client-dashboard')}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
              >
                <span>Client Dashboard</span>
              </button>
            ) : user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
              >
                <span>Workspace Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/client-login')}
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Client Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Search Section ── */}
      <section className="relative overflow-hidden py-12 md:py-16 px-6 border-b border-[var(--border-soft)]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-500">
            <Sparkles size={14} /> Verified Freelancer Directory
          </span>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text)]">
            Discover Top Freelancers & Hire Direct
          </h1>
          <p className="text-sm md:text-base text-[var(--text-subtle)] max-w-2xl mx-auto">
            Browse verified talent across design, development, and engineering. Chat directly, discuss scopes, and kickstart your project.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by skill, name, title (e.g. React, UI/UX, Full Stack)..."
                className="input-shell w-full pl-12 pr-4 py-3.5 text-sm rounded-2xl shadow-xl shadow-indigo-500/5"
              />
            </div>
          </div>

          {/* Skills Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            {POPULAR_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedSkill === skill
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Freelancers Grid ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              {selectedSkill === 'All' ? 'All Verified Freelancers' : `${selectedSkill} Specialists`}
            </h2>
            <p className="text-xs text-[var(--text-subtle)] mt-0.5">
              Showing {filteredFreelancers.length} {filteredFreelancers.length === 1 ? 'freelancer' : 'freelancers'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[var(--text-subtle)]">Loading freelancers...</p>
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center max-w-md mx-auto space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto">
              <Users size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--text)]">No Freelancers Found</h3>
            <p className="text-xs text-[var(--text-subtle)]">
              Try adjusting your search keywords or choosing another skill filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFreelancers.map((f) => {
              const avatarUrl = f.avatar
                ? f.avatar.startsWith('http')
                  ? f.avatar
                  : `${backendOrigin}${f.avatar}`
                : ''

              return (
                <div
                  key={f._id}
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl hover:shadow-2xl hover:border-indigo-500/40 transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Freelancer Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[var(--border)] flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={f.name} className="h-full w-full object-cover" />
                          ) : (
                            f.name?.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm" title="Verified Professional">
                          <ShieldCheck size={12} />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-base font-bold text-[var(--text)] truncate">{f.name}</h3>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">
                          {f.title || 'Professional Freelancer'}
                        </p>
                        {f.location && (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-subtle)] mt-0.5">
                            <MapPin size={11} />
                            <span className="truncate">{f.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio snippet */}
                    {f.bio && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {f.bio}
                      </p>
                    )}

                    {/* Skills Chips */}
                    {f.skills && f.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {f.skills.slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300"
                          >
                            {s}
                          </span>
                        ))}
                        {f.skills.length > 4 && (
                          <span className="rounded-lg bg-[var(--bg-soft)] px-1.5 py-0.5 text-[10px] text-[var(--text-subtle)]">
                            +{f.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-5 border-t border-[var(--border-soft)] mt-4 flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/portfolio/${f.username || f._id}`)}
                      className="btn-secondary flex-1 justify-center text-xs py-2"
                    >
                      <ExternalLink size={13} />
                      <span>Portfolio</span>
                    </button>
                    <button
                      onClick={() => handleContactClick(f)}
                      className="btn-primary flex-1 justify-center text-xs py-2 shadow-sm"
                    >
                      <MessageSquare size={13} />
                      <span>Hire Me</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Contact Modal ── */}
      {activeFreelancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--bg-panel-strong)] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Direct Message</p>
                <h3 className="text-xl font-bold text-[var(--text)] mt-1">
                  Hire / Contact {activeFreelancer.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveFreelancer(null)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Project Topic / Subject
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Mobile App Development / Web App Redesign"
                  className="input-shell w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Hi, I saw your profile and I would like to discuss a project with you..."
                  className="input-shell w-full text-sm resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFreelancer(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contacting}
                  className="btn-primary"
                >
                  {contacting ? 'Connecting...' : 'Send & Open Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}
