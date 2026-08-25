import { useEffect, useMemo, useState } from 'react'
import {
  Camera,
  Code2,
  Globe,
  Link2,
  MapPin,
  Save,
  Shield,
  User,
  Mail,
  Phone,
  BriefcaseBusiness,
  LockKeyhole,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Layers,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import MetricCard from '../components/ui/MetricCard'

const backendOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

const emptyForm = {
  name: '',
  username: '',
  title: '',
  company: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  portfolio: '',
  bio: '',
  skills: '',
  services: '',
  experience: '',
  bankAccountName: '',
  bankAccountNumber: '',
  ifscCode: '',
  upiId: '',
  gstNumber: '',
  businessRegistrationNumber: '',
}

const emptyPassword = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const labelClasses = 'mb-2 block text-sm text-slate-300'

export default function Profile() {
  const { user, setAuth, token } = useAuthStore()
  const [form, setForm] = useState(emptyForm)
  const [portfolioProjects, setPortfolioProjects] = useState([])
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState(emptyPassword)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      username: user.username || '',
      title: user.title || '',
      company: user.company || '',
      phone: user.phone || '',
      location: user.location || '',
      website: user.website || '',
      linkedin: user.linkedin || '',
      github: user.github || '',
      portfolio: user.portfolio || '',
      bio: user.bio || '',
      skills: Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || '',
      services: Array.isArray(user.services) ? user.services.join(', ') : user.services || '',
      experience: user.experience || '',
      bankAccountName: user.bankAccountName || '',
      bankAccountNumber: user.bankAccountNumber || '',
      ifscCode: user.ifscCode || '',
      upiId: user.upiId || '',
      gstNumber: user.gstNumber || '',
      businessRegistrationNumber: user.businessRegistrationNumber || '',
    })

    setPortfolioProjects(user.portfolioProjects || [])

    const avatarUrl = user.avatar
      ? user.avatar.startsWith('http')
        ? user.avatar
        : `${backendOrigin}${user.avatar}`
      : ''
    setAvatarPreview(avatarUrl)
  }, [user])

  useEffect(() => {
    if (!avatar) return undefined
    const nextPreview = URL.createObjectURL(avatar)
    setAvatarPreview(nextPreview)
    return () => URL.revokeObjectURL(nextPreview)
  }, [avatar])

  const handleAddProject = () => {
    setPortfolioProjects([
      ...portfolioProjects,
      { title: '', description: '', technologies: '', liveUrl: '', githubUrl: '' },
    ])
  }

  const handleRemoveProject = (index) => {
    setPortfolioProjects(portfolioProjects.filter((_, i) => i !== index))
  }

  const handleProjectChange = (index, field, value) => {
    const next = [...portfolioProjects]
    next[index] = { ...next[index], [field]: value }
    setPortfolioProjects(next)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))

      // Format portfolio projects
      const formattedProjects = portfolioProjects.map((p) => ({
        ...p,
        technologies: Array.isArray(p.technologies)
          ? p.technologies
          : typeof p.technologies === 'string'
          ? p.technologies.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      }))
      formData.append('portfolioProjects', JSON.stringify(formattedProjects))

      if (avatar) formData.append('avatar', avatar)

      const { data } = await api.put('/auth/profile', formData)
      setAuth(data.user, token)
      toast.success('Profile and portfolio updated successfully')
      setAvatar(null)
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to update profile. Please check inputs and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordSaving(true)
    try {
      await api.put('/auth/password', password)
      setPassword(emptyPassword)
      toast.success('Password updated')
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to change password. Ensure current password is correct.'
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  const copyPortfolioLink = () => {
    const identifier = form.username || user?.username || user?._id || user?.id
    const link = `${window.location.origin}/portfolio/${identifier}`
    navigator.clipboard.writeText(link)
    toast.success('Public portfolio link copied!')
  }

  const initials = useMemo(() => {
    return user?.name
      ? user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
      : 'U'
  }, [user?.name])

  const portfolioUrl = `${window.location.origin}/portfolio/${form.username || user?.username || user?._id || user?.id || ''}`

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow="Account Center"
        title="Profile & Public Portfolio"
        description="Update your public portfolio identity, skills, services, billing details, and security preferences."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* ── Left Sidebar Profile Card ── */}
        <SurfaceCard className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-indigo-500/22 to-violet-500/18 text-2xl font-semibold text-slate-50">
                {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : initials}
              </div>
              <label className="absolute -right-1 -bottom-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 text-slate-200 shadow-lg">
                <Camera size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold text-slate-50">{user?.name}</p>
              <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">{user?.role || 'user'}</span>
                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-200">{user?.plan || 'free'} plan</span>
              </div>
            </div>
          </div>

          {/* ── Public Portfolio Showcase Link ── */}
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Public Portfolio</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Live
              </span>
            </div>

            <p className="text-xs text-slate-300 break-all bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono">
              {portfolioUrl}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={copyPortfolioLink}
                className="btn-secondary flex-1 justify-center text-xs py-2"
              >
                <Copy size={13} />
                <span>Copy Link</span>
              </button>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary flex-1 justify-center text-xs py-2"
              >
                <ExternalLink size={13} />
                <span>Preview</span>
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Monthly Goal" value={`₹${Number(user?.monthlyGoal || 0).toLocaleString('en-IN')}`} icon={Shield} accent="indigo" />
            <MetricCard label="Verification" value={user?.isVerified ? 'Verified' : 'Pending'} icon={User} accent={user?.isVerified ? 'emerald' : 'rose'} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Quick Details</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2"><BriefcaseBusiness size={14} className="text-slate-500" /> {form.title || 'No designation set'}</div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> {form.location || 'No location set'}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500" /> {form.phone || 'No phone number'}</div>
            </div>
          </div>
        </SurfaceCard>

        {/* ── Right Form: Profile & Portfolio Settings ── */}
        <SurfaceCard className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClasses}>Full name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-shell w-full" required />
              </div>
              <div>
                <label className={labelClasses}>Custom Username (Portfolio handle)</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                  className="input-shell w-full font-mono text-sm"
                  placeholder="e.g. priyanshu"
                />
              </div>
              <div>
                <label className={labelClasses}>Designation / Professional Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-shell w-full" placeholder="Full-Stack Developer, UI/UX Designer" />
              </div>
              <div>
                <label className={labelClasses}>Company / Studio</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-shell w-full" placeholder="Freelance Studio" />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-shell w-full" />
              </div>
              <div>
                <label className={labelClasses}>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-shell w-full" placeholder="e.g. Mumbai, India" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelClasses}>Website</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-shell w-full" placeholder="https://mywebsite.com" />
              </div>
              <div>
                <label className={labelClasses}>LinkedIn</label>
                <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input-shell w-full" placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className={labelClasses}>GitHub</label>
                <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input-shell w-full" placeholder="https://github.com/..." />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Bio / About (Visible on Portfolio)</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input-shell w-full resize-none"
                placeholder="Short professional bio, services, and what clients should know."
              />
            </div>

            {/* ── Skills & Services ── */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Skills & Technologies (comma-separated)</label>
                  <input
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    className="input-shell w-full"
                    placeholder="React, Node.js, TailwindCSS, MongoDB, Next.js"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Services Offered (comma-separated)</label>
                  <input
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    className="input-shell w-full"
                    placeholder="Web Development, API Design, UI/UX Consulting"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Experience & Background</label>
                <textarea
                  rows={3}
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="input-shell w-full resize-none"
                  placeholder="5+ years building scalable SaaS applications and high-conversion client web apps..."
                />
              </div>
            </div>

            {/* ── Featured Portfolio Projects ── */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Featured Portfolio Projects</h3>
                  <p className="text-xs text-slate-400">Showcase public projects on your public portfolio page</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Project</span>
                </button>
              </div>

              {portfolioProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
                  No custom portfolio projects added. Click "Add Project" above to showcase specific deliverables.
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolioProjects.map((proj, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Project #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Project Title *</label>
                          <input
                            value={proj.title || ''}
                            onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                            placeholder="e.g. E-Commerce Platform"
                            className="input-shell w-full text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Technologies (comma-separated)</label>
                          <input
                            value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || ''}
                            onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)}
                            placeholder="React, Stripe, Node.js"
                            className="input-shell w-full text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Description</label>
                        <input
                          value={proj.description || ''}
                          onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                          placeholder="Brief description of goals, features, or client outcomes..."
                          className="input-shell w-full text-xs"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Live Demo Link</label>
                          <input
                            value={proj.liveUrl || ''}
                            onChange={(e) => handleProjectChange(idx, 'liveUrl', e.target.value)}
                            placeholder="https://example.com"
                            className="input-shell w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">GitHub / Code Link</label>
                          <input
                            value={proj.githubUrl || ''}
                            onChange={(e) => handleProjectChange(idx, 'githubUrl', e.target.value)}
                            placeholder="https://github.com/..."
                            className="input-shell w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Business & Bank Details ── */}
            <div className="pt-5 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Business & Billing Details (Private)</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Bank Account Name</label>
                  <input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="input-shell w-full" placeholder="e.g. John Doe Studios" />
                </div>
                <div>
                  <label className={labelClasses}>Bank Account Number</label>
                  <input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="input-shell w-full" placeholder="e.g. 1234567890" />
                </div>
                <div>
                  <label className={labelClasses}>IFSC Code</label>
                  <input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} className="input-shell w-full" placeholder="e.g. HDFC0000123" />
                </div>
                <div>
                  <label className={labelClasses}>UPI ID</label>
                  <input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} className="input-shell w-full" placeholder="e.g. john@okaxis" />
                </div>
                <div>
                  <label className={labelClasses}>GST Number</label>
                  <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className="input-shell w-full" placeholder="e.g. 27AAAAA1111A1Z1" />
                </div>
                <div>
                  <label className={labelClasses}>Business Reg Number</label>
                  <input value={form.businessRegistrationNumber} onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })} className="input-shell w-full" placeholder="e.g. U12345MH2021PTC123456" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6"
              >
                <Save size={16} />
                <span>{saving ? 'Saving Profile...' : 'Save Profile & Portfolio'}</span>
              </button>
            </div>
          </form>
        </SurfaceCard>
      </div>

      {/* ── Security & Links Footer ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <LockKeyhole size={18} className="text-slate-200" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-50">Change password</p>
              <p className="text-sm text-slate-400">Keep your workspace secure with a strong password.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={labelClasses}>Current password</label>
              <input
                type="password"
                value={password.currentPassword}
                onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                className="input-shell w-full"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClasses}>New password</label>
                <input
                  type="password"
                  value={password.newPassword}
                  onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                  className="input-shell w-full"
                />
              </div>
              <div>
                <label className={labelClasses}>Confirm password</label>
                <input
                  type="password"
                  value={password.confirmPassword}
                  onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                  className="input-shell w-full"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={passwordSaving} className="btn-primary">
                {passwordSaving ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <Link2 size={18} className="text-slate-200" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-50">Connected links</p>
              <p className="text-sm text-slate-400">Use these links in invoices, proposals, and your portfolio.</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <LinkRow icon={Globe} label="Website" value={form.website} />
            <LinkRow icon={Link2} label="LinkedIn" value={form.linkedin} />
            <LinkRow icon={Code2} label="GitHub" value={form.github} />
            <LinkRow icon={Mail} label="Email" value={user?.email} />
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

function LinkRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
          <Icon size={14} className="text-slate-300" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-1 break-all text-sm text-slate-200">{value || 'Not set'}</p>
        </div>
      </div>
    </div>
  )
}
