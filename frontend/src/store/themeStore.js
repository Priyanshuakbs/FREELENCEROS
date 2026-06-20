import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const setDocumentTheme = (theme) => {
  if (typeof document === 'undefined') return

  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // 'dark' | 'light'
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        setDocumentTheme(next)
      },
      applyTheme: () => {
        setDocumentTheme(get().theme)
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        setDocumentTheme(state?.theme || 'dark')
      },
    }
  )
)

export default useThemeStore
