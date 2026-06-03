// @ts-nocheck
import { supabase, isSupabaseConfigured } from './supabaseClient'
import type {
  Job,
  JobInsert,
  JobUpdate,
  Application,
  ApplicationInsert,
  ApplicationUpdate,
  ApplicationWithDetails,
  SavedJob,
  SavedJobInsert,
  Message,
  MessageInsert,
  MessageUpdate,
  Notification,
  NotificationInsert,
  NotificationUpdate,
  Review,
  ReviewInsert,
  ReviewUpdate
} from '@/types/database'

// ============================================
// JOBS QUERIES (Student Feed & Provider Listings)
// ============================================

/**
 * Fetch all jobs for student feed
 * Orders by recent, with premium jobs first
 */
export const fetchAllJobs = async (): Promise<Job[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Job[]
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

/**
 * Fetch jobs posted by a specific provider
 */
export const fetchProviderJobs = async (providerId: string): Promise<Job[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Job[]
  } catch (error) {
    console.error('Error fetching provider jobs:', error)
    return []
  }
}

/**
 * Fetch a single job by ID
 */
export const fetchJobById = async (jobId: string): Promise<Job | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) throw error
    return data as Job
  } catch (error) {
    console.error('Error fetching job:', error)
    return null
  }
}

/**
 * Create a new job listing
 */
export const createJob = async (job: JobInsert): Promise<Job | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single()

    if (error) throw error
    return data as Job
  } catch (error) {
    console.error('Error creating job:', error)
    return null
  }
}

/**
 * Update a job listing
 */
export const updateJob = async (jobId: string, updates: JobUpdate): Promise<Job | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw error
    return data as Job
  } catch (error) {
    console.error('Error updating job:', error)
    return null
  }
}

/**
 * Delete a job listing
 */
export const deleteJob = async (jobId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting job:', error)
    return false
  }
}

// ============================================
// APPLICATIONS QUERIES (Application Management)
// ============================================

/**
 * Fetch applications for a student
 */
export const fetchStudentApplications = async (studentId: string): Promise<ApplicationWithDetails[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, job:job_id(*), student:student_id(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ApplicationWithDetails[]
  } catch (error) {
    console.error('Error fetching student applications:', error)
    return []
  }
}

/**
 * Fetch applications received by a provider for their jobs
 */
export const fetchProviderApplications = async (providerId: string): Promise<ApplicationWithDetails[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    // First get all jobs by this provider
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('provider_id', providerId)

    if (jobsError) throw jobsError

    const jobIds = (jobs || []).map(j => j.id)
    if (jobIds.length === 0) return []

    // Then get all applications for those jobs
    const { data, error } = await supabase
      .from('applications')
      .select('*, job:job_id(*), student:student_id(*)')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ApplicationWithDetails[]
  } catch (error) {
    console.error('Error fetching provider applications:', error)
    return []
  }
}

/**
 * Submit an application to a job
 */
export const submitApplication = async (application: ApplicationInsert): Promise<Application | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single()

    if (error) throw error
    return data as Application
  } catch (error) {
    console.error('Error submitting application:', error)
    return null
  }
}

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  updates: ApplicationUpdate
): Promise<Application | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    return data as Application
  } catch (error) {
    console.error('Error updating application:', error)
    return null
  }
}

/**
 * Check if a student has already applied to a job
 */
export const checkApplicationExists = async (jobId: string, studentId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('student_id', studentId)

    if (error) throw error
    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error checking application:', error)
    return false
  }
}

// ============================================
// SAVED JOBS QUERIES (Student Bookmarks)
// ============================================

/**
 * Fetch all saved jobs for a student
 */
export const fetchSavedJobs = async (studentId: string): Promise<SavedJob[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as SavedJob[]
  } catch (error) {
    console.error('Error fetching saved jobs:', error)
    return []
  }
}

/**
 * Save a job
 */
export const saveJob = async (saved: SavedJobInsert): Promise<SavedJob | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert(saved)
      .select()
      .single()

    if (error) throw error
    return data as SavedJob
  } catch (error) {
    console.error('Error saving job:', error)
    return null
  }
}

/**
 * Unsave a job
 */
export const unsaveJob = async (jobId: string, studentId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('student_id', studentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error unsaving job:', error)
    return false
  }
}

