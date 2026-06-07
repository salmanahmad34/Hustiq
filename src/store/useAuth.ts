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
  verifyEmailOtp,
  requestPasswordReset,
  updatePassword,
  signInWithGoogle,
  getUserProvider
} from '@/services/supabase/auth'
import { useUiStore } from '@/store/uiStore'


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
  loginWithGoogle: (role?: 'student' | 'provider' | 'admin') => Promise<void>
  signup: (email: string, password: string, name: string, role: 'student' | 'provider' | 'admin') => Promise<{ needsVerification: boolean }>
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
          // 1. Verify if the email is registered and check provider
          let provider: string | null = null
          try {
            provider = await getUserProvider(email)
          } catch (e) {
            console.warn('[useAuth] Email check failed/skipped:', e)
          }

          if (!provider) {
            throw new Error('No account found with this email.')
          }

          if (provider === 'google') {
            throw new Error('This account already exists with Google. Please continue with Google Sign In.')
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
      // GOOGLE LOGIN ACTION
      // ============================================
      loginWithGoogle: async (role?: 'student' | 'provider' | 'admin') => {
        set({ isLoading: true, error: null })
        try {
          if (role) {
            localStorage.setItem('oauth_signup_role', role)
            console.log('[Signup] Google signup started with role:', role)
          } else {
            localStorage.removeItem('oauth_signup_role')
            console.log('[useAuth] Google OAuth initiated for login (no role chosen)')
          }

          const { error: oAuthError } = await signInWithGoogle()
          if (oAuthError) throw oAuthError
        } catch (err: any) {
          console.error("Google OAuth Error:", err)
          const errorMessage = err.message || 'Google authentication failed'
          set({ error: errorMessage })
          useUiStore.getState().addToast(errorMessage, 'error')
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ============================================
      signup: async (email: string, password: string, name: string, role: 'student' | 'provider' | 'admin') => {
        set({ isLoading: true, error: null })
        try {
          console.log('[useAuth] Initiating signup process for:', { email, name, role })
          
          // 1. Verify if email already exists and identify provider
          let provider: string | null = null
          try {
            provider = await getUserProvider(email)
          } catch (e: any) {
            console.warn('[useAuth] Email existence check failed/skipped:', e)
          }

          if (provider) {
            let existsError: Error
            if (provider === 'google') {
              existsError = new Error('This account already exists with Google. Please continue with Google Sign In.')
            } else {
              existsError = new Error('Account already exists. Please sign in.')
            }
            console.error('[useAuth] Signup Error: Email is already registered with provider:', provider)
            throw existsError
          }

          // 2. Real Supabase Signup
          const data = await signUpUser(email, password, name, role)
          console.log("Signup response:", data)

          const needsVerification = !data || data.session === null
          console.log('[useAuth] Needs OTP email confirmation:', needsVerification)

          if (needsVerification) {
            // Keep user logged out on the client side since verification is pending
            set({
              isAuthenticated: false,
              user: null,
              hasShownSplash: false,
              error: null
            })
            // Trigger visual Toast alert for success
            useUiStore.getState().addToast('Account created successfully. Please check your email to verify your account.', 'success')
            return { needsVerification: true }
          }

          const userObj = data?.user || data?.session?.user
          if (!userObj) {
            return { needsVerification: false }
          }

          // Set user session if automatically confirmed
          set({
            isAuthenticated: true,
            user: {
              id: userObj.id,
              email: userObj.email || email,
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
          console.error("Signup Error:", err)
          
          const errorMessage = err.message || 'Signup failed'
          
          set({
            isAuthenticated: false,
            user: null,
            hasShownSplash: false,
            error: errorMessage
          })
          
          // Trigger visual Toast alert with the exact error message
          useUiStore.getState().addToast(errorMessage, 'error')
          
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
          console.log('[useAuth] Initiating OTP verification:', { email, token })
          const data = await verifyEmailOtp(email, token)
          console.log('[useAuth] verifyOtp response:', data)
          
          if (!data || !data.user) {
            throw new Error('Verification failed. Invalid code.')
          }

          // After confirmation, build/get profile
          const userSession = await buildUserSession(data.user.id, data.user.email || email)
          if (!userSession) {
            console.error('[useAuth] Profile creation failed during buildUserSession for user:', data.user.id)
            throw new Error('Profile creation failed. Please contact support.')
          }

          set({
            isAuthenticated: true,
            user: userSession,
            hasShownSplash: false,
            error: null
          })
        } catch (err: any) {
          console.error("Verification Error:", err)
          
          let errorMessage = err.message || 'Verification failed. Invalid code.'
          const lowerMsg = errorMessage.toLowerCase()
          if (lowerMsg.includes('expired')) {
            errorMessage = 'Verification code expired. Please request a new one.'
          } else if (
            lowerMsg.includes('invalid') || 
            lowerMsg.includes('incorrect') || 
            lowerMsg.includes('token signature is invalid') ||
            lowerMsg.includes('verify_otp_failed')
          ) {
            errorMessage = 'Verification code is incorrect. Please try again.'
          } else if (
            lowerMsg.includes('profile creation failed') ||
            lowerMsg.includes('profile failed')
          ) {
            errorMessage = 'Profile creation failed. Please contact support.'
          }
          
          set({ error: errorMessage })
          
          // Trigger visual Toast alert
          useUiStore.getState().addToast(errorMessage, 'error')
          
          throw new Error(errorMessage)
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
          const isRealSession = state.user && !state.user.id.startsWith('mock-') && !state.user.id.startsWith('demo-')
          
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
        if (!state.user || state.user.id.startsWith('mock-') || state.user.id.startsWith('demo-')) return

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
          const isRealSession = !state.user.id.startsWith('mock-') && !state.user.id.startsWith('demo-')
          
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
