import { useEffect, useMemo, useState } from 'react'
import { Camera, Code2, Globe, Link2, MapPin, Save, Shield, User, Mail, Phone, BriefcaseBusiness, LockKeyhole } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import MetricCard from '../components/ui/MetricCard'

const backendOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

const emptyForm = {
  name: '',
  title: '',
  company: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  portfolio: '',
  bio: '',
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
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState(emptyPassword)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      title: user.title || '',
      company: user.company || '',
      phone: user.phone || '',
      location: user.location || '',
      website: user.website || '',
      linkedin: user.linkedin || '',
      github: user.github || '',
      portfolio: user.portfolio || '',
      bio: user.bio || '',
      bankAccountName: user.bankAccountName || '',
      bankAccountNumber: user.bankAccountNumber || '',
      ifscCode: user.ifscCode || '',
      upiId: user.upiId || '',
      gstNumber: user.gstNumber || '',
      businessRegistrationNumber: user.businessRegistrationNumber || '',
    })
    // Cloudinary gives a full https:// URL; legacy local uploads need backendOrigin prefix
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      if (avatar) formData.append('avatar', avatar)

      const { data } = await api.put('/auth/profile', formData)
      setAuth(data.user, token)
      toast.success('Profile updated successfully')
      setAvatar(null)
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Backend server is unreachable. Start the API server and try again.'
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
          'Backend server is unreachable. Start the API server and try again.'
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  const initials = useMemo(() => {
    return user?.name
      ? user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
      : 'U'
  }, [user?.name])

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow="Account Center"
        title="Profile"
        description="Update your public identity, social links, business details, and security preferences from one polished workspace."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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

        <SurfaceCard className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClasses}>Full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-shell w-full" required />
              </div>
              <div>
                <label className={labelClasses}>Designation</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-shell w-full" placeholder="Founder, Designer, Developer" />
              </div>
              <div>
                <label className={labelClasses}>Company</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-shell w-full" placeholder="Freelance Studio" />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-shell w-full" />
              </div>
              <div>
                <label className={labelClasses}>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-shell w-full" />
              </div>
              <div>
                <label className={labelClasses}>Website</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-shell w-full" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelClasses}>LinkedIn</label>
                <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input-shell w-full" placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className={labelClasses}>GitHub</label>
                <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input-shell w-full" placeholder="https://github.com/..." />
              </div>
              <div>
                <label className={labelClasses}>Portfolio</label>
                <input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} className="input-shell w-full" placeholder="https://yourportfolio.com" />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Bio / About</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input-shell w-full resize-none"
                placeholder="Short professional bio, service focus, and what clients should know."
              />
            </div>

            {/* Business & Bank Details */}
            <div className="pt-5 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Business & Billing Details</h3>
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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    name: user?.name || '',
                    title: user?.title || '',
                    company: user?.company || '',
                    phone: user?.phone || '',
                    location: user?.location || '',
                    website: user?.website || '',
                    linkedin: user?.linkedin || '',
                    github: user?.github || '',
                    portfolio: user?.portfolio || '',
                    bio: user?.bio || '',
                    bankAccountName: user?.bankAccountName || '',
                    bankAccountNumber: user?.bankAccountNumber || '',
                    ifscCode: user?.ifscCode || '',
                    upiId: user?.upiId || '',
                    gstNumber: user?.gstNumber || '',
                    businessRegistrationNumber: user?.businessRegistrationNumber || '',
                  })
                  setAvatar(null)
                }}
                className="btn-secondary"
              >
                Reset
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={16} /> {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </SurfaceCard>
      </div>

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
              <p className="text-lg font-semibold text-slate-50">Account links</p>
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
