import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/axios'

const SUGGESTIONS = [
  { text: '📊 Dashboard Stats', query: 'Show my dashboard summary' },
  { text: '💰 Total Earnings', query: 'How much revenue have I earned?' },
  { text: '💳 List Expenses', query: 'Show my expenses list' },
  { text: '✉️ Draft Reminder Email', query: 'Draft a payment reminder email' },
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! I am your **FreelanceOS Assistant**. Ask me about your revenue, expenses, clients, or request me to draft invoices and email reminders!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (queryText) => {
    const textToSend = queryText || input
    if (!textToSend.trim()) return

    // Clear input if sending from input box
    if (!queryText) setInput('')

    // Add user message
    const userMsgId = Date.now().toString()
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: textToSend }])
    setLoading(true)

    try {
      const { data } = await api.post('/chatbot', { message: textToSend })
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: data.reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Sorry, I encountered an issue retrieving that information. Please verify your connection or try again later.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // A simple markdown formatting helper
  const renderFormattedText = (rawText) => {
    if (!rawText) return ''

    // Split text by code blocks
    const parts = rawText.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      // If code block
      if (part.startsWith('```')) {
        const cleanCode = part.replace(/```(text|javascript|json|html)?/g, '').trim()
        return (
          <pre
            key={index}
            className="bg-gray-950 border border-gray-800 text-indigo-300 font-mono text-xs p-3 rounded-lg overflow-x-auto my-2 whitespace-pre-wrap select-all cursor-copy"
            title="Click to select all code"
          >
            <code>{cleanCode}</code>
          </pre>
        )
      }

      // Format headers, bold text, bullet points
      const lines = part.split('\n')
      return (
        <span key={index}>
          {lines.map((line, lineIdx) => {
            let renderedLine = line

            // Check header (e.g. ### Header)
            const headerMatch = renderedLine.match(/^(#{1,6})\s+(.*)$/)
            if (headerMatch) {
              const level = headerMatch[1].length
              const text = headerMatch[2]
              const headerClasses =
                level === 3 ? 'text-sm font-bold text-white mt-2 mb-1 block' : 'font-semibold text-white mt-1 block'
              return <span key={lineIdx} className={headerClasses}>{text}</span>
            }

            // Check list items
            const listMatch = renderedLine.match(/^([-*])\s+(.*)$/)
            if (listMatch) {
              const content = listMatch[2]
              return (
                <span key={lineIdx} className="pl-4 py-0.5 flex items-start gap-1 text-gray-300">
                  <span className="text-indigo-400 font-bold select-none">•</span>
                  <span>{parseInlineBold(content)}</span>
                </span>
              )
            }

            return (
              <span key={lineIdx} className="block min-h-[4px]">
                {parseInlineBold(renderedLine)}
              </span>
            )
          })}
        </span>
      )
    })
  }

  const parseInlineBold = (text) => {
    // Splits by **bold** tags
    const boldParts = text.split(/(\*\*.*?\*\*)/g)
    return boldParts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-indigo-300">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-[380px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-100px)] bg-gray-900/95 border border-gray-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40 px-4 py-4 border-b border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Sparkles size={16} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">FreelanceOS Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-semibold text-emerald-400 select-none">AI Active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/60 p-1.5 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-gray-800/70 border border-gray-700/50 text-gray-200 rounded-bl-none'
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex items-center gap-1.5 bg-gray-800/40 border border-gray-800/60 w-16 p-3 rounded-2xl rounded-bl-none">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-3 py-2 border-t border-gray-805/40 bg-gray-900/40 overflow-x-auto flex gap-2 no-scrollbar scroll-smooth">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug.text}
                  onClick={() => handleSend(sug.query)}
                  disabled={loading}
                  className="whitespace-nowrap bg-gray-800 hover:bg-indigo-600/20 hover:text-indigo-400 border border-gray-750 hover:border-indigo-500/30 text-gray-300 text-xs px-3 py-1.5 rounded-full transition-all shrink-0 disabled:opacity-50"
                >
                  {sug.text}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-gray-800/80 bg-gray-950/40 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about your business..."
                className="flex-1 bg-gray-900 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 border border-gray-800 focus:border-indigo-500 focus:outline-none transition-all text-xs"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition duration-300 shadow-md disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/40 focus:outline-none transition-shadow duration-300"
        title="Open FreelanceOS Assistant"
      >
        <motion.div
          key={isOpen ? 'close' : 'open'}
          initial={{ rotate: -45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.div>
      </motion.button>
    </div>
  )
}