/**
 * Check if a job is saved
 */
export const isJobSaved = async (jobId: string, studentId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('student_id', studentId)

    if (error) throw error
    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error checking if job is saved:', error)
    return false
  }
}

// ============================================
// MESSAGES QUERIES (Realtime Chat)
// ============================================

/**
 * Fetch conversation between two users
 */
export const fetchConversation = async (userId: string, recipientId: string): Promise<Message[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), recipient:recipient_id(*)')
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as Message[]
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return []
  }
}

/**
 * Fetch all conversations for a user
 */
export const fetchConversations = async (userId: string): Promise<Message[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), recipient:recipient_id(*)')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Message[]
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

/**
 * Send a message
 */
export const sendMessage = async (message: MessageInsert): Promise<Message | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()

    if (error) throw error
    return data as Message
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<Message | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single()

    if (error) throw error
    return data as Message
  } catch (error) {
    console.error('Error marking message as read:', error)
    return null
  }
}

// ============================================
// NOTIFICATIONS QUERIES
// ============================================

/**
 * Fetch notifications for a user
 */
export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Notification[]
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Create a notification
 */
export const createNotification = async (notification: NotificationInsert): Promise<Notification | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<Notification | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return null
  }
}

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting notification:', error)
    return false
  }
}

// ============================================
// REVIEWS QUERIES
// ============================================

/**
 * Fetch reviews for a user (as reviewee)
 */
export const fetchUserReviews = async (userId: string): Promise<Review[]> => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Review[]
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

/**
 * Submit a review
 */
export const submitReview = async (review: ReviewInsert): Promise<Review | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single()

    if (error) throw error
    return data as Review
  } catch (error) {
    console.error('Error submitting review:', error)
    return null
  }
}

/**
 * Calculate average rating for a user
 */
export const calculateAverageRating = async (userId: string): Promise<number | null> => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId)

    if (error) throw error

    if (!data || data.length === 0) return null

    const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length
    return Math.round(average * 10) / 10
  } catch (error) {
    console.error('Error calculating average rating:', error)
    return null
  }
}

export const updateApplicationStatusInDb = async (applicationId: string, status: 'viewed' | 'accepted' | 'rejected') => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 3. SAVED JOBS QUERIES
export const fetchApplicationsFromDb = async (userId: string, role: string) => {
  if (role === 'student') {
    return fetchStudentApplications(userId)
  }
  return fetchProviderApplications(userId)
}

export const fetchSavedJobsFromDb = async (studentId: string) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('saved_jobs')
    .select('*, job_id(*)')
    .eq('student_id', studentId)

  if (error) throw error
  return data
}

export const saveJobToDb = async (studentId: string, jobId: string) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('saved_jobs')
    .insert({ student_id: studentId, job_id: jobId })
    .select()
    .single()

  if (error) throw error
  return data
}

export const unsaveJobFromDb = async (studentId: string, jobId: string) => {
  if (!isSupabaseConfigured()) return

  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('student_id', studentId)
    .eq('job_id', jobId)

  if (error) throw error
}

// 4. MESSAGES (CHAT) QUERIES
export const fetchMessagesFromDb = async (userId: string, contactId: string) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const sendMessageToDb = async (senderId: string, recipientId: string, content: string) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, content })
    .select()
    .single()

  if (error) throw error
  return data
}

// 5. REVIEWS QUERIES
export const fetchReviewsFromDb = async (revieweeId: string) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', revieweeId)

  if (error) throw error
  return data
}

export const submitReviewToDb = async (reviewerId: string, revieweeId: string, rating: number, tags: string[], comment: string) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('reviews')
    .insert({ reviewer_id: reviewerId, reviewee_id: revieweeId, rating, tags, comment })
    .select()
    .single()

  if (error) throw error
  return data
}

// 6. NOTIFICATIONS QUERIES
export const fetchNotificationsFromDb = async (userId: string) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const markNotificationReadInDb = async (notificationId: string) => {
  if (!isSupabaseConfigured()) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export const createNotificationInDb = async (userId: string, type: string, title: string, content: string, isImportant = false, metadata = {}) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, content, is_important: isImportant, metadata })
    .select()
    .single()

  if (error) throw error
  return data
}
