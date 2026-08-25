import { io } from 'socket.io-client'

let socket = null

export const getSocket = () => {
  if (!socket) {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const backendOrigin = rawUrl.replace(/\/api\/?$/, '')

    socket = io(backendOrigin, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('⚡ Socket connected to server:', socket.id)

      // Auto join user or client room if session exists
      const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const clientAuth = JSON.parse(localStorage.getItem('client-auth-storage') || '{}')
      const userId = auth?.state?.user?._id || auth?.state?.user?.id
      const clientId = clientAuth?.state?.client?._id || clientAuth?.state?.client?.id

      if (userId) {
        socket.emit('join-room', userId)
      } else if (clientId) {
        socket.emit('join-room', clientId)
      }
    })

    socket.on('disconnect', () => {
      console.log('⚡ Socket disconnected from server')
    })
  }

  return socket
}

export const joinRoom = (roomId) => {
  const s = getSocket()
  if (s && roomId) {
    s.emit('join-room', roomId)
  }
}

export const joinConversation = (conversationId) => {
  const s = getSocket()
  if (s && conversationId) {
    s.emit('join-conversation', conversationId)
  }
}

export const leaveConversation = (conversationId) => {
  const s = getSocket()
  if (s && conversationId) {
    s.emit('leave-conversation', conversationId)
  }
}

export default getSocket
