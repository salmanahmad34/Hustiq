import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Briefcase, FileText, Bell, BarChart3,
  MessageSquare, Bot, Search, Trash2, Lock, Unlock, Star, CheckCircle2,
  XCircle, RefreshCw, Send, Shield, Eye, EyeOff,
  AlertTriangle, Activity, Database, TrendingUp, UserCheck,
  Loader2, X, Sparkles, ClipboardList, Package
} from 'lucide-react'
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminJobs, fetchAdminApplications,
  fetchAdminNotifications, fetchAdminMessages, fetchAnalyticsTrend,
  fetchTableHealth, suspendUser, reactivateUser, softDeleteUser,
  changeUserRole, updateJobFlags, deleteAdminJob, updateAppStatus,
  deleteAdminApplication, sendBroadcast, deleteAdminNotification,
  deleteAdminMessage,
  type AdminStats, type AdminProfile, type AdminJob, type AdminApplication,
  type AdminNotification, type AdminMessage, type DayTrend, type TableHealthRow
} from '@/services/supabase/adminDb'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type TabId = 'overview' | 'users' | 'jobs' | 'applications' | 'notifications' | 'analytics' | 'messages' | 'ai'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const displayName = (p?: { full_name?: string; name?: string; email?: string } | null) =>
  p?.full_name || p?.name || p?.email || 'Unknown'

// ─────────────────────────────────────────────────────────────
// SMALL UI ATOMS
// ─────────────────────────────────────────────────────────────

const RoleBadge = ({ role }: { role: string }) => {
  const map: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    provider: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
    student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide', map[role] ?? 'bg-muted text-muted-foreground')}>
      {role}
    </span>
  )
}

const StatusBadge = ({ label, variant }: { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }) => {
  const map = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase', map[variant])}>
      {label}
    </span>
  )
}

const ActionBtn = ({
  onClick, icon: Icon, title, variant = 'ghost', disabled = false
}: {
  onClick: () => void
  icon: React.ElementType
  title: string
  variant?: 'ghost' | 'danger' | 'success' | 'warning'
  disabled?: boolean
}) => {
  const cls = {
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
    danger: 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20',
    success: 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20',
    warning: 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn('p-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed', cls[variant])}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}

const EmptyRow = ({ cols, msg }: { cols: number; msg: string }) => (
  <tr>
    <td colSpan={cols} className="py-16 text-center text-muted-foreground text-sm font-semibold">
      {msg}
    </td>
  </tr>
)

