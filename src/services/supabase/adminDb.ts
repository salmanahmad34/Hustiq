// @ts-nocheck
/**
 * adminDb.ts
 * Admin-only Supabase queries. All functions assume the caller has admin role.
 * RLS policies (is_admin() function) enforce this server-side.
 */
import { supabase } from './supabaseClient'

// ============================================
// TYPES
// ============================================

export interface AdminProfile {
  id: string
  email: string
  full_name?: string
  name?: string
  role: 'student' | 'provider' | 'admin'
  avatar_url?: string
  bio?: string
  phone?: string
  is_suspended?: boolean
  onboarding_completed?: boolean
  metadata?: Record<string, any>
  created_at: string
}

export interface AdminJob {
  id: string
  title: string
  business_name: string
  description?: string
  payout: number
  payout_type: string
  is_active: boolean
  is_urgent: boolean
  is_premium: boolean
  is_verified: boolean
  provider_id: string
  location?: string
  tags?: string[]
  created_at: string
  profiles?: { full_name?: string; email?: string }
}

export interface AdminApplication {
  id: string
  job_id: string
  student_id: string
  status: 'applied' | 'viewed' | 'accepted' | 'rejected'
  note?: string
  created_at: string
  jobs?: { title: string; business_name: string }
  profiles?: { full_name?: string; email?: string }
}

export interface AdminNotification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  is_read: boolean
  is_important: boolean
  metadata?: Record<string, any>
  created_at: string
  profiles?: { full_name?: string; email?: string }
}

export interface AdminMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: { full_name?: string; name?: string; email?: string }
  recipient?: { full_name?: string; name?: string; email?: string }
}

export interface AdminStats {
  totalUsers: number
  totalStudents: number
  totalProviders: number
  totalAdmins: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  totalNotifications: number
  totalMessages: number
  suspendedUsers: number
  totalPushTokens: number
}

export interface DayTrend {
  date: string
  label: string
  newUsers: number
  newJobs: number
  newApplications: number
}

export interface TableHealthRow {
  table: string
  count: number
  status: 'healthy' | 'empty' | 'error'
  error?: string
}

// ============================================
// STATS — Overview counts from all tables
// ============================================

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const [
    totalUsersRes,
    studentsRes,
    providersRes,
    adminsRes,
    jobsRes,
    activeJobsRes,
    appsRes,
    notifsRes,
    messagesRes,
    suspendedRes,
    tokensRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
    supabase.from('user_push_tokens').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: totalUsersRes.count ?? 0,
    totalStudents: studentsRes.count ?? 0,
    totalProviders: providersRes.count ?? 0,
    totalAdmins: adminsRes.count ?? 0,
    totalJobs: jobsRes.count ?? 0,
    activeJobs: activeJobsRes.count ?? 0,
    totalApplications: appsRes.count ?? 0,
    totalNotifications: notifsRes.count ?? 0,
    totalMessages: messagesRes.count ?? 0,
    suspendedUsers: suspendedRes.count ?? 0,
    totalPushTokens: tokensRes.count ?? 0,
  }
}

// ============================================
// USERS
// ============================================

export const fetchAdminUsers = async (query = ''): Promise<AdminProfile[]> => {
  let q = supabase
    .from('profiles')
    .select('id, email, full_name, name, role, avatar_url, bio, phone, is_suspended, onboarding_completed, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (query.trim()) {
    q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,name.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AdminProfile[]
}

export const suspendUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: true })
    .eq('id', id)
  if (error) throw error
}

export const reactivateUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: false })
    .eq('id', id)
  if (error) throw error
}

export const softDeleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_suspended: true,
      metadata: { status: 'deleted', deleted_at: new Date().toISOString() },
    })
    .eq('id', id)
  if (error) throw error
}

export const changeUserRole = async (
  id: string,
  role: 'student' | 'provider' | 'admin'
): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
}

// ============================================
// JOBS
// ============================================

