import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Send, Sparkles, X } from 'lucide-react'
import api from '../lib/axios'

const SUGGESTIONS = [
  { label: 'Dashboard Summary', query: 'Show my dashboard summary' },
  { label: 'Revenue Snapshot', query: 'How much revenue have I earned?' },
  { label: 'Expense Overview', query: 'Show my expenses list' },
  { label: 'Payment Reminder', query: 'Draft a payment reminder email' },
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! I am your FreelanceOS Assistant. Ask me about revenue, expenses, invoices, or drafting client messages.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [isOpen, messages])

  const handleSend = async (queryText) => {
    const textToSend = queryText || input
    if (!textToSend.trim()) return

    if (!queryText) setInput('')

    const userId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: userId, sender: 'user', text: textToSend }])
    setLoading(true)

    try {
      const { data } = await api.post('/chatbot', { message: textToSend })
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: 'bot', text: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: 'Sorry, I ran into an issue while fetching that. Please try again in a moment.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 250, damping: 24 }}
            className="flex h-[560px] w-[400px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/92 shadow-2xl backdrop-blur-2xl"
          >
            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_36%)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-50">FreelanceOS Assistant</p>
                    <p className="text-xs text-slate-400">Workspace copilot for billing and ops</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[84%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                        : 'border border-white/10 bg-white/[0.04] text-slate-200'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:0.3s]" />
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 px-3 py-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSend(item.query)}
                    disabled={loading}
                    className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.07]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                  placeholder="Ask about clients, revenue, invoices..."
                  disabled={loading}
                  className="input-shell flex-1"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="btn-primary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_28px_50px_-24px_rgba(99,102,241,0.9)]"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </motion.button>
    </div>
  )
}