const TableSkeleton = ({ cols, rows = 5 }: { cols: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="p-4">
            <div className="h-4 bg-muted/40 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </>
)

// Stat card
const StatCard = ({
  label, value, sub, icon: Icon, color
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground font-semibold">{sub}</p>}
  </motion.div>
)

// SVG Line Chart
const LineChart = ({ data, field, label, color }: {
  data: DayTrend[]; field: 'newUsers' | 'newJobs' | 'newApplications'
  label: string; color: string
}) => {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d[field]), 1)
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 340 + 30,
    y: 120 - (d[field] / max) * 90,
    v: d[field],
    l: d.label,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fill = `${path} L ${pts[pts.length - 1].x} 130 L ${pts[0].x} 130 Z`

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5">
      <p className="text-sm font-bold text-foreground mb-4">{label}</p>
      <svg viewBox="0 0 400 140" className="w-full overflow-visible" style={{ height: 140 }}>
        <defs>
          <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 75, 120].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4" />
        ))}
        <path d={fill} fill={`url(#grad-${field})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2.5" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground font-semibold">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TABS CONFIG
// ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
]

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export const AdminDashboardPage = () => {
  const { user: currentUser } = useAuth()
  const { addToast } = useUiStore()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [busy, setBusy] = useState<string | null>(null) // which item id is being mutated

  // ── data states ──
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [users, setUsers] = useState<AdminProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null)

  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobSearch, setJobSearch] = useState('')

  const [applications, setApplications] = useState<AdminApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [appStatusFilter, setAppStatusFilter] = useState('all')

  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [notifAudience, setNotifAudience] = useState<'all' | 'students' | 'providers' | 'specific'>('all')
  const [notifUserId, setNotifUserId] = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifCta, setNotifCta] = useState('/dashboard')
  const [sendingNotif, setSendingNotif] = useState(false)

  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [trend, setTrend] = useState<DayTrend[]>([])
  const [tableHealth, setTableHealth] = useState<TableHealthRow[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const [aiPrompt, setAiPrompt] = useState('')

  // ── loaders ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const s = await fetchAdminStats()
      setStats(s)
    } catch (e: any) {
      addToast(e.message || 'Failed to load stats', 'error')
    } finally {
      setStatsLoading(false)
    }
  }, [addToast])

  const loadUsers = useCallback(async (q = userSearch) => {
    setUsersLoading(true)
    try {
      setUsers(await fetchAdminUsers(q))
    } catch (e: any) {
      addToast(e.message || 'Failed to load users', 'error')
    } finally {
      setUsersLoading(false)
    }
  }, [userSearch, addToast])

  const loadJobs = useCallback(async (q = jobSearch) => {
    setJobsLoading(true)
    try {
      setJobs(await fetchAdminJobs(q))
    } catch (e: any) {
      addToast(e.message || 'Failed to load jobs', 'error')
    } finally {
      setJobsLoading(false)
    }
  }, [jobSearch, addToast])

  const loadApplications = useCallback(async (status = appStatusFilter) => {
    setAppsLoading(true)
    try {
      setApplications(await fetchAdminApplications(status))
    } catch (e: any) {
      addToast(e.message || 'Failed to load applications', 'error')
    } finally {
      setAppsLoading(false)
    }
  }, [appStatusFilter, addToast])

  const loadNotifications = useCallback(async () => {
    setNotifsLoading(true)
    try {
      setNotifications(await fetchAdminNotifications())
    } catch (e: any) {
      addToast(e.message || 'Failed to load notifications', 'error')
    } finally {
      setNotifsLoading(false)
    }
  }, [addToast])

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true)
    try {
      setMessages(await fetchAdminMessages())
    } catch (e: any) {
      addToast(e.message || 'Failed to load messages', 'error')
    } finally {
      setMessagesLoading(false)
    }
  }, [addToast])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const [t, h] = await Promise.all([fetchAnalyticsTrend(), fetchTableHealth()])
      setTrend(t)
      setTableHealth(h)
    } catch (e: any) {
      addToast(e.message || 'Failed to load analytics', 'error')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [addToast])

  // ── on mount: load stats ──
  useEffect(() => { loadStats() }, [loadStats])

  // ── on tab change ──
  useEffect(() => {
    if (activeTab === 'users' && !users.length) loadUsers()
    if (activeTab === 'jobs' && !jobs.length) loadJobs()
    if (activeTab === 'applications' && !applications.length) loadApplications()
    if (activeTab === 'notifications') loadNotifications()
    if (activeTab === 'messages' && !messages.length) loadMessages()
    if (activeTab === 'analytics') loadAnalytics()
  }, [activeTab])

  // ─────────────────────────────────────────────────────────
  // USER ACTIONS
  // ─────────────────────────────────────────────────────────

  const doUserAction = async (
    userId: string,
    action: 'suspend' | 'reactivate' | 'delete',
    label: string
  ) => {
    setBusy(userId)
    try {
      if (action === 'suspend') await suspendUser(userId)
      if (action === 'reactivate') await reactivateUser(userId)
      if (action === 'delete') await softDeleteUser(userId)
      addToast(`User ${label} successfully`, 'success')
      await loadUsers()
      await loadStats()
      setSelectedUser(null)
    } catch (e: any) {
      addToast(e.message || 'User action failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const doRoleChange = async (userId: string, role: 'student' | 'provider' | 'admin') => {
    setBusy(userId)
    try {
      await changeUserRole(userId, role)
      addToast(`Role changed to ${role}`, 'success')
      await loadUsers()
    } catch (e: any) {
      addToast(e.message || 'Role change failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  // JOB ACTIONS
  // ─────────────────────────────────────────────────────────

  const doJobUpdate = async (jobId: string, updates: object, label: string) => {
    setBusy(jobId)
    try {
      await updateJobFlags(jobId, updates)
      addToast(label, 'success')
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j))
      loadStats()
    } catch (e: any) {
      addToast(e.message || 'Job update failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const doJobDelete = async (jobId: string) => {
    if (!confirm('Permanently delete this job? This cannot be undone.')) return
    setBusy(jobId)
    try {
      await deleteAdminJob(jobId)
      addToast('Job deleted', 'success')
      setJobs(prev => prev.filter(j => j.id !== jobId))
      loadStats()
    } catch (e: any) {
      addToast(e.message || 'Delete failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  // APPLICATION ACTIONS
  // ─────────────────────────────────────────────────────────

  const doAppStatus = async (appId: string, status: string, label: string) => {
    setBusy(appId)
    try {
      await updateAppStatus(appId, status)
      addToast(label, 'success')
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: status as any } : a))
    } catch (e: any) {
      addToast(e.message || 'Status update failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const doAppDelete = async (appId: string) => {
    if (!confirm('Delete this application record?')) return
    setBusy(appId)
    try {
      await deleteAdminApplication(appId)
      setApplications(prev => prev.filter(a => a.id !== appId))
      addToast('Application removed', 'success')
    } catch (e: any) {
      addToast(e.message || 'Delete failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  // NOTIFICATION BROADCAST
  // ─────────────────────────────────────────────────────────

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifMessage.trim()) {
      addToast('Title and message are required', 'error')
      return
    }
    setSendingNotif(true)
    try {
      const sent = await sendBroadcast(notifAudience, notifTitle, notifMessage, notifCta, notifUserId || undefined)
      addToast(`Broadcast sent to ${sent} users`, 'success')
      setNotifTitle('')
      setNotifMessage('')
      setNotifUserId('')
      loadNotifications()
      loadStats()
    } catch (e: any) {
      addToast(e.message || 'Broadcast failed', 'error')
    } finally {
      setSendingNotif(false)
    }
  }

  const doDeleteNotif = async (id: string) => {
    setBusy(id)
    try {
      await deleteAdminNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e: any) {
      addToast(e.message || 'Delete failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const doDeleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return
    setBusy(id)
    try {
      await deleteAdminMessage(id)
      setMessages(prev => prev.filter(m => m.id !== id))
      addToast('Message removed', 'success')
    } catch (e: any) {
      addToast(e.message || 'Delete failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  // AI TEMPLATES
  // ─────────────────────────────────────────────────────────

  const AI_TEMPLATES = [
    {
      label: '🚀 Job Application Boost',
      title: 'New Gigs Near You!',
      message: 'Fresh part-time and gig opportunities have been posted in your area. Apply now before spots fill up!',
      cta: '/jobs',
    },
    {
      label: '🌙 Weekend Hustle',
      title: 'Weekend Shifts Available',
      message: 'Looking for extra income this weekend? Check out urgent shifts posted by local shops and cafes.',
      cta: '/jobs',
    },
    {
      label: '📣 Student Re-engagement',
      title: 'We Miss You on HustiQ!',
      message: "It's been a while! New jobs matching your profile are waiting. Come back and find your next gig.",
      cta: '/dashboard',
    },
    {
      label: '💼 Provider Invite',
      title: 'Find Reliable Students Fast',
      message: 'Post your job listing today and connect with verified students ready to work flexible shifts.',
      cta: '/dashboard',
    },
    {
      label: '⭐ Platform Announcement',
      title: "HustiQ Gets Better!",
      message: 'We have added new features to make finding and hiring easier. Check out what is new!',
      cta: '/dashboard',
    },
  ]

  const applyAiTemplate = (t: typeof AI_TEMPLATES[0]) => {
    setNotifTitle(t.title)
    setNotifMessage(t.message)
    setNotifCta(t.cta)
    setActiveTab('notifications')
    addToast('Template loaded into broadcast form', 'success')
  }

  // ─────────────────────────────────────────────────────────────────────
  // ── RENDER ──
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 md:pb-10 space-y-0 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40 -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
        <div className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black text-foreground leading-none">HustiQ Admin</h1>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                Signed in as {currentUser?.email}
              </p>
            </div>
          </div>

          <button
            onClick={loadStats}
            disabled={statsLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground border border-border/40 px-3 py-1.5 rounded-xl hover:bg-muted/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', statsLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-card border border-border/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats?.totalUsers ?? 0}
                  sub={`Students: ${stats?.totalStudents} · Providers: ${stats?.totalProviders}`}
                  icon={Users} color="bg-violet-100 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400" />
                <StatCard label="Students" value={stats?.totalStudents ?? 0}
                  sub={`${stats?.suspendedUsers} suspended`}
                  icon={UserCheck} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" />
                <StatCard label="Providers" value={stats?.totalProviders ?? 0}
                  sub="Registered businesses"
                  icon={Briefcase} color="bg-sky-100 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400" />
                <StatCard label="Jobs Posted" value={stats?.totalJobs ?? 0}
                  sub={`${stats?.activeJobs} active listings`}
                  icon={Package} color="bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" />
                <StatCard label="Applications" value={stats?.totalApplications ?? 0}
                  sub="Total submissions"
                  icon={FileText} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" />
                <StatCard label="Notifications" value={stats?.totalNotifications ?? 0}
                  sub="In-app alerts sent"
                  icon={Bell} color="bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" />
                <StatCard label="Messages" value={stats?.totalMessages ?? 0}
                  sub="Total chat messages"
                  icon={MessageSquare} color="bg-teal-100 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400" />
                <StatCard label="Push Tokens" value={stats?.totalPushTokens ?? 0}
                  sub="FCM registered devices"
                  icon={Activity} color="bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" />
              </div>

              {/* Quick action cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Manage Users', tab: 'users' as TabId, icon: Users, color: 'text-violet-500' },
                  { label: 'Review Jobs', tab: 'jobs' as TabId, icon: Briefcase, color: 'text-amber-500' },
                  { label: 'Send Notification', tab: 'notifications' as TabId, icon: Bell, color: 'text-rose-500' },
                  { label: 'View Analytics', tab: 'analytics' as TabId, icon: BarChart3, color: 'text-emerald-500' },
                ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-border/60 transition-all text-left group"
                  >
                    <div className={cn('w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center group-hover:scale-110 transition-transform', item.color)}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: USERS                                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => {
                  setUserSearch(e.target.value)
                  loadUsers(e.target.value)
                }}
                className="w-full bg-card border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 font-medium"
              />
            </div>
            <button
              onClick={() => loadUsers()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shrink-0"
            >
              Refresh
            </button>
          </div>

          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-bold text-left">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {usersLoading ? <TableSkeleton cols={5} /> : users.length === 0 ? (
                    <EmptyRow cols={5} msg="No users found" />
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                            {(u.full_name || u.name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{u.full_name || u.name || '—'}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3">
                        {u.is_suspended
                          ? <StatusBadge label="Suspended" variant="warning" />
                          : u.metadata?.status === 'deleted'
                            ? <StatusBadge label="Deleted" variant="neutral" />
                            : <StatusBadge label="Active" variant="success" />}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionBtn icon={Eye} title="View profile" onClick={() => setSelectedUser(u)} />
                          {u.is_suspended ? (
                            <ActionBtn icon={Unlock} title="Reactivate" variant="success"
                              disabled={busy === u.id}
                              onClick={() => doUserAction(u.id, 'reactivate', 'reactivated')} />
                          ) : (
                            <ActionBtn icon={Lock} title="Suspend" variant="warning"
                              disabled={busy === u.id}
                              onClick={() => doUserAction(u.id, 'suspend', 'suspended')} />
                          )}
                          <ActionBtn icon={Trash2} title="Soft delete" variant="danger"
                            disabled={busy === u.id || u.role === 'admin'}
                            onClick={() => {
                              if (confirm('Soft-delete this user? They will be locked out.'))
                                doUserAction(u.id, 'delete', 'deleted')
                            }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: JOBS                                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or business…"
                value={jobSearch}
                onChange={e => { setJobSearch(e.target.value); loadJobs(e.target.value) }}
                className="w-full bg-card border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 font-medium"
              />
            </div>
            <button onClick={() => loadJobs()} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shrink-0">Refresh</button>
          </div>

          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-bold text-left">
                    <th className="px-4 py-3">Job / Business</th>
                    <th className="px-4 py-3">Payout</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3">Posted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {jobsLoading ? <TableSkeleton cols={6} /> : jobs.length === 0 ? (
                    <EmptyRow cols={6} msg="No jobs found" />
                  ) : jobs.map(j => (
                    <tr key={j.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">{j.title}</p>
                        <p className="text-[10px] text-muted-foreground">{j.business_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold">₹{j.payout}</span>
                        <span className="text-muted-foreground">/{j.payout_type}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {displayName(j.profiles)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {j.is_premium && <StatusBadge label="Premium" variant="warning" />}
                          {j.is_verified && <StatusBadge label="Verified" variant="success" />}
                          {j.is_urgent && <StatusBadge label="Urgent" variant="danger" />}
                          {!j.is_active && <StatusBadge label="Closed" variant="neutral" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(j.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionBtn
                            icon={Star}
                            title={j.is_premium ? 'Demote from premium' : 'Promote to premium'}
                            variant={j.is_premium ? 'warning' : 'ghost'}
                            disabled={busy === j.id}
                            onClick={() => doJobUpdate(j.id, { is_premium: !j.is_premium }, j.is_premium ? 'Demoted from premium' : 'Promoted to premium')}
                          />
                          <ActionBtn
                            icon={CheckCircle2}
                            title={j.is_verified ? 'Unverify' : 'Verify job'}
                            variant={j.is_verified ? 'success' : 'ghost'}
                            disabled={busy === j.id}
                            onClick={() => doJobUpdate(j.id, { is_verified: !j.is_verified }, j.is_verified ? 'Unverified' : 'Verified')}
                          />
                          <ActionBtn
                            icon={j.is_active ? EyeOff : Eye}
                            title={j.is_active ? 'Close job' : 'Reopen job'}
                            variant={j.is_active ? 'ghost' : 'success'}
                            disabled={busy === j.id}
                            onClick={() => doJobUpdate(j.id, { is_active: !j.is_active }, j.is_active ? 'Job closed' : 'Job reopened')}
                          />
                          <ActionBtn icon={Trash2} title="Delete job" variant="danger"
                            disabled={busy === j.id}
                            onClick={() => doJobDelete(j.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: APPLICATIONS                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'applied', 'viewed', 'accepted', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => { setAppStatusFilter(s); loadApplications(s) }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border',
                  appStatusFilter === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-bold text-left">
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Applied</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {appsLoading ? <TableSkeleton cols={5} /> : applications.length === 0 ? (
                    <EmptyRow cols={5} msg="No applications found" />
                  ) : applications.map(a => {
                    const statusVariant: Record<string, 'info' | 'success' | 'danger' | 'neutral'> = {
                      applied: 'info', viewed: 'neutral', accepted: 'success', rejected: 'danger'
                    }
                    return (
                      <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{a.jobs?.title ?? '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{a.jobs?.business_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{displayName(a.profiles)}</p>
                          <p className="text-[10px] text-muted-foreground">{a.profiles?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={a.status} variant={statusVariant[a.status] ?? 'neutral'} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(a.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <ActionBtn icon={CheckCircle2} title="Accept" variant="success"
                              disabled={busy === a.id || a.status === 'accepted'}
                              onClick={() => doAppStatus(a.id, 'accepted', 'Application accepted')} />
                            <ActionBtn icon={XCircle} title="Reject" variant="danger"
                              disabled={busy === a.id || a.status === 'rejected'}
                              onClick={() => doAppStatus(a.id, 'rejected', 'Application rejected')} />
                            <ActionBtn icon={Trash2} title="Delete" variant="danger"
                              disabled={busy === a.id}
                              onClick={() => doAppDelete(a.id)} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: NOTIFICATIONS                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Broadcast form */}
          <div className="lg:col-span-2 bg-card border border-border/40 rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Broadcast Notification
            </h3>
            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Target Audience</label>
                <select
                  value={notifAudience}
                  onChange={e => setNotifAudience(e.target.value as any)}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/20"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="providers">Providers Only</option>
                  <option value="specific">Specific User ID</option>
                </select>
              </div>

              {notifAudience === 'specific' && (
                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">User ID</label>
                  <input
                    type="text"
                    placeholder="UUID of the target user"
                    value={notifUserId}
                    onChange={e => setNotifUserId(e.target.value)}
                    className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/20"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="Notification headline"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Message</label>
                <textarea
                  rows={3}
                  placeholder="Notification body text…"
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary/20 leading-relaxed resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">CTA Link</label>
                <input
                  type="text"
                  placeholder="/dashboard"
                  value={notifCta}
                  onChange={e => setNotifCta(e.target.value)}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={sendingNotif}
                className="w-full bg-primary text-primary-foreground font-black py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs"
              >
                {sendingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendingNotif ? 'Sending…' : 'Broadcast Notification'}
              </button>
            </form>
          </div>

          {/* Notification log */}
          <div className="lg:col-span-3 bg-card border border-border/40 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">Recent Notifications</h3>
              <button onClick={loadNotifications} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                <RefreshCw className={cn('w-3.5 h-3.5', notifsLoading && 'animate-spin')} />
              </button>
            </div>
            <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
              {notifsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm font-semibold">No notifications yet</div>
              ) : notifications.map(n => (
                <div key={n.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/10 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-xs truncate">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      → {displayName(n.profiles)} · {fmtRelative(n.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => doDeleteNotif(n.id)}
                    disabled={busy === n.id}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: ANALYTICS                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-52 bg-card border border-border/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LineChart data={trend} field="newUsers" label="New Users (7 Days)" color="#8b5cf6" />
                <LineChart data={trend} field="newJobs" label="Jobs Posted (7 Days)" color="#f59e0b" />
                <LineChart data={trend} field="newApplications" label="Applications (7 Days)" color="#10b981" />
              </div>

              {/* DB Health Table */}
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" /> Database Health Audit
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-bold text-left">
                        <th className="px-4 py-3">Table</th>
                        <th className="px-4 py-3">Records</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {tableHealth.map(row => (
                        <tr key={row.table} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">{row.table}</td>
                          <td className="px-4 py-3 font-bold text-foreground">{row.count.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {row.status === 'healthy' && <StatusBadge label="Healthy" variant="success" />}
                            {row.status === 'empty' && <StatusBadge label="Empty" variant="neutral" />}
                            {row.status === 'error' && <StatusBadge label="Error" variant="danger" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7-day summary table */}
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" /> 7-Day Activity Summary
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-bold text-left">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">New Users</th>
                        <th className="px-4 py-3">Jobs Posted</th>
                        <th className="px-4 py-3">Applications</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {trend.map(d => (
                        <tr key={d.date} className="hover:bg-muted/10">
                          <td className="px-4 py-3 text-muted-foreground font-semibold">{d.label}</td>
                          <td className="px-4 py-3 font-bold text-violet-600 dark:text-violet-400">{d.newUsers}</td>
                          <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">{d.newJobs}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{d.newApplications}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: MESSAGES                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'messages' && (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground">All Messages</h3>
            <button onClick={loadMessages} className="text-xs font-bold text-muted-foreground hover:text-foreground">
              <RefreshCw className={cn('w-3.5 h-3.5', messagesLoading && 'animate-spin')} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-bold text-left">
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {messagesLoading ? <TableSkeleton cols={5} /> : messages.length === 0 ? (
                  <EmptyRow cols={5} msg="No messages found" />
                ) : messages.map(m => (
                  <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{displayName(m.sender)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{displayName(m.recipient)}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-foreground font-medium">{m.content}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtRelative(m.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionBtn icon={Trash2} title="Delete message" variant="danger"
                        disabled={busy === m.id}
                        onClick={() => doDeleteMessage(m.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: AI ASSISTANT                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Templates */}
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-card border border-border/40 rounded-2xl p-5">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" /> Notification Templates
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold mb-4">
                Click any template to load it into the broadcast form instantly.
              </p>
              <div className="space-y-2">
                {AI_TEMPLATES.map((t, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyAiTemplate(t)}
                    className="w-full text-left bg-muted/20 hover:bg-muted/40 border border-border/30 hover:border-border/60 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black text-xs text-foreground">{t.label}</p>
                      <Send className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-semibold leading-relaxed">{t.message}</p>
                    <p className="text-[10px] text-primary/70 mt-1.5 font-bold">CTA → {t.cta}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom compose */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-card border border-border/40 rounded-2xl p-5">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-primary" /> Custom Campaign
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend Rush"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!aiPrompt.trim()) return
                    setNotifTitle(aiPrompt)
                    setNotifMessage(`Don't miss out — ${aiPrompt.toLowerCase()} is live on HustiQ. Tap to explore new opportunities!`)
                    setNotifCta('/dashboard')
                    setActiveTab('notifications')
                    addToast('Custom campaign loaded into broadcast form', 'success')
                    setAiPrompt('')
                  }}
                  disabled={!aiPrompt.trim()}
                  className="w-full bg-primary text-primary-foreground font-black py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-xs hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate & Load
                </button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400">Admin Actions Are Final</p>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-500/70 mt-1 font-semibold leading-relaxed">
                    Broadcasts go to all selected users immediately. Deletions are permanent. Suspensions lock users out instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* USER PROFILE MODAL                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              className="relative bg-card border border-border/50 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground">User Profile</h3>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-black">
                  {(selectedUser.full_name || selectedUser.name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-foreground">{selectedUser.full_name || selectedUser.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 rounded-2xl p-4 border border-border/20">
                <div>
                  <p className="text-muted-foreground font-semibold">Role</p>
                  <div className="mt-1"><RoleBadge role={selectedUser.role} /></div>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Status</p>
                  <div className="mt-1">
                    {selectedUser.is_suspended
                      ? <StatusBadge label="Suspended" variant="warning" />
                      : <StatusBadge label="Active" variant="success" />}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Joined</p>
                  <p className="font-bold text-foreground mt-1">{fmtDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Onboarded</p>
                  <p className="font-bold text-foreground mt-1">{selectedUser.onboarding_completed ? 'Yes' : 'No'}</p>
                </div>
                {selectedUser.phone && (
                  <div className="col-span-2 border-t border-border/20 pt-2">
                    <p className="text-muted-foreground font-semibold">Phone</p>
                    <p className="font-bold text-foreground mt-1">{selectedUser.phone}</p>
                  </div>
                )}
                {selectedUser.bio && (
                  <div className="col-span-2 border-t border-border/20 pt-2">
                    <p className="text-muted-foreground font-semibold">Bio</p>
                    <p className="font-semibold text-foreground mt-1 leading-relaxed">{selectedUser.bio}</p>
                  </div>
                )}
                <div className="col-span-2 border-t border-border/20 pt-2">
                  <p className="text-muted-foreground font-semibold">User ID</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1 break-all">{selectedUser.id}</p>
                </div>
              </div>

              {/* Change Role */}
              <div className="text-xs">
                <label className="block text-muted-foreground font-bold mb-1.5">Change Role</label>
                <div className="flex gap-2">
                  {(['student', 'provider', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => doRoleChange(selectedUser.id, r)}
                      disabled={busy === selectedUser.id || selectedUser.role === r}
                      className={cn(
                        'flex-1 py-2 rounded-xl font-black capitalize transition-all border',
                        selectedUser.role === r
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                {selectedUser.is_suspended ? (
                  <button
                    onClick={() => doUserAction(selectedUser.id, 'reactivate', 'reactivated')}
                    disabled={busy === selectedUser.id}
                    className="flex-1 py-2.5 bg-emerald-500 text-white font-black rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Reactivate
                  </button>
                ) : (
                  <button
                    onClick={() => doUserAction(selectedUser.id, 'suspend', 'suspended')}
                    disabled={busy === selectedUser.id || selectedUser.id === currentUser?.id}
                    className="flex-1 py-2.5 bg-amber-500 text-white font-black rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Soft-delete this user?'))
                      doUserAction(selectedUser.id, 'delete', 'deleted')
                  }}
                  disabled={busy === selectedUser.id || selectedUser.role === 'admin'}
                  className="flex-1 py-2.5 bg-rose-500 text-white font-black rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
