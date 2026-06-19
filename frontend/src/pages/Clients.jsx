import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', allowLogin: false, password: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    try {
      const { data } = await api.get('/clients')
      setClients(data.clients)
    } catch {
      toast.error('Failed to load clients')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/clients/${editing._id}`, form)
        toast.success('Client updated!')
      } else {
        await api.post('/clients', form)
        toast.success('Client added!')
      }
      setShowModal(false)
      setEditing(null)
      setForm({ name: '', email: '', phone: '', company: '', address: '', allowLogin: false, password: '' })
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (client) => {
    setEditing(client)
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      allowLogin: !!client.user,
      password: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Client deleted!')
      fetchClients()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'C'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 p-6 md:p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Clients</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
              Manage accounts, details, and active directory lists
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', company: '', address: '', allowLogin: false, password: '' }); setShowModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-indigo-500/10 active:scale-95 shrink-0"
          >
            <Plus size={16} /> Add Client
          </button>
        </div>

        {/* Clients Directory */}
        {clients.length === 0 ? (
          <div className="bg-[#111118]/65 border border-white/[0.04] rounded-2xl p-12 text-center text-gray-400 max-w-md mx-auto mt-12 backdrop-blur shadow-xl">
            <Users className="mx-auto mb-4 text-indigo-400 opacity-40 animate-pulse" size={42} />
            <p className="text-lg font-bold text-white mb-1">No clients registered yet</p>
            <p className="text-xs text-gray-500 font-medium mb-6">Build your client contacts to start invoicing and projects.</p>
            <button
              onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', company: '', address: '', allowLogin: false, password: '' }); setShowModal(true) }}
              className="bg-indigo-600/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-550/20 text-xs font-bold px-4.5 py-2 rounded-xl transition active:scale-95"
            >
              Add First Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div 
                key={client._id} 
                className="bg-[#111118]/60 border border-white/[0.04] hover:border-indigo-500/35 hover:shadow-indigo-500/[0.03] rounded-2xl p-6 transition-all duration-300 backdrop-blur-md group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base truncate">{client.name}</h3>
                      {client.company && (
                        <p className="text-xs text-indigo-400 font-semibold tracking-wide uppercase mt-0.5 truncate">
                          {client.company}
                        </p>
                      )}
                      {client.user && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider uppercase">
                            🔑 Portal Active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions (visible always, highlighted on hover) */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    <button 
                      onClick={() => handleEdit(client)} 
                      className="p-1.5 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white rounded-lg border border-white/[0.04] text-gray-400 transition"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleDelete(client._id)} 
                      className="p-1.5 bg-red-500/[0.04] hover:bg-red-500/10 hover:text-red-300 rounded-lg border border-red-500/10 text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-2.5 pt-4 border-t border-white/[0.03] text-xs font-medium text-gray-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-gray-650">📧</span>
                    <a href={`mailto:${client.email}`} className="hover:text-indigo-400 transition truncate">{client.email}</a>
                    {client.user && (
                      <span className="text-[9px] text-emerald-500 font-extrabold uppercase ml-1" title="This email is used to log in">
                        (Login ID)
                      </span>
                    )}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-650">📞</span>
                      <span className="text-gray-305">{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 max-h-12 overflow-hidden text-gray-500">
                      <span className="text-gray-650">📍</span>
                      <span className="truncate max-w-[200px]">{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111118]/90 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {editing ? 'Edit Client Details' : 'Add New Client'}
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  {editing ? 'Update client details' : 'Save client contact directory'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] rounded-xl transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {['name', 'email', 'phone', 'company', 'address'].map((field) => (
                <div key={field}>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block capitalize">
                    {field === 'phone' ? 'Phone Number' : field} { (field === 'name' || field === 'email') && <span className="text-red-500">*</span> }
                  </label>
                  {field === 'address' ? (
                    <textarea
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      rows={2}
                      className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650 resize-none"
                    />
                  ) : (
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      required={field === 'name' || field === 'email'}
                      className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
                    />
                  )}
                </div>
              ))}

              {/* Login Credentials Option */}
              <div className="pt-2 border-t border-white/[0.04]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowLogin}
                    onChange={(e) => setForm({ ...form, allowLogin: e.target.checked })}
                    className="rounded bg-[#0a0a0f]/80 border-white/[0.04] text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 focus:outline-none w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-300 text-xs font-bold uppercase tracking-wider select-none">Grant Client Login Access</span>
                </label>
              </div>

              {form.allowLogin && (
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                    Password { !editing && <span className="text-red-500">*</span> }
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                    placeholder={editing ? "Leave blank to keep current" : "Min 6 characters"}
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-650"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-bold py-3 rounded-xl transition duration-200 shadow-md disabled:opacity-50 text-sm active:scale-95"
              >
                {loading ? 'Saving Changes...' : editing ? 'Update Client' : 'Add Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}