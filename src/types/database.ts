/**
 * Database Type Definitions
 * Maps to Supabase schema tables and ensures type safety across the application
 */

// ============================================
// PROFILES TABLE
// ============================================
export interface Profile {
  id: string
  email?: string
  full_name?: string
  name?: string
  role: 'student' | 'provider' | 'admin'
  avatar_url?: string
  bio?: string
  phone?: string
  onboarding_completed: boolean
  metadata: Record<string, any>
  created_at: string
}

export interface ProfileUpdate {
  email?: string
  full_name?: string
  name?: string
  role?: 'student' | 'provider' | 'admin'
  avatar_url?: string
  bio?: string
  phone?: string
  onboarding_completed?: boolean
  metadata?: Record<string, any>
}

// ============================================
// JOBS TABLE
// ============================================
export interface Job {
  id: string
  title: string
  business_name: string
  description?: string
  payout: number
  payout_type: 'hr' | 'shift' | 'month' | 'task'
  is_urgent: boolean
  is_premium: boolean
  is_verified: boolean
  is_active: boolean
  location?: string
  distance?: string
  timing?: string
  posted_time?: string
  tags: string[]
  logo_placeholder?: string
  provider_id: string
  created_at: string
}

export interface JobInsert {
  title: string
  business_name: string
  description?: string
  payout: number
  payout_type: 'hr' | 'shift' | 'month' | 'task'
  is_urgent: boolean
  is_premium: boolean
  is_verified: boolean
  location?: string
  distance?: string
  timing?: string
  posted_time?: string
  tags: string[]
  logo_placeholder?: string
  provider_id: string
}

export interface JobUpdate {
  title?: string
  business_name?: string
  description?: string
  payout?: number
  payout_type?: 'hr' | 'shift' | 'month' | 'task'
  is_urgent?: boolean
  is_premium?: boolean
  is_verified?: boolean
  is_active?: boolean
  location?: string
  distance?: string
  timing?: string
  tags?: string[]
  logo_placeholder?: string
}

// ============================================
// APPLICATIONS TABLE
// ============================================
export interface Application {
  id: string
  job_id: string
  student_id: string
  status: 'applied' | 'viewed' | 'accepted' | 'rejected'
  applied_date?: string
  response_estimate?: string
  note?: string
  created_at: string
}

export interface ApplicationInsert {
  job_id: string
  student_id: string
  status?: 'applied' | 'viewed' | 'accepted' | 'rejected'
  applied_date?: string
  response_estimate?: string
  note?: string
}

export interface ApplicationUpdate {
  status?: 'applied' | 'viewed' | 'accepted' | 'rejected'
  note?: string
  response_estimate?: string
}

// ============================================
// SAVED JOBS TABLE
// ============================================
export interface SavedJob {
  id: string
  student_id: string
  job_id: string
  created_at: string
}

export interface SavedJobInsert {
  student_id: string
  job_id: string
}

// ============================================
// MESSAGES TABLE (Realtime Chat)
// ============================================
export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface MessageInsert {
  sender_id: string
  recipient_id: string
  content: string
  is_read?: boolean
}

export interface MessageUpdate {
  is_read?: boolean
  content?: string
}

// ============================================
// NOTIFICATIONS TABLE
// ============================================
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  is_read: boolean
  is_important: boolean
  metadata: Record<string, any>
  created_at: string
}

export interface NotificationInsert {
  user_id: string
  type: string
  title: string
  content: string
  is_read?: boolean
  is_important?: boolean
  metadata?: Record<string, any>
}

export interface NotificationUpdate {
  is_read?: boolean
  is_important?: boolean
}

// ============================================
// REVIEWS TABLE
// ============================================
export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  tags: string[]
  comment?: string
  created_at: string
}

export interface ReviewInsert {
  reviewer_id: string
  reviewee_id: string
  rating: number
  tags: string[]
  comment?: string
}

export interface ReviewUpdate {
  rating?: number
  tags?: string[]
  comment?: string
}

// ============================================
// COMPOSITE TYPES (For API responses with joins)
// ============================================
export interface JobWithProvider extends Job {
  provider?: Profile
}

export interface ApplicationWithDetails extends Application {
  job?: Job
  student?: Profile
}

export interface ReviewWithProfiles extends Review {
  reviewer?: Profile
  reviewee?: Profile
}

// ============================================
// USER SESSION TYPE
// ============================================
export interface UserSession {
  id: string
  email: string
  full_name?: string
  name?: string
  role: 'student' | 'provider' | 'admin'
  avatar_url?: string
  bio?: string
  phone?: string
  onboarding_completed: boolean
  metadata?: Record<string, any>
  avatarPlaceholder?: string
}
