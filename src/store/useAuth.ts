import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession, Profile } from '@/types/database'
import { logger } from '@/lib/logger'


// ============================================
// AUTH STATE INTERFACE
// ============================================

interface AuthState {
  // State
  user: UserSession | null
  isAuthenticated: boolean
  isLoading: boolean
  isRecovering: boolean
  error: string | null

  // Actions
  login: (email: string, password?: string, role?: 'student' | 'provider') => Promise<void>
  signup: (email: string, password: string, name: string, role: 'student' | 'provider') => Promise<void>
  logout: () => Promise<void>
  recoverUserSession: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>
  clearError: () => void
  setError: (error: string | null) => void
}

// ============================================
// ZUSTAND STORE
// ============================================

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isRecovering: true,
      error: null,

      // ============================================
      // LOGIN ACTION
      // ============================================
      login: async (email: string, _password?: string, mockRole?: 'student' | 'provider') => {
        set({ isLoading: true, error: null })
        try {
          // Mock login flow
          await new Promise(resolve => setTimeout(resolve, 800))
          set({
            isAuthenticated: true,
            user: {
              id: 'demo-user-123',
              email: email || 'demo@zivaro.com',
              role: mockRole || 'student',
              name: 'Demo User',
              onboarding_completed: true,
              metadata: {}
            },
            error: null
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Login failed'
          set({
            isAuthenticated: false,
            user: null,
            error: errorMessage
          })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // SIGNUP ACTION
      // ============================================
      signup: async (email: string, _password: string, name: string, role: 'student' | 'provider') => {
        set({ isLoading: true, error: null })
        try {
          // Mock signup flow
          await new Promise(resolve => setTimeout(resolve, 800))
          set({
            isAuthenticated: true,
            user: {
              id: 'demo-user-123',
              email: email,
              role: role,
              name: name,
              onboarding_completed: true,
              metadata: {}
            },
            error: null
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Signup failed'
          set({
            isAuthenticated: false,
            user: null,
            error: errorMessage
          })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // LOGOUT ACTION
      // ============================================
      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          set({
            isAuthenticated: false,
            user: null,
            error: null
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Logout failed'
          set({ error: errorMessage })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // SESSION RECOVERY ACTION
      // ============================================
      recoverUserSession: async () => {
        set({ isRecovering: true, error: null })
        try {
          // Just verify if the state holds a user from local storage (Zustand persist)
          const state = get()
          
          console.log('[Auth Recovery]', {
            user: state.user,
            isAuthenticated: state.isAuthenticated
          })

          if (state.user) {
            set({ isAuthenticated: true })
          } else {
            set({ isAuthenticated: false })
          }
        } catch (err: any) {
          logger.error('Session recovery error:', err)
          set({
            isAuthenticated: false,
            user: null,
            error: null
          })
        } finally {
          set({ isRecovering: false })
        }
      },

      // ============================================
      // REFRESH PROFILE ACTION
      // ============================================
      refreshProfile: async () => {
        // Mock refresh - do nothing
      },

      // ============================================
      // UPDATE PROFILE ACTION
      // ============================================
      updateUserProfile: async (updates: Partial<Profile>) => {
        const state = get()
        if (!state.user) {
          throw new Error('No user session')
        }

        set({ isLoading: true, error: null })
        try {
          await new Promise(resolve => setTimeout(resolve, 500))
          set({
            user: { ...state.user, ...updates }
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to update profile'
          set({ error: errorMessage })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // ERROR MANAGEMENT ACTIONS
      // ============================================
      clearError: () => set({ error: null }),
      setError: (error: string | null) => set({ error })
    }),

    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
