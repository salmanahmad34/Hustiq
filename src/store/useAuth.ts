import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession, Profile } from '@/types/database'
import { logger } from '@/lib/logger'
import { 
  signInUser, 
  signUpUser, 
  signOutUser, 
  recoverSession, 
  buildUserSession, 
  updateProfile as updateProfileInDb 
} from '@/services/supabase/auth'


// ============================================
// AUTH STATE INTERFACE
// ============================================

interface AuthState {
  // State
  user: UserSession | null
  isAuthenticated: boolean
  isLoading: boolean
  isRecovering: boolean
  isSplashActive: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: 'student' | 'provider') => Promise<void>
  logout: () => Promise<void>
  recoverUserSession: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>
  setSplashActive: (active: boolean) => void
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
      isSplashActive: false,
      error: null,

      // ============================================
      // LOGIN ACTION
      // ============================================
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          // Real Supabase Login
          const data = await signInUser(email, password)
          if (!data || !data.user) throw new Error('No user data returned from Supabase')

          // Build full user session from profile
          const userSession = await buildUserSession(data.user.id, data.user.email || '')
          if (!userSession) throw new Error('Failed to retrieve user profile from database')

          set({
            isAuthenticated: true,
            user: userSession,
            isSplashActive: true,
            error: null
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Login failed'
          set({
            isAuthenticated: false,
            user: null,
            isSplashActive: false,
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
      signup: async (email: string, password: string, name: string, role: 'student' | 'provider') => {
        set({ isLoading: true, error: null })
        try {
          // Real Supabase Signup
          const data = await signUpUser(email, password, name, role)
          if (!data || !data.user) throw new Error('Signup failed')

          // Set user session
          set({
            isAuthenticated: true,
            user: {
              id: data.user.id,
              email: data.user.email || email,
              role: role,
              name: name,
              onboarding_completed: false,
              metadata: {}
            },
            isSplashActive: true,
            error: null
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Signup failed'
          set({
            isAuthenticated: false,
            user: null,
            isSplashActive: false,
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
          const state = get()
          const isRealSession = state.user && !state.user.id.startsWith('00000000-')
          
          if (isRealSession) {
            await signOutUser()
          } else {
            await new Promise(resolve => setTimeout(resolve, 300))
          }

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
          const session = await recoverSession()
          
          if (session && session.user) {
            const userSession = await buildUserSession(session.user.id, session.user.email || '')
            if (userSession) {
              set({
                isAuthenticated: true,
                user: userSession
              })
              return
            }
          }

          // Fallback to Zustand persisted local state
          const state = get()
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
        const state = get()
        if (!state.user || state.user.id.startsWith('00000000-')) return

        try {
          const userSession = await buildUserSession(state.user.id, state.user.email)
          if (userSession) {
            set({ user: userSession })
          }
        } catch (err) {
          console.error('Failed to refresh profile:', err)
        }
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
          const isRealSession = !state.user.id.startsWith('00000000-')
          
          if (isRealSession) {
            await updateProfileInDb(state.user.id, updates)
          } else {
            await new Promise(resolve => setTimeout(resolve, 500))
          }

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
      setSplashActive: (active: boolean) => set({ isSplashActive: active }),
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
