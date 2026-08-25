import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Globe,
  MapPin,
  Briefcase,
  Mail,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Link2
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useClientAuthStore from '../store/clientAuthStore'
import AnimatedPage from '../components/AnimatedPage'

function GithubIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export default function PublicPortfolio() {
  const { identifier } = useParams()
  const navigate = useNavigate()

  const { user: loggedInUser } = useAuthStore()
  const { client: loggedInClient } = useClientAuthStore()
  const isAuthenticated = Boolean(loggedInUser || loggedInClient)

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  // Contact Modal State
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [contacting, setContacting] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [identifier])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'contact' && isAuthenticated) {
      setShowContactModal(true)
    }
  }, [isAuthenticated])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(`/freelancers/${identifier}/public-profile`)
      setProfile(res.data.profile)
    } catch (err) {
      console.error('Failed to load portfolio:', err)
      setError(err.response?.data?.message || 'Freelancer not found')
    } finally {
      setLoading(false)
    }
  }

  const handleContactClick = () => {
    if (!isAuthenticated) {
      // Store return target and prompt login
      sessionStorage.setItem('portfolio_redirect', `/portfolio/${identifier}?action=contact`)
      toast('Please log in to message this freelancer', { icon: '🔑' })
      navigate('/client-login')
      return
    }
    setShowContactModal(true)
  }

  const submitContact = async (e) => {
    e?.preventDefault()
    if (!profile) return

    setContacting(true)
    try {
      const res = await api.post(`/freelancers/${profile._id}/contact`, {
        message: contactMessage.trim() || "Hi, I saw your portfolio and I'm interested in working with you.",
        projectTitle: projectTitle.trim() || 'Portfolio Inquiry',
      })

      const convId = res.data.conversationId
      toast.success('Conversation started! Redirecting to chat...')
      setShowContactModal(false)
      navigate(`/messages/${convId}`)
    } catch (err) {
      console.error('Failed to start conversation:', err)
      toast.error(err.response?.data?.message || 'Failed to start conversation')
    } finally {
      setContacting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Freelancer Not Found</h1>
          <p className="text-sm text-slate-400 mb-6">
            The requested freelancer portfolio link does not exist or has been modified.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full justify-center">
            Return to Homepage
          </button>
        </div>
      </div>
    )
  }

  const backendOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
  const avatarUrl = profile.avatar
    ? profile.avatar.startsWith('http')
      ? profile.avatar
      : `${backendOrigin}${profile.avatar}`
    : ''

  return (
    <AnimatedPage className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
              F
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">FreelanceOS</p>
              <p className="text-[10px] text-slate-400">Verified Portfolio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleContactClick}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              <MessageSquare size={14} />
              <span>Contact Me</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden py-16 px-6 border-b border-white/5">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-600/15 via-violet-600/15 to-pink-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Avatar */}
          <div className="relative inline-block">
            <div className="h-32 w-32 md:h-36 md:w-36 rounded-[36px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 p-1 mx-auto shadow-2xl shadow-indigo-500/20">
              <div className="h-full w-full rounded-[32px] overflow-hidden bg-slate-900 flex items-center justify-center text-3xl font-extrabold text-indigo-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  profile.name?.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-md">
              <ShieldCheck size={18} />
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              {profile.name}
            </h1>
            <p className="mt-2 text-base md:text-lg text-indigo-300 font-medium">
              {profile.title || 'Professional Freelancer'}
              {profile.company && (
                <span className="text-slate-400 font-normal"> · {profile.company}</span>
              )}
            </p>

            {profile.location && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <MapPin size={13} className="text-slate-500" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
              >
                <Globe size={14} className="text-indigo-400" />
                <span>Website</span>
                <ExternalLink size={11} />
              </a>
            )}
            {profile.github && (
              <a
                href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
              >
                <GithubIcon size={14} className="text-slate-300" />
                <span>GitHub</span>
                <ExternalLink size={11} />
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
              >
                <LinkedinIcon size={14} className="text-cyan-400" />
                <span>LinkedIn</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* CTA Banner */}
          <div className="pt-4">
            <button
              onClick={handleContactClick}
              className="btn-primary py-3.5 px-8 text-sm font-bold shadow-xl shadow-indigo-500/30 hover:scale-[1.02] transition transform inline-flex items-center gap-2.5"
            >
              <MessageSquare size={18} />
              <span>Get in Touch / Hire Me</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid ── */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* ── Skills & Services ── */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2 text-indigo-400">
                  <Code2 size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Skills & Tech Stack</h2>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {profile.services?.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-2 text-purple-400">
                  <Layers size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Services Offered</h2>
              </div>

              <div className="space-y-2.5 pt-2">
                {profile.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Experience / Background ── */}
        {profile.experience && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-amber-400">
                <Briefcase size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Experience & Track Record</h2>
            </div>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
              {profile.experience}
            </p>
          </div>
        )}

        {/* ── Featured Projects ── */}
        {((profile.portfolioProjects && profile.portfolioProjects.length > 0) ||
          (profile.showcaseProjects && profile.showcaseProjects.length > 0)) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  A selection of recent works and deliverable showcases
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Custom Portfolio Projects */}
              {profile.portfolioProjects?.map((proj, idx) => (
                <div
                  key={`custom-${idx}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-xl hover:border-indigo-500/30 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-100">{proj.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {proj.description || 'No description provided.'}
                    </p>

                    {proj.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.technologies.map((t, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-4">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl.startsWith('http') ? proj.liveUrl : `https://${proj.liveUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        <span>Live Preview</span>
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl.startsWith('http') ? proj.githubUrl : `https://${proj.githubUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                      >
                        <GithubIcon size={12} />
                        <span>Code</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Showcase Projects from Workspace */}
              {profile.showcaseProjects?.map((proj) => (
                <div
                  key={`showcase-${proj._id}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-xl hover:border-indigo-500/30 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-100">{proj.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {proj.description || 'Client project delivered with high standards.'}
                    </p>

                    {proj.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.tags.map((t, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] text-indigo-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Delivered Project</span>
                    <button
                      onClick={handleContactClick}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <span>Inquire similar</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer Call to Action ── */}
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 p-8 md:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Have a project in mind for {profile.name}?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Directly connect to discuss timelines, pricing, and project requirements in real-time.
          </p>
          <div className="pt-4">
            <button
              onClick={handleContactClick}
              className="btn-primary py-3 px-8 text-sm font-bold shadow-xl shadow-indigo-500/30"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>

      {/* ── Contact Me Modal ── */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Direct Message</p>
                <h3 className="text-xl font-bold text-white mt-1">Contact {profile.name}</h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project / Topic Subject
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Website Redesign / Full-Stack App"
                  className="input-shell w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Initial Message
                </label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Hi, I saw your portfolio and I would love to discuss a project..."
                  className="input-shell w-full text-sm resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
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