export const fetchAdminJobs = async (query = ''): Promise<AdminJob[]> => {
  let q = supabase
    .from('jobs')
    .select('*, profiles:provider_id (full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (query.trim()) {
    q = q.or(`title.ilike.%${query}%,business_name.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AdminJob[]
}

export const updateJobFlags = async (
  id: string,
  updates: Partial<Pick<AdminJob, 'is_active' | 'is_premium' | 'is_verified' | 'is_urgent'>>
): Promise<void> => {
  const { error } = await supabase.from('jobs').update(updates).eq('id', id)
  if (error) throw error
}

export const deleteAdminJob = async (id: string): Promise<void> => {
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// APPLICATIONS
// ============================================

export const fetchAdminApplications = async (statusFilter?: string): Promise<AdminApplication[]> => {
  let q = supabase
    .from('applications')
    .select(`
      id, job_id, student_id, status, note, created_at,
      jobs:job_id (title, business_name),
      profiles:student_id (full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (statusFilter && statusFilter !== 'all') {
    q = q.eq('status', statusFilter)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AdminApplication[]
}

export const updateAppStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase.from('applications').update({ status }).eq('id', id)
  if (error) throw error
}

export const deleteAdminApplication = async (id: string): Promise<void> => {
  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// NOTIFICATIONS
// ============================================

export const fetchAdminNotifications = async (): Promise<AdminNotification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, profiles:user_id (full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return (data ?? []) as AdminNotification[]
}

export const sendBroadcast = async (
  audience: 'all' | 'students' | 'providers' | 'specific',
  title: string,
  message: string,
  ctaLink: string,
  specificUserId?: string
): Promise<number> => {
  let userIds: string[] = []

  if (audience === 'specific' && specificUserId) {
    userIds = [specificUserId]
  } else {
    let q = supabase.from('profiles').select('id').eq('is_suspended', false)
    if (audience === 'students') q = q.eq('role', 'student')
    if (audience === 'providers') q = q.eq('role', 'provider')
    const { data, error } = await q
    if (error) throw error
    userIds = (data ?? []).map((p: any) => p.id)
  }

  if (userIds.length === 0) return 0

  const rows = userIds.map((uid) => ({
    user_id: uid,
    type: 'admin_broadcast',
    title,
    content: message,
    is_important: true,
    metadata: { ctaLink, source: 'admin_panel' },
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) throw error
  return userIds.length
}

export const deleteAdminNotification = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// MESSAGES
// ============================================

export const fetchAdminMessages = async (): Promise<AdminMessage[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id, sender_id, recipient_id, content, is_read, created_at,
      sender:sender_id (full_name, name, email),
      recipient:recipient_id (full_name, name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return (data ?? []) as AdminMessage[]
}

export const deleteAdminMessage = async (id: string): Promise<void> => {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// ANALYTICS — 7-day trend
// ============================================

export const fetchAnalyticsTrend = async (): Promise<DayTrend[]> => {
  const trend: DayTrend[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const start = d.toISOString()
    const end = new Date(d.getTime() + 86400000).toISOString()

    const [usersRes, jobsRes, appsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end),
      supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end),
    ])

    trend.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      newUsers: usersRes.count ?? 0,
      newJobs: jobsRes.count ?? 0,
      newApplications: appsRes.count ?? 0,
    })
  }

  return trend
}

// ============================================
// DATABASE HEALTH AUDIT
// ============================================

export const fetchTableHealth = async (): Promise<TableHealthRow[]> => {
  const tables = [
    'profiles',
    'jobs',
    'applications',
    'saved_jobs',
    'notifications',
    'messages',
    'user_push_tokens',
  ]

  const results = await Promise.all(
    tables.map(async (table) => {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        if (error) return { table, count: 0, status: 'error' as const, error: error.message }
        return { table, count: count ?? 0, status: count === 0 ? ('empty' as const) : ('healthy' as const) }
      } catch (e: any) {
        return { table, count: 0, status: 'error' as const, error: e.message }
      }
    })
  )

  return results
}
