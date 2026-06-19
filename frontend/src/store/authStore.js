import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(persist(
  (set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
    verifyUser: () => set((state) => ({
      user: state.user ? { ...state.user, isVerified: true } : null
    })),
  }),
  { name: 'auth-storage' }
))

export default useAuthStore