// @ts-nocheck
import { supabase, isSupabaseConfigured, getCurrentSession, getCurrentUser } from './supabaseClient'
import type { Profile, UserSession } from '@/types/database'

// ============================================
// SESSION & CONFIGURATION CHECKS
// ============================================

export { isSupabaseConfigured }

/**
 * Verify Supabase is configured
 * @throws Error if Supabase credentials are missing
 */
export const verifySupabaseConfiguration = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }
}

// ============================================
// PROFILE OPERATIONS
// ============================================

/**
 * Interface for Supabase Profile from database
 */
export interface SupabaseProfile extends Profile {
  created_at: string
}

/**
 * Fetch user profile from public.profiles table
 * @param userId - User ID from auth.users
 * @returns Profile object or null if not found
 */
export const getProfile = async (userId: string): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    console.log('[auth.ts] getProfile querying DB for userId:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.log('[auth.ts] getProfile query error:', error.code, error.message)
      if (error.code === 'PGRST116') {
        // Profile not found - this might happen during signup flow
        return null
      }
      console.error('Error fetching profile:', error.message)
      return null
    }

    console.log('[auth.ts] getProfile found profile:', data)
    return data as SupabaseProfile
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

/**
 * Update user profile
 * @param userId - User ID from auth.users
 * @param updates - Partial profile updates
 * @returns Updated profile or null on error
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<SupabaseProfile>
): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as SupabaseProfile
  } catch (error) {
    console.error('Error updating profile:', error)
    return null
  }
}

/**
 * Mark onboarding as completed
 * @param userId - User ID from auth.users
 * @returns Updated profile or null on error
 */
export const completeOnboarding = async (userId: string): Promise<SupabaseProfile | null> => {
  return updateProfile(userId, { onboarding_completed: true })
}

// ============================================
// AUTHENTICATION FLOWS
// ============================================

/**
 * Sign up a new user
 * Automatically triggers profile creation via database trigger
 * @param email - User email
 * @param password - User password
 * @param name - User display name
 * @param role - Role selection (student | provider)
 */
export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  role: 'student' | 'provider'
) => {
  verifySupabaseConfiguration()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          onboarding_completed: false,
          metadata: {}
        }
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error signing up user:', error)
    throw error
  }
}

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 * @returns Session data including user and session token
 */
export const signInUser = async (email: string, password: string) => {
  verifySupabaseConfiguration()

  try {
    const exactEmail = typeof email === 'object' ? (email as any).email || '' : String(email)
    const exactPassword = typeof password === 'object' ? '' : String(password)

    const payload = { 
      email: exactEmail, 
      password: exactPassword 
    }
    
    console.log('temporary console.log before signInWithPassword:', { 
      email: payload.email, 
      password: payload.password 
    })
    
    const { data, error } = await supabase.auth.signInWithPassword(payload)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error signing in user:', error)
    throw error
  }
}

/**
 * Determines the correct OAuth redirect URL based on environment
 */
const getRedirectUrl = () => {
  // 1. If VITE_SITE_URL is explicitly set in the environment (e.g., Render dashboard), use it.
  // 2. Otherwise, fall back to window.location.origin dynamically.
  // This guarantees no hardcoded localhost fallbacks exist in the code.
  let origin = import.meta.env.VITE_SITE_URL || window.location.origin

  // Ensure origin doesn't end with a trailing slash to prevent double slashes
  origin = origin.replace(/\/$/, '')
  
  // Account for base path (e.g. GitHub Pages)
  let basePath = import.meta.env.BASE_URL || '/'
  if (!basePath.startsWith('/')) basePath = '/' + basePath
  if (!basePath.endsWith('/')) basePath = basePath + '/'
  
  // Construct the final redirect URL to our dedicated callback route
  const redirectPath = `${basePath}auth/callback`.replace('//', '/')
  const finalUrl = `${origin}${redirectPath}`
  
  // TEMPORARY LOGGING: Verify actual redirect URL being sent to signInWithOAuth
  console.log('[Auth Debug] Initiating Google OAuth with redirect URL:', finalUrl)
  
  return finalUrl
}

