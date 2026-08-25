import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  MessageSquare,
  Send,
  Search,
  ArrowLeft,
  Briefcase,
  CircleDot,
  Check,
  CheckCheck,
  User,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FolderKanban,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useClientAuthStore from '../store/clientAuthStore'
import { getSocket, joinRoom, joinConversation, leaveConversation } from '../lib/socket'
import AnimatedPage from '../components/AnimatedPage'

export default function Messages() {
  const { conversationId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { user } = useAuthStore()
  const { client } = useClientAuthStore()

  const currentEntityId = user?._id || user?.id || client?._id || client?.id
  const isFreelancer = Boolean(user)

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  // ── Fetch all conversations ────────────────────────────────────────────────
  const fetchConversations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/conversations')
      const convList = res.data.conversations || []
      setConversations(convList)

      // If URL has conversationId, find and set active
      if (conversationId) {
        const found = convList.find((c) => c._id === conversationId)
        if (found) {
          setActiveConversation(found)
        } else {
          fetchSingleConversation(conversationId)
        }
      } else if (convList.length > 0 && window.innerWidth >= 768) {
        setActiveConversation(convList[0])
        navigate(`/messages/${convList[0]._id}`, { replace: true })
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleConversation = async (id) => {
    try {
      const res = await api.get(`/conversations/${id}`)
      if (res.data.conversation) {
        setActiveConversation(res.data.conversation)
      }
    } catch (err) {
      console.error('Failed to fetch conversation:', err)
    }
  }

  // ── Fetch messages for active conversation ─────────────────────────────────
  const fetchMessages = async (id) => {
    try {
      setMessagesLoading(true)
      const res = await api.get(`/conversations/${id}/messages`)
      setMessages(res.data.messages || [])
      // Mark as read
      await api.patch(`/conversations/${id}/read`).catch(() => {})
      // Update local unread counter
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === id) {
            return {
              ...c,
              unreadCounts: {
                ...c.unreadCounts,
                [isFreelancer ? 'freelancer' : 'client']: 0,
              },
            }
          }
          return c
        })
      )
    } catch (err) {
      console.error('Failed to load messages:', err)
      toast.error('Could not load chat messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (conversationId) {
      const found = conversations.find((c) => c._id === conversationId)
      if (found) {
        setActiveConversation(found)
      } else {
        fetchSingleConversation(conversationId)
      }
    }
  }, [conversationId])

  useEffect(() => {
    if (activeConversation?._id) {
      fetchMessages(activeConversation._id)
      joinConversation(activeConversation._id)

      return () => {
        leaveConversation(activeConversation._id)
      }
    }
  }, [activeConversation?._id])

  // ── Socket.IO Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    if (currentEntityId) {
      joinRoom(currentEntityId)
    }

    const handleNewMessage = (newMsg) => {
      const convId = newMsg.conversation?._id || newMsg.conversation

      // If active conversation matches, add message to active view
      if (activeConversation && activeConversation._id === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev
          return [...prev, newMsg]
        })
        api.patch(`/conversations/${convId}/read`).catch(() => {})
      }

      // Update conversations list last message preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === convId) {
            const isMe =
              (newMsg.sender?._id || newMsg.sender)?.toString() === currentEntityId?.toString()
            return {
              ...c,
              lastMessage: newMsg.text,
              lastMessageAt: newMsg.createdAt || new Date().toISOString(),
              unreadCounts: {
                ...c.unreadCounts,
                [isFreelancer ? 'freelancer' : 'client']:
                  isMe || (activeConversation && activeConversation._id === convId)
                    ? 0
                    : (c.unreadCounts?.[isFreelancer ? 'freelancer' : 'client'] || 0) + 1,
              },
            }
          }
          return c
        })
      )
    }

    const handleUserTyping = ({ conversationId: cId }) => {
      if (activeConversation && activeConversation._id === cId) {
        setIsTyping(true)
      }
    }

    const handleUserStopTyping = ({ conversationId: cId }) => {
      if (activeConversation && activeConversation._id === cId) {
        setIsTyping(false)
      }
    }

    const handleConversationUpdated = (updatedConv) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === updatedConv._id)
        if (index >= 0) {
          const next = [...prev]
          next[index] = { ...next[index], ...updatedConv }
          return next
        }
        return [updatedConv, ...prev]
      })
    }

    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleUserTyping)
    socket.on('user-stop-typing', handleUserStopTyping)
    socket.on('conversation-updated', handleConversationUpdated)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleUserTyping)
      socket.off('user-stop-typing', handleUserStopTyping)
      socket.off('conversation-updated', handleConversationUpdated)
    }
  }, [activeConversation, currentEntityId, isFreelancer])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Send Message ───────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault()
    const content = text.trim()
    if (!content || !activeConversation || sending) return

    setSending(true)
    setText('')

    // Emit stop typing
    socketRef.current?.emit('stop-typing', { conversationId: activeConversation._id })

    try {
      const res = await api.post(`/conversations/${activeConversation._id}/messages`, {
        text: content,
      })

      const savedMsg = res.data.message
      setMessages((prev) => [...prev, savedMsg])

      // Update conversations list
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === activeConversation._id) {
            return {
              ...c,
              lastMessage: savedMsg.text,
              lastMessageAt: savedMsg.createdAt,
            }
          }
          return c
        })
      )
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message')
      setText(content) // restore input on failure
    } finally {
      setSending(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getOtherParticipant = (conv) => {
    if (!conv) return { name: 'Chat', subtitle: '', avatar: null, id: null }

    if (isFreelancer) {
      const clientObj = conv.client
      return {
        name: clientObj?.name || 'Client',
        subtitle: clientObj?.company || clientObj?.email || 'Client',
        avatar: null,
        id: clientObj?._id || clientObj,
        role: 'Client',
      }
    } else {
      const freelancerObj = conv.freelancer
      return {
        name: freelancerObj?.name || 'Freelancer',
        subtitle: freelancerObj?.title || freelancerObj?.company || 'Freelancer',
        avatar: freelancerObj?.avatar || null,
        id: freelancerObj?._id || freelancerObj,
        username: freelancerObj?.username,
        role: 'Freelancer',
      }
    }
  }

  const otherUser = useMemo(() => {
    return getOtherParticipant(activeConversation)
  }, [activeConversation, isFreelancer])

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations

    return conversations.filter((c) => {
      const other = getOtherParticipant(c)
      const query = searchQuery.toLowerCase()
      return (
        other.name.toLowerCase().includes(query) ||
        other.subtitle.toLowerCase().includes(query) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(query)) ||
        (c.context?.title && c.context.title.toLowerCase().includes(query))
      )
    })
  }, [conversations, searchQuery, isFreelancer])

  return (
    <AnimatedPage className="page-container h-[calc(100vh-100px)] min-h-[600px] flex flex-col p-2 md:p-6">
      {/* ── Main Chat Shell ── */}
      <div className="flex-1 flex overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl backdrop-blur-2xl">
        
        {/* ── Left Column: Conversations List ── */}
        <div
          className={`w-full md:w-[340px] lg:w-[380px] border-r border-[var(--border)] flex flex-col bg-[var(--bg-panel)] shrink-0 ${
            activeConversation && conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-[var(--text)]">Messages</h1>
                  <p className="text-[11px] text-[var(--text-subtle)]">
                    {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isFreelancer && (
                  <button
                    onClick={() => navigate('/client-dashboard')}
                    className="btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1"
                    title="Client Dashboard"
                  >
                    <FolderKanban size={13} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                )}
                <button
                  onClick={fetchConversations}
                  title="Refresh conversations"
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="input-shell w-full pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 sidebar-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-xs text-[var(--text-subtle)]">Loading chats...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 text-center px-4">
                <p className="text-xs font-medium text-[var(--text-muted)]">No conversations found</p>
                <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                  {searchQuery ? 'Try another search query' : 'Accepted proposals or portfolio inquiries will appear here'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv)
                const isActive = activeConversation?._id === conv._id
                const unread = isFreelancer
                  ? Number(conv.unreadCounts?.freelancer || 0)
                  : Number(conv.unreadCounts?.client || 0)

                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      setActiveConversation(conv)
                      navigate(`/messages/${conv._id}`)
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition duration-150 flex items-start gap-3 border ${
                      isActive
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-[var(--text)] shadow-sm'
                        : 'border-transparent hover:bg-[var(--bg-hover)] text-[var(--text-muted)]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[var(--border)] flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
                        {other.avatar ? (
                          <img
                            src={
                              other.avatar.startsWith('http')
                                ? other.avatar
                                : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${other.avatar}`
                            }
                            alt={other.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          other.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-[var(--text)]'}`}>
                          {other.name}
                        </p>
                        <span className="text-[10px] text-[var(--text-subtle)] shrink-0">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>

                      {/* Context badge if present */}
                      {conv.context?.title && (
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 truncate mb-1 flex items-center gap-1 font-medium">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          {conv.context.title}
                        </p>
                      )}

                      {/* Last Message Preview */}
                      <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-subtle)]'}`}>
                        {conv.lastMessage || 'No messages yet. Say hello!'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Active Conversation Chat ── */}
        <div
          className={`flex-1 flex flex-col bg-[var(--bg-elevated)] ${
            !activeConversation && !conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3 md:p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-panel-strong)] backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => {
                      setActiveConversation(null)
                      navigate('/messages')
                    }}
                    className="md:hidden btn-secondary p-2"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[var(--border)] flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
                    {otherUser.avatar ? (
                      <img
                        src={
                          otherUser.avatar.startsWith('http')
                            ? otherUser.avatar
                            : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${otherUser.avatar}`
                        }
                        alt={otherUser.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      otherUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm md:text-base font-bold text-[var(--text)] truncate">
                        {otherUser.name}
                      </h2>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-subtle)] truncate">{otherUser.subtitle}</p>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {!isFreelancer && (
                    <button
                      onClick={() => navigate('/client-dashboard')}
                      className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-sm"
                      title="View invoices, project files, milestones, and status"
                    >
                      <FolderKanban size={13} />
                      <span className="hidden sm:inline">Client Dashboard</span>
                    </button>
                  )}
                  {!isFreelancer && otherUser.username && (
                    <button
                      onClick={() => navigate(`/portfolio/${otherUser.username}`)}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <User size={13} />
                      <span className="hidden sm:inline">Portfolio</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                  {isFreelancer && activeConversation.lead && (
                    <button
                      onClick={() => navigate(`/leads/${activeConversation.lead._id || activeConversation.lead}`)}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <Briefcase size={13} />
                      <span className="hidden sm:inline">Lead Details</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Proposal / Project Context Banner */}
              {activeConversation.context?.title && (
                <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded-lg bg-indigo-600/10 border border-indigo-600/20 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider shrink-0">
                      {activeConversation.context.type || 'Context'}
                    </span>
                    <span className="font-semibold text-[var(--text)] truncate">
                      {activeConversation.context.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--text-subtle)] text-[11px] shrink-0">
                    {activeConversation.context.budget > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{Number(activeConversation.context.budget).toLocaleString('en-IN')}
                      </span>
                    )}
                    {activeConversation.context.status && (
                      <span className="rounded-full bg-[var(--bg-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[var(--text-muted)] font-medium">
                        {activeConversation.context.status}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 sidebar-scrollbar bg-[var(--bg-soft)]">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-subtle)]">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                      <Sparkles size={26} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text)]">Direct Discussion Started</p>
                    <p className="text-xs text-[var(--text-subtle)] max-w-sm">
                      Send a message to discuss deliverables, scope, milestones, or questions.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const senderId = msg.sender?._id || msg.sender
                    const isSelf = senderId?.toString() === currentEntityId?.toString()

                    return (
                      <div
                        key={msg._id || index}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                            isSelf
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-sm'
                              : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                            {msg.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-[var(--text-subtle)]">
                          <span>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                          {isSelf && (
                            <span>
                              {msg.read ? (
                                <CheckCheck size={12} className="text-indigo-500 inline" />
                              ) : (
                                <Check size={12} className="text-[var(--text-subtle)] inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)] italic">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    {otherUser.name} is typing...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <div className="p-3 md:p-4 border-t border-[var(--border)] bg-[var(--bg-panel-strong)] backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Message ${otherUser.name}...`}
                    className="input-shell flex-1 py-3 px-4 text-sm"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="btn-primary px-4 py-3 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State: No active conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Select a Conversation</h2>
              <p className="text-xs text-[var(--text-subtle)] max-w-sm">
                Choose a conversation from the left to start messaging, or accept a client proposal to open a new chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}
