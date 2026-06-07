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
    console.log('[auth.ts] updateProfile request received:', {
      auth_user_id: userId,
      profile_id: userId
    })

    // Check if profile exists using a SELECT query
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (checkError) {
      console.error('[auth.ts] Error checking profile existence:', checkError)
      throw checkError
    }

    let data: any
    let error: any

    if (existingProfile) {
      // Perform UPDATE
      const updatePayload = { ...updates }
      console.log('[auth.ts] Profile exists. Executing UPDATE:', {
        auth_user_id: userId,
        profile_id: userId,
        update_payload: updatePayload
      })

      const res = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single()
      
      data = res.data
      error = res.error
    } else {
      // Perform INSERT
      const insertPayload = { id: userId, ...updates }
      console.log('[auth.ts] Profile does not exist. Executing INSERT:', {
        auth_user_id: userId,
        profile_id: userId,
        insert_payload: insertPayload
      })

      const res = await supabase
        .from('profiles')
        .insert(insertPayload)
        .select()
        .single()
      
      data = res.data
      error = res.error
    }

    if (error) {
      console.error('[auth.ts] Error saving profile in database:', error)
      throw error
    }

    console.log('[auth.ts] Profile successfully saved:', data)
    return data as SupabaseProfile
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
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
  role: 'student' | 'provider' | 'admin'
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
 * Verify user email via OTP code (sent during signup)
 * @param email - User email
 * @param token - 6-digit OTP code
 */
export const verifyEmailOtp = async (email: string, token: string) => {
  verifySupabaseConfiguration()

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error verifying email OTP:', error)
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
  // 1. Rely directly on window.location.origin to avoid any hardcoded environment URL mismatches.
  let origin = window.location.origin

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
    throw error
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
    
    // Check if there is a pending role selection from Google OAuth signup
    const oauthSignupRole = typeof window !== 'undefined' ? (localStorage.getItem('oauth_signup_role') as 'student' | 'provider' | null) : null
    
    // Search profiles by auth user id OR email
    let { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!profile && email) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (profileByEmail) {
        profile = profileByEmail
        console.log('[Signup] Existing profile found with role:', profileByEmail.role)
        // Link the auth user to the existing profile by updating id
        try {
          const { error: updateIdError } = await supabase
            .from('profiles')
            .update({ id: userId })
            .eq('email', email)
          if (!updateIdError) {
            profile.id = userId
          } else {
            console.error('Failed to link profile ID:', updateIdError)
          }
        } catch (err) {
          console.error('Error linking profile ID:', err)
        }
      }
    } else if (profile) {
      console.log('[Signup] Existing profile found with role:', profile.role)
    }

    if (profile && profile.metadata) {
      if (profile.metadata.status === 'suspended') {
        throw new Error('Your account has been suspended by the administrator.')
      }
      if (profile.metadata.status === 'deleted') {
        throw new Error('No account found with this email.')
      }
    }

    // Rule: If profile does not exist: Create profile once.
    if (!profile) {
      // Check auth user exists
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        throw new Error('No authenticated user session found')
      }

      // Check if email already exists in profiles table before inserting (Never create profile if email already exists)
      if (email) {
        const { data: existingEmailProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle()

        if (existingEmailProfile) {
          profile = existingEmailProfile
          console.log('[Signup] Existing profile found with role:', existingEmailProfile.role)
          // Link ID
          try {
            const { error: updateIdError } = await supabase
              .from('profiles')
              .update({ id: userId })
              .eq('email', email)
            if (!updateIdError) {
              profile.id = userId
            }
          } catch (err) {
            console.error('Error linking profile ID:', err)
          }
        }
      }

      // If still no profile, create it once
      if (!profile) {
        const metadata = currentUser.user_metadata || {}
        const fallbackName = metadata.name || metadata.full_name || email.split('@')[0]
        const fallbackBio = metadata.bio || ''
        const fallbackPhone = metadata.phone || ''
        const fallbackAvatar = metadata.avatar_url || metadata.avatarUrl || ''
        const targetRole = oauthSignupRole || metadata.role || 'student'
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name: fallbackName,
            name: fallbackName,
            role: targetRole,
            avatar_url: fallbackAvatar,
            bio: fallbackBio,
            phone: fallbackPhone,
            onboarding_completed: metadata.onboarding_completed || false,
            metadata: {
              ...metadata,
              bio: fallbackBio,
              phone: fallbackPhone,
              avatarUrl: fallbackAvatar
            }
          })
          .select()
          .single()

        if (insertError) {
          console.error('[auth.ts] Profile auto-creation failed:', insertError.message)
          throw insertError
        }

        profile = newProfile
        console.log('[Signup] Profile created with role:', targetRole)
      }
    }

    // Role must always come from profiles table
    console.log('Role loaded')

    if (oauthSignupRole) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('oauth_signup_role')
      }
    }

    const session = {
      id: userId,
      email,
      role: profile.role,
      full_name: profile.full_name || profile.name || email.split('@')[0],
      name: profile.full_name || profile.name || email.split('@')[0],
      avatar_url: profile.avatar_url || profile.metadata?.avatarUrl || '',
      bio: profile.bio || profile.metadata?.bio || '',
      phone: profile.phone || profile.metadata?.phone || '',
      onboarding_completed: profile.onboarding_completed,
      metadata: {
        ...profile.metadata,
        bio: profile.bio || profile.metadata?.bio || '',
        phone: profile.phone || profile.metadata?.phone || '',
        avatarUrl: profile.avatar_url || profile.metadata?.avatarUrl || '',
      }
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

/**
 * Check if a user email already exists in the system via RPC
 * @param email - User email to check
 * @returns boolean indicating if the email exists
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { data, error } = await supabase.rpc('check_user_exists', { email_to_check: email })
    if (error) {
      console.warn('[auth.ts] check_user_exists RPC failed, trying query profiles table:', error.message)
      // Fallback: try querying profiles table by email column (if it exists)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)

      if (profileError) {
        throw profileError
      }
      return profileData && profileData.length > 0
    }
    return !!data
  } catch (error) {
    console.error('Error in checkEmailExists:', error)
    // Re-throw so the store can handle fallback or error propagation
    throw error
  }
}

/**
 * Get the authentication provider for a given email address
 * @param email - User email to check
 * @returns string | null provider name or null if user does not exist
 */
export const getUserProvider = async (email: string): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase.rpc('get_user_provider', { email_to_check: email })
    if (error) {
      console.warn('[auth.ts] get_user_provider RPC failed, checking profiles table instead:', error.message)
      // Fallback: check profiles table by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)

      if (profileError) {
        throw profileError
      }
      return profileData && profileData.length > 0 ? 'email' : null
    }
    return data
  } catch (error) {
    console.error('Error in getUserProvider:', error)
    return null
  }
}


