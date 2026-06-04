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
  updateProfile as updateProfileInDb,
  checkEmailExists,
  verifyEmailOtp,
  requestPasswordReset,
  updatePassword
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
  hasShownSplash: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: 'student' | 'provider') => Promise<{ needsVerification: boolean }>
  verifyOtp: (email: string, token: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (password: string) => Promise<void>
  logout: () => Promise<void>
  recoverUserSession: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>
  setSplashShown: (shown: boolean) => void
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
      hasShownSplash: false,
      error: null,

      // ============================================
      // LOGIN ACTION
      // ============================================
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          // 1. Verify if the email is registered
          let exists = true
          try {
            exists = await checkEmailExists(email)
          } catch (e) {
            console.warn('[useAuth] Email existence check failed/skipped:', e)
          }

          if (!exists) {
            throw new Error('No account found with this email.')
          }

          // 2. Real Supabase Login
          const data = await signInUser(email, password)
          if (!data || !data.user) throw new Error('No user data returned from Supabase')

          // Build full user session from profile
          const userSession = await buildUserSession(data.user.id, data.user.email || '')
          if (!userSession) throw new Error('Failed to retrieve user profile from database')

          set({
            isAuthenticated: true,
            user: userSession,
            hasShownSplash: false,
            error: null
          })
        } catch (err: any) {
          let errorMessage = err.message || 'Login failed'
          if (errorMessage === 'Invalid login credentials') {
            errorMessage = 'Wrong password'
          }
          set({
            isAuthenticated: false,
            user: null,
            hasShownSplash: false,
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
          // 1. Verify if email already exists
          let exists = false
          try {
            exists = await checkEmailExists(email)
          } catch (e) {
            console.warn('[useAuth] Email existence check failed/skipped:', e)
          }

          if (exists) {
            throw new Error('Account already exists. Please sign in.')
          }

          // 2. Real Supabase Signup
          const data = await signUpUser(email, password, name, role)
          if (!data || !data.user) throw new Error('Signup failed')

          const needsVerification = data.session === null

          if (needsVerification) {
            // Keep user logged out on the client side since verification is pending
            set({
              isAuthenticated: false,
              user: null,
              hasShownSplash: false,
              error: null
            })
            return { needsVerification: true }
          }

          // Set user session if automatically confirmed
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
            hasShownSplash: false,
            error: null
          })
          return { needsVerification: false }
        } catch (err: any) {
          let errorMessage = err.message || 'Signup failed'
          if (
            errorMessage.toLowerCase().includes('already registered') ||
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('email_exists')
          ) {
            errorMessage = 'Account already exists. Please sign in.'
          }
          set({
            isAuthenticated: false,
            user: null,
            hasShownSplash: false,
            error: errorMessage
          })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // VERIFY OTP ACTION
      // ============================================
      verifyOtp: async (email: string, token: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await verifyEmailOtp(email, token)
          if (!data || !data.user) throw new Error('Verification failed. Invalid code.')

          // After confirmation, build/get profile
          const userSession = await buildUserSession(data.user.id, data.user.email || email)
          if (!userSession) throw new Error('Failed to retrieve user profile from database')

          set({
            isAuthenticated: true,
            user: userSession,
            hasShownSplash: false,
            error: null
          })
        } catch (err: any) {
          const errorMessage = err.message || 'Verification failed. Invalid code.'
          set({ error: errorMessage })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // FORGOT PASSWORD ACTION
      // ============================================
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null })
        try {
          const { success, error: resetErr } = await requestPasswordReset(email)
          if (!success) {
            throw resetErr || new Error('Failed to send reset link.')
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to send reset link.'
          set({ error: errorMessage })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      // RESET PASSWORD ACTION
      // ============================================
      resetPassword: async (password: string) => {
        set({ isLoading: true, error: null })
        try {
          const { success, error: updateErr } = await updatePassword(password)
          if (!success) {
            throw updateErr || new Error('Failed to update password.')
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to update password.'
          set({ error: errorMessage })
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
            hasShownSplash: false,
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

          // If no session is found, clear state to prevent stale login loops
          set({
            isAuthenticated: false,
            user: null,
            hasShownSplash: false,
            error: null
          })
        } catch (err: any) {
          logger.error('Session recovery error (e.g. stale refresh token or network error):', err)
          // Explicitly clear auth states to prevent half-logged in loops
          set({
            isAuthenticated: false,
            user: null,
            hasShownSplash: false,
            error: null
          })
          try {
            // Also call signOutUser to clear client-side token storage in Supabase
            await signOutUser()
          } catch (signOutErr) {
            console.warn('Sign out during session recovery failure failed silently:', signOutErr)
          }
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
      setSplashShown: (shown: boolean) => set({ hasShownSplash: shown }),
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
