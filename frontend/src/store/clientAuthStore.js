import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useClientAuthStore = create(persist(
  (set) => ({
    client: null,
    token: null,
    setAuth: (client, token) => set({ client, token }),
    logout: () => set({ client: null, token: null }),
    updateProfile: (updatedFields) => set((state) => ({
      client: state.client ? { ...state.client, ...updatedFields } : null
    })),
  }),
  { name: 'client-auth-storage' }
))

export default useClientAuthStore
