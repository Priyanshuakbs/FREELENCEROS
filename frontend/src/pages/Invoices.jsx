import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, X, CheckCircle, Download, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    client: '', project: '', tax: 18, dueDate: '', notes: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  })
  const [loading, setLoading] = useState(false)
  const [aiModal, setAiModal] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [aiHourlyRate, setAiHourlyRate] = useState(1500)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProject, setAiProject] = useState('')

  useEffect(() => { fetchInvoices(); fetchClients(); fetchProjects() }, [])

  const fetchInvoices = async () => {
    try { const { data } = await api.get('/invoices'); setInvoices(data.invoices) }
    catch { toast.error('Failed to load') }
  }
  const fetchClients = async () => {
    try { const { data } = await api.get('/clients'); setClients(data.clients) } catch {}
  }
  const fetchProjects = async () => {
    try { const { data } = await api.get('/projects'); setProjects(data.projects) } catch {}
  }

  const updateItem = (index, field, value) => {
    const items = [...form.items]
    items[index][field] = value
    if (field === 'quantity' || field === 'rate') {
      items[index].amount = items[index].quantity * items[index].rate
    }
    setForm({ ...form, items })
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, amount: 0 }] })
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })

  const subtotal = form.items.reduce((acc, item) => acc + item.amount, 0)
  const total = subtotal + (subtotal * form.tax) / 100

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/invoices', form)
      toast.success('Invoice created!')
      setShowModal(false)
      setForm({ client: '', project: '', tax: 18, dueDate: '', notes: '', items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] })
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    } finally { setLoading(false) }
  }

  const handleStatusUpdate = async (id, status) => {
    try { await api.patch(`/invoices/${id}/status`, { status }); toast.success(`Marked as ${status}!`); fetchInvoices() }
    catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete invoice?')) return
    try { await api.delete(`/invoices/${id}`); toast.success('Deleted!'); if (selected?._id === id) setSelected(null); fetchInvoices() }
    catch { toast.error('Failed to delete') }
  }

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) return toast.error('Description likho!')
    setAiLoading(true)
    try {
      const { data } = await api.post('/ai/generate-invoice', { description: aiDescription, projectId: aiProject, hourlyRate: aiHourlyRate })
      setForm(prev => ({ ...prev, items: data.items, project: aiProject || prev.project }))
      setAiModal(false)
      setShowModal(true)
      setAiDescription('')
      toast.success('AI ne invoice items generate kar diye!')
    } catch { toast.error('AI generation failed') }
    finally { setAiLoading(false) }
  }

  const statusThemeMap = {
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-10 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Invoices</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
              Draft receipts, manage invoice statuses, and auto-generate billing lists
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setAiModal(true)} 
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition duration-200 shadow-md shadow-purple-500/10 active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="animate-pulse" /> AI Generate
            </button>
            <button 
              onClick={() => setShowModal(true)} 
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition duration-200 shadow-md shadow-indigo-500/10 active:scale-95 cursor-pointer"
            >
              <Plus size={14} /> New Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['draft', 'sent', 'paid', 'overdue'].map((s) => (
            <div key={s} className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-4.5 backdrop-blur-md shadow-lg">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider capitalize">{s}</p>
              <p className="text-2xl font-black text-white mt-1.5">{invoices.filter(i => i.status === s).length}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl shadow-xl overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
              <Sparkles size={36} className="text-purple-400 opacity-40 animate-pulse" />
              <p className="text-base font-bold text-white">No invoices created yet</p>
              <p className="text-xs text-gray-500 leading-normal mb-2">Create professional billing lists manually or try our advanced AI generator.</p>
              <button 
                onClick={() => setAiModal(true)}
                className="bg-purple-600/10 hover:bg-purple-650/20 text-purple-400 border border-purple-500/20 text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Try AI Invoice Generator
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {invoices.map((invoice) => (
                <div key={invoice._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.01] transition group">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-bold text-white text-sm">{invoice.invoiceNumber}</p>
                    <div className="flex items-center gap-2.5 text-xs text-gray-400 flex-wrap">
                      <span className="font-medium text-gray-300">{invoice.client?.name}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-semibold">₹{invoice.total?.toFixed(0)}</span>
                      {invoice.dueDate && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-gray-500">Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusThemeMap[invoice.status] || 'bg-gray-800 text-gray-400'}`}>
                      {invoice.status}
                    </span>
                    
                    {invoice.status !== 'paid' && (
                      <button 
                        onClick={() => handleStatusUpdate(invoice._id, 'paid')} 
                        className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition border border-transparent hover:border-emerald-500/20"
                        title="Mark Paid"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <a 
                      href={`${import.meta.env.VITE_API_URL}/invoices/${invoice._id}/pdf`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition border border-transparent hover:border-white/10"
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </a>
                    <button 
                      onClick={() => setSelected(invoice)} 
                      className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition border border-transparent hover:border-white/10"
                      title="Preview"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice._id)} 
                      className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition border border-transparent hover:border-red-500/20"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-[#111118] border border-white/[0.06] rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300">
              
              <div className="flex justify-between items-start mb-8 gap-4 border-b border-white/[0.04] pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{selected.invoiceNumber}</h2>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    Due Date: {selected.dueDate ? new Date(selected.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={`${import.meta.env.VITE_API_URL}/invoices/${selected._id}/pdf`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md"
                  >
                    <Download size={13} /> Download PDF
                  </a>
                  <button 
                    onClick={() => setSelected(null)} 
                    className="p-1.5 text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-lg transition ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-medium">
                <div className="space-y-1">
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Bill To:</p>
                  <p className="text-white text-sm font-extrabold">{selected.client?.name}</p>
                  <p className="text-gray-400">{selected.client?.email}</p>
                </div>
                {selected.project && (
                  <div className="space-y-1 text-right">
                    <p className="text-gray-500 font-bold uppercase tracking-wider">Project Reference:</p>
                    <p className="text-white text-sm font-extrabold">{selected.project?.title}</p>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto mb-8 border border-white/[0.03] rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-gray-300">
                    {selected.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-semibold text-white">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">₹{item.rate}</td>
                        <td className="px-4 py-3 text-right font-bold text-white">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.04]">
                <div className="w-64 space-y-2 text-xs font-medium text-gray-400 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white">₹{selected.subtotal?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({selected.tax}%):</span>
                    <span className="text-white">₹{((selected.subtotal * selected.tax) / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/[0.04]">
                    <span>Total Bill:</span>
                    <span className="text-indigo-400">₹{selected.total?.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="mt-8 p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Notes</p>
                  <p className="text-xs text-gray-400 leading-normal">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {aiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111118]/90 border border-purple-800/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-400 animate-pulse" /> AI Invoice Generator
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Describe work to generate items breakdown</p>
              </div>
              <button 
                onClick={() => setAiModal(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] rounded-xl transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Work Outline Description *</label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={4}
                  placeholder="e.g. Designed and developed the front-end layout for user onboarding pages..."
                  className="w-full bg-[#0a0a0f]/80 text-white text-xs rounded-xl px-4 py-2.5 border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-600 resize-none font-medium"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Project Reference</label>
                  <select 
                    value={aiProject} 
                    onChange={(e) => setAiProject(e.target.value)} 
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Hourly Rate (₹)</label>
                  <input 
                    type="number" 
                    value={aiHourlyRate} 
                    onChange={(e) => setAiHourlyRate(Number(e.target.value))} 
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-purple-500 focus:outline-none placeholder-gray-600 font-semibold" 
                  />
                </div>
              </div>
              
              <div className="bg-purple-500/[0.03] border border-purple-500/10 rounded-xl p-3.5">
                <p className="text-purple-400 text-[10px] leading-relaxed font-semibold">
                  💡 <strong>Tip:</strong> Provide details about specific modules, hours, or page counts to receive more precise breakdown values.
                </p>
              </div>

              <button 
                onClick={handleAIGenerate} 
                disabled={aiLoading || !aiDescription.trim()} 
                className="w-full mt-2 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-550 hover:to-indigo-550 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-md shadow-purple-500/10 active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {aiLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AI Generating...</>
                ) : (
                  <><Sparkles size={14} /> Generate Invoice Items</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111118]/90 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">New Invoice</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Specify client details, items, and tax rates</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] rounded-xl transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Client *</label>
                  <select 
                    value={form.client} 
                    onChange={(e) => setForm({ ...form, client: e.target.value })} 
                    required 
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Project</label>
                  <select 
                    value={form.project} 
                    onChange={(e) => setForm({ ...form, project: e.target.value })} 
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Line Items</label>
                  <button 
                    type="button" 
                    onClick={addItem} 
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    + Add Item Row
                  </button>
                </div>
                
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center bg-[#0a0a0f]/40 p-2 border border-white/[0.02] rounded-xl">
                      <input 
                        type="text" 
                        placeholder="Item Description" 
                        value={item.description} 
                        onChange={(e) => updateItem(i, 'description', e.target.value)} 
                        className="col-span-5 bg-[#0a0a0f]/80 text-white text-xs rounded-lg px-3 py-2 border border-white/[0.03] focus:border-indigo-500 focus:outline-none placeholder-gray-600" 
                        required 
                      />
                      <input 
                        type="number" 
                        placeholder="Qty" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} 
                        className="col-span-2 bg-[#0a0a0f]/80 text-white text-xs rounded-lg px-3 py-2 border border-white/[0.03] focus:border-indigo-500 focus:outline-none text-right" 
                      />
                      <input 
                        type="number" 
                        placeholder="Rate" 
                        value={item.rate} 
                        onChange={(e) => updateItem(i, 'rate', Number(e.target.value))} 
                        className="col-span-2 bg-[#0a0a0f]/80 text-white text-xs rounded-lg px-3 py-2 border border-white/[0.03] focus:border-indigo-500 focus:outline-none text-right" 
                      />
                      <div className="col-span-2 bg-[#0a0a0f]/80 border border-white/[0.03] text-gray-300 text-xs rounded-lg px-3 py-2 text-right font-bold">
                        ₹{item.amount}
                      </div>
                      
                      {form.items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeItem(i)} 
                          className="col-span-1 text-red-400 hover:text-red-300 flex items-center justify-center hover:bg-red-500/10 p-1 rounded transition"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">GST (%)</label>
                  <input 
                    type="number" 
                    value={form.tax} 
                    onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} 
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none font-semibold" 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Due Date</label>
                  <input 
                    type="date" 
                    value={form.dueDate} 
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })} 
                    className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none text-xs" 
                  />
                </div>
              </div>

              <div className="bg-[#0a0a0f] border border-white/[0.03] rounded-2xl p-4 text-right space-y-1.5 text-xs font-semibold text-gray-400">
                <p>Subtotal: <strong className="text-white font-bold ml-1">₹{subtotal.toFixed(0)}</strong></p>
                <p>GST ({form.tax}%): <strong className="text-white font-bold ml-1">₹{((subtotal * form.tax) / 100).toFixed(0)}</strong></p>
                <p className="text-lg font-black text-white pt-2 border-t border-white/[0.04]">
                  Total: <strong className="text-indigo-400 ml-1">₹{total.toFixed(0)}</strong>
                </p>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Invoice Notes</label>
                <textarea 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                  rows={2} 
                  placeholder="Terms, payment methods..."
                  className="w-full bg-[#0a0a0f]/80 text-white text-sm rounded-xl px-4 py-2.5 border border-white/[0.04] focus:border-indigo-500 focus:outline-none placeholder-gray-600 resize-none font-medium" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-bold py-3 rounded-xl transition duration-200 shadow-md disabled:opacity-50 text-sm active:scale-95 cursor-pointer"
              >
                {loading ? 'Generating Invoice...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}