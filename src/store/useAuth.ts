import { create } from 'zustand'
import { persist } from 'zustand/middleware'
/*
import {
  signInUser,
  signInWithGoogle,
  signUpUser,
  signOutUser,
  recoverSession,
  buildUserSession,
  getProfile,
  updateProfile,
  isSupabaseConfigured as checkSupabaseConfig
} from '@/services/supabase/auth'
*/
// import type { UserSession, Profile } from '@/types/database'
import type { UserSession, Profile } from '@/types/database' // KEEP type imports as they might be used in state interface
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
  login: (email: string, password: string) => Promise<void>
  googleLogin: () => Promise<void>
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
      isRecovering: false,
      error: null,

      // ============================================
      // LOGIN ACTION
      // ============================================
      login: async (email: string, password: string) => {
        // TEMP DEMO MODE
        set({
          isAuthenticated: true,
          user: {
            id: 'demo-user-123',
            email: email || 'demo@zivaro.com',
            role: 'student',
            name: 'Demo User',
            onboarding_completed: true,
            metadata: {}
          },
          isLoading: false,
          error: null
        })
        return

        /*
        set({ isLoading: true, error: null })
        try {
          if (!checkSupabaseConfig()) {
            throw new Error('Supabase is not configured. Please check your environment variables.')
          }

          // Sign in with Supabase
          const data = await signInUser(email, password)

          if (data.user) {
            // Build complete user session with profile data
            const userSession = await buildUserSession(data.user.id, data.user.email || '')

            if (!userSession) {
              throw new Error('Failed to load user profile')
            }

            set({
              isAuthenticated: true,
              user: userSession,
              error: null
            })
          }
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
        */
      },

      // ============================================
      // GOOGLE LOGIN ACTION
      // ============================================
      googleLogin: async () => {
        // TEMP DEMO MODE
        set({
          isAuthenticated: true,
          user: {
            id: 'demo-user-123',
            email: 'google@zivaro.com',
            role: 'student',
            name: 'Google Demo User',
            onboarding_completed: true,
            metadata: {}
          },
          isLoading: false,
          error: null
        })
        return

        /*
        set({ isLoading: true, error: null })
        try {
          if (!checkSupabaseConfig()) {
            throw new Error('Supabase is not configured. Please check your environment variables.')
          }
          const { error } = await signInWithGoogle()
          if (error) throw error
        } catch (err: any) {
          const errorMessage = err.message || 'Google login failed'
          set({ error: errorMessage, isLoading: false })
          throw err
        }
        */
        // No finally block to reset isLoading here since the browser redirects away
      },

      // ============================================
      // SIGNUP ACTION
      // ============================================
      signup: async (email: string, password: string, name: string, role: 'student' | 'provider') => {
        // TEMP DEMO MODE
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
          isLoading: false,
          error: null
        })
        return

        /*
        set({ isLoading: true, error: null })
        try {
          if (!checkSupabaseConfig()) {
            throw new Error('Supabase is not configured. Please check your environment variables.')
          }

          // Sign up with Supabase
          // This triggers the database trigger which creates a profile automatically
          const data = await signUpUser(email, password, name, role)

          if (data.user) {
            // Build user session
            const userSession = await buildUserSession(data.user.id, data.user.email || '')

            if (!userSession) {
              throw new Error('Failed to create user profile')
            }

            set({
              isAuthenticated: true,
              user: userSession,
              error: null
            })
          }
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
        // TEMP DEMO MODE
        set({
          isAuthenticated: false,
          user: null,
          error: null,
          isLoading: false
        })
        return

        /*
        set({ isLoading: true, error: null })
        try {
          if (checkSupabaseConfig()) {
            await signOutUser()
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
        */
      },

      // ============================================
      // SESSION RECOVERY ACTION
      // ============================================
      recoverUserSession: async () => {
        // TEMP DEMO MODE
        set({
          isAuthenticated: true,
          user: {
            id: 'demo-user-123',
            email: 'demo@zivaro.com',
            role: 'student',
            name: 'Demo User',
            onboarding_completed: true,
            metadata: {}
          },
          isRecovering: false,
          error: null
        })
        return

        /*
        console.log('[useAuth] Starting recoverUserSession. Current state:', {
          isAuthenticated: get().isAuthenticated,
          isRecovering: true,
          user: get().user
        })
        set({ isRecovering: true, error: null })
        try {
          if (!checkSupabaseConfig()) {
            set({ isAuthenticated: false, isRecovering: false })
            return
          }

          const session = await recoverSession()
          console.log('[useAuth] Recovered session from Supabase:', session ? 'Exists' : 'Null', session)

          if (session?.user) {
            console.log('[useAuth] Session user found:', session.user)
            // Build complete user session
            const userSession = await buildUserSession(session.user.id, session.user.email || '')
            console.log('[useAuth] Built user profile session:', userSession)

            if (userSession) {
              set({
                isAuthenticated: true,
                user: userSession,
                error: null
              })
              console.log('[useAuth] Successfully authenticated user with profile')
            } else {
              // Session exists but profile couldn't be loaded (e.g. DB trigger delay during OAuth signup)
              console.warn('[useAuth] Profile not found in database. Using JWT fallback.')
              
              const fallbackSession = {
                id: session.user.id,
                email: session.user.email || '',
                role: 'student' as any,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                onboarding_completed: session.user.user_metadata?.onboarding_completed || false,
                metadata: session.user.user_metadata || {}
              }
              
              set({
                isAuthenticated: true,
                user: fallbackSession,
                error: null
              })
              console.log('[useAuth] State updated with fallback session')
            }
          } else {
            console.log('[useAuth] No active session in Supabase')
            // No active session
            set({
              isAuthenticated: false,
              user: null
            })
          }
        } catch (err: any) {
          logger.error('Session recovery error:', err)
          set({
            isAuthenticated: false,
            user: null,
            error: null // Don't show recovery errors to user
          })
        } finally {
          console.log('[useAuth] Finished recoverUserSession. Final state:', {
            isAuthenticated: get().isAuthenticated,
            isRecovering: false
          })
          set({ isRecovering: false })
        }
        */
      },

      // ============================================
      // REFRESH PROFILE ACTION
      // ============================================
      refreshProfile: async () => {
        // TEMP DEMO MODE
        return

        /*
        const state = get()
        if (!state.user) return

        try {
          if (!checkSupabaseConfig()) return

          const profile = await getProfile(state.user.id)
          if (profile) {
            set({
              user: {
                ...state.user,
                name: profile.name || state.user.name,
                role: profile.role,
                onboarding_completed: profile.onboarding_completed,
                metadata: profile.metadata
              }
            })
          }
        } catch (err) {
          logger.error('Error refreshing profile:', err)
        }
        */
      },

      // ============================================
      // UPDATE PROFILE ACTION
      // ============================================
      updateUserProfile: async (updates: Partial<Profile>) => {
        // TEMP DEMO MODE
        const state = get()
        if (state.user) {
          set({
            user: { ...state.user, ...updates }
          })
        }
        return

        /*
        const state = get()
        if (!state.user) {
          throw new Error('No user session')
        }

        set({ isLoading: true, error: null })
        try {
          if (!checkSupabaseConfig()) {
            throw new Error('Supabase is not configured')
          }

          const updated = await updateProfile(state.user.id, updates)

          if (updated) {
            set({
              user: {
                ...state.user,
                name: updated.name || state.user.name,
                role: updated.role,
                onboarding_completed: updated.onboarding_completed,
                metadata: updated.metadata
              }
            })
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to update profile'
          set({ error: errorMessage })
          throw err
        } finally {
          set({ isLoading: false })
        }
        */
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