/**
 * Sign in with Google OAuth
 * @returns { error } if failed, otherwise redirects to provider
 */
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured.')
    return { error: new Error('Missing Supabase configuration') }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error with Google OAuth:', error)
    return { data: null, error }
  }
}

/**
 * Sign out current user
 * Clears session and auth tokens
 */
export const signOutUser = async () => {
  if (!isSupabaseConfigured()) return

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out user:', error)
    throw error
  }
}

// ============================================
// SESSION RECOVERY & PERSISTENCE
// ============================================

/**
 * Recover active session from stored tokens
 * Used on app startup to restore user session
 * @returns Session object or null if no active session
 */
export const recoverSession = async () => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  } catch (error) {
    console.error('Error recovering session:', error)
    return null
  }
}

/**
 * Build complete user session with profile data
 * @param userId - User ID from auth.users
 * @param email - User email from auth.users
 * @returns Complete UserSession or null if profile not found
 */
export const buildUserSession = async (userId: string, email: string): Promise<UserSession | null> => {
  try {
    console.log('[auth.ts] buildUserSession called:', { userId, email })
    const profile = await getProfile(userId)

    if (!profile) {
      console.warn('[auth.ts] Profile missing in DB. Attempting to auto-create or use fallback...')
      
      // Get current user to access OAuth metadata
      const currentUser = await getCurrentUser()
      const metadata = currentUser?.user_metadata || {}
      const fallbackName = metadata.name || metadata.full_name || email.split('@')[0]
      
      // Try to create the profile row automatically
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: metadata.role || 'student', // use metadata role or default
          name: fallbackName,
          onboarding_completed: metadata.onboarding_completed || false,
          metadata: metadata
        })
        .select()
        .single()
        
      if (insertError) {
        console.error('[auth.ts] Profile auto-creation failed, using temporary session:', insertError.message)
        // Return temporary session fallback
        return {
          id: userId,
          email,
          role: metadata.role || 'student',
          name: fallbackName,
          onboarding_completed: metadata.onboarding_completed || false,
          metadata: metadata
        }
      }
      
      console.log('[auth.ts] Profile auto-created successfully:', newProfile)
      return {
        id: userId,
        email,
        role: newProfile.role,
        name: newProfile.name || email.split('@')[0],
        onboarding_completed: newProfile.onboarding_completed,
        metadata: newProfile.metadata
      }
    }

    const session = {
      id: userId,
      email,
      role: profile.role,
      name: profile.name || email.split('@')[0],
      onboarding_completed: profile.onboarding_completed,
      metadata: profile.metadata
    }
    console.log('[auth.ts] buildUserSession success:', session)
    return session
  } catch (error) {
    console.error('Error building user session:', error)
    return null
  }
}

/**
 * Refresh user profile data from database
 * Use this when profile data may have changed
 * @param userId - User ID from auth.users
 * @returns Updated UserSession or null
 */
export const refreshUserProfile = async (userId: string): Promise<UserSession | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    return buildUserSession(user.id, user.email || '')
  } catch (error) {
    console.error('Error refreshing user profile:', error)
    return null
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user is authenticated
 * @returns true if user has valid session
 */
export const isAuthenticated = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const session = await getCurrentSession()
    return !!session
  } catch {
    return false
  }
}

/**
 * Get user by email (admin only in production)
 * Used for password reset flows
 * @param email - User email
 */
export const getUserByEmail = async (email: string) => {
  if (!isSupabaseConfigured()) return null

  try {
    // This requires admin access - not available in anon client
    // For password reset, use Supabase's built-in recovery
    console.warn('getUserByEmail requires admin access. Use Supabase password recovery instead.')
    return null
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

/**
 * Request password reset
 * Sends email with recovery link
 * @param email - User email
 */
export const requestPasswordReset = async (email: string) => {
  if (!isSupabaseConfigured()) return { success: false }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return { success: false, error }
  }
}

/**
 * Update user password
 * @param newPassword - New password
 */
export const updatePassword = async (newPassword: string) => {
  if (!isSupabaseConfigured()) return { success: false }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating password:', error)
    return { success: false, error }
  }
}
