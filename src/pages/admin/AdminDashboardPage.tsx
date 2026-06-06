import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/services/supabase/supabaseClient'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'
import { 
  Users, 
  Briefcase, 
  Bell, 
  Bot, 
  TrendingUp, 
  Search, 
  Lock, 
  Unlock, 
  Trash2, 
  Star, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ShieldAlert as ShieldIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsMetrics {
  totalUsers: number
  totalStudents: number
  totalProviders: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  notificationsSent: number
}

interface TrendItem {
  label: string
  activeUsers: number
  jobsPosted: number
  applicationsSubmitted: number
}

interface AdminStats {
  metrics: StatsMetrics
  analytics: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    trend: TrendItem[]
  }
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  name?: string
  role: 'student' | 'provider' | 'admin'
  created_at: string
  metadata?: {
    status?: 'active' | 'suspended' | 'deleted'
    last_active_at?: string
    phone?: string
    bio?: string
    [key: string]: any
  }
}

interface JobItem {
  id: string
  title: string
  business_name: string
  payout: number
  payout_type: 'hr' | 'shift' | 'month' | 'task'
  is_urgent: boolean
  is_premium: boolean
  is_verified: boolean
  created_at: string
}

export const AdminDashboardPage = () => {
  const { user: currentUser } = useAuth()
  const { addToast } = useUiStore()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'notifications' | 'ai'>('overview')
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [submittingAction, setSubmittingAction] = useState<string | null>(null)
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [jobs, setJobs] = useState<JobItem[]>([])
  
  // Search & Filter
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  
  // Notification form state
  const [notifAudience, setNotifAudience] = useState<'all' | 'students' | 'providers' | 'specific'>('all')
  const [notifUserId, setNotifUserId] = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifCta, setNotifCta] = useState('/discover')
  const [sendingNotif, setSendingNotif] = useState(false)
  
  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [draftNotification, setDraftNotification] = useState<{title: string, message: string, ctaLink: string} | null>(null)

  // API config helpers
  const getApiUrl = (path: string) => {
    const isDev = import.meta.env.DEV
    const host = isDev ? 'http://localhost:3000' : ''
    return `${host}${path}`
  }

  const getHeaders = async () => {
    const { data } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.session?.access_token}`
    }
  }

  // Load Overview Data
  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl('/api/admin/stats'), { headers })
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      setStats(data)
    } catch (err: any) {
      addToast(err.message || 'Error loading dashboard statistics', 'error')
    } finally {
      setLoadingStats(false)
    }
  }

  // Load Users Data
  const loadUsers = async (query = '') => {
    setLoadingUsers(true)
    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl(`/api/admin/users?query=${encodeURIComponent(query)}`), { headers })
      if (!res.ok) throw new Error('Failed to query users')
      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      addToast(err.message || 'Error loading user profiles', 'error')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Load Jobs Data
  const loadJobs = async () => {
    setLoadingJobs(true)
    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl('/api/admin/jobs'), { headers })
      if (!res.ok) throw new Error('Failed to query jobs')
      const data = await res.json()
      setJobs(data)
    } catch (err: any) {
      addToast(err.message || 'Error loading job listings', 'error')
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadStats()
    }
  }, [currentUser])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'jobs') loadJobs()
  }, [activeTab])

  // Handle User Status Modification (Suspend / Reactivate / Delete)
  const handleUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'deleted') => {
    setSubmittingAction(userId)
    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl('/api/admin/users/status'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update user status')
      await res.json()
      
      addToast(`User status successfully changed to ${newStatus}.`, 'success')
      
      // Update local state list
      if (newStatus === 'deleted') {
        setUsers(users.filter(u => u.id !== userId))
      } else {
        setUsers(users.map(u => u.id === userId ? { ...u, metadata: { ...u.metadata, status: newStatus } } : u))
      }

      if (selectedUser?.id === userId) {
        setSelectedUser(null)
      }
      
      // Refresh stats in background
      loadStats()
    } catch (err: any) {
      addToast(err.message || 'Failed to update user status', 'error')
    } finally {
      setSubmittingAction(null)
    }
  }

  // Handle Job Actions (Feature / Verify / Delete)
  const handleJobAction = async (jobId: string, action: 'feature' | 'unfeature' | 'verify' | 'unverify' | 'delete') => {
    setSubmittingAction(jobId)
    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl('/api/admin/jobs/action'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobId, action })
      })
      if (!res.ok) throw new Error('Failed to process job action')
      
      addToast(`Job ${action} action applied successfully.`, 'success')
      
      if (action === 'delete') {
        setJobs(jobs.filter(j => j.id !== jobId))
      } else {
        const isPremiumUpdate = action === 'feature' ? true : action === 'unfeature' ? false : null
        const isVerifiedUpdate = action === 'verify' ? true : action === 'unverify' ? false : null
        
        setJobs(jobs.map(j => {
          if (j.id !== jobId) return j
          return {
            ...j,
            ...(isPremiumUpdate !== null && { is_premium: isPremiumUpdate }),
            ...(isVerifiedUpdate !== null && { is_verified: isVerifiedUpdate })
          }
        }))
      }
      
      // Refresh stats
      loadStats()
    } catch (err: any) {
      addToast(err.message || 'Failed to execute job action', 'error')
    } finally {
      setSubmittingAction(null)
    }
  }

  // Handle Broadcast Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) {
      addToast('Please enter both title and message', 'error')
      return
    }

    setSendingNotif(true)
    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl('/api/admin/notifications/send'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audience: notifAudience,
          userId: notifUserId,
          title: notifTitle,
          message: notifMessage,
          ctaLink: notifCta
        })
      })

      if (!res.ok) throw new Error('Notification broadcast failed')
      const data = await res.json()
      
      addToast(`Broadcasting completed successfully. Sent: ${data.successCount}, Failed: ${data.failureCount}`, 'success')
      
      // Reset form
      setNotifTitle('')
      setNotifMessage('')
      setNotifUserId('')
      
      loadStats()
    } catch (err: any) {
      addToast(err.message || 'Failed to dispatch notifications', 'error')
    } finally {
      setSendingNotif(false)
    }
  }

  // Handle Admin AI Prompts
  const handleAiChat = async (promptToSend = aiPrompt) => {
    if (!promptToSend.trim()) return
    setAiLoading(true)
    setAiResponse('')
    setDraftNotification(null)

    try {
      const headers = await getHeaders()
      const res = await fetch(getApiUrl('/api/admin/ai/chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: promptToSend })
      })

      if (!res.ok) throw new Error('AI Assistant request failed')
      const data = await res.json()
      
      setAiResponse(data.response)

      // Look for a JSON block inside the generated response to parse any drafted notification
      try {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/
        const match = data.response.match(jsonRegex)
        if (match && match[1]) {
          const parsed = JSON.parse(match[1])
          if (parsed && parsed.title && parsed.message) {
            setDraftNotification({
              title: parsed.title,
              message: parsed.message,
              ctaLink: parsed.ctaLink || '/discover'
            })
          }
        }
      } catch (parseErr) {
        console.warn('Could not parse draft notification from AI response:', parseErr)
      }

    } catch (err: any) {
      addToast(err.message || 'AI Assistant is currently offline', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  // Apply draft from AI chatbot directly to form and switch tab
  const applyDraftToForm = () => {
    if (!draftNotification) return
    setNotifAudience('all')
    setNotifTitle(draftNotification.title)
    setNotifMessage(draftNotification.message)
    setNotifCta(draftNotification.ctaLink)
    addToast('Draft notification loaded into sender! Review and click Send.', 'info')
    setActiveTab('notifications')
  }

  // Quick prompt templates
  const templatePrompts = [
    { label: "Increase Job Applications", prompt: "Generate a notification and campaign ideas to increase job applications on active listings." },
    { label: "Reactivate Inactive Students", prompt: "Generate a campaign and push notification draft targeting inactive students who haven't taken a gig." },
    { label: "Weekend Promotion", prompt: "Write a weekend gig promotion for urgent catering and delivery rider roles." }
  ]

  // Render SVG charts for visual analytics
  const renderTrendCharts = () => {
    if (!stats || !stats.analytics.trend || stats.analytics.trend.length === 0) return null
    const trend = stats.analytics.trend
    
    // Scale helper for chart rendering
    const maxActive = Math.max(...trend.map(t => t.activeUsers), 5)
    const maxJobs = Math.max(...trend.map(t => t.jobsPosted + t.applicationsSubmitted), 5)
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Active Users Line Chart (SVG) */}
        <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">User Activity Trend (7 Days)</h4>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Active Users (DAU)
            </div>
          </div>
          
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4" />

              {/* Path & Fill */}
              {(() => {
                const points = trend.map((t, idx) => {
                  const x = (idx / (trend.length - 1)) * 380 + 10
                  const y = 140 - (t.activeUsers / maxActive) * 110
                  return { x, y }
                })
                
                const pathData = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
                const fillData = `${pathData} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`
                
                return (
                  <>
                    <path d={fillData} fill="url(#gradient-line)" />
                    <path d={pathData} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, idx) => (
                      <circle 
                        key={idx} 
                        cx={p.x} 
                        cy={p.y} 
                        r="3.5" 
                        className="fill-background stroke-primary stroke-[2.5]" 
                      />
                    ))}
                  </>
                )
              })()}
            </svg>
            
            {/* X Axis labels */}
            <div className="flex justify-between mt-2 px-2 text-[9px] text-muted-foreground font-semibold">
              {trend.map((t, idx) => (
                <span key={idx}>{t.label.split(',')[0]}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs vs Applications Bar Chart (SVG) */}
        <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Gigs vs Applications Submitted</h4>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Jobs Posted
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Applications
              </div>
            </div>
          </div>
          
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4" />

              {/* Bars */}
              {trend.map((t, idx) => {
                const xGroup = (idx / trend.length) * 380 + 20
                const barWidth = 10
                
                // Heights
                const jobsHeight = (t.jobsPosted / maxJobs) * 110
                const appsHeight = (t.applicationsSubmitted / maxJobs) * 110
                
                const jobsY = 135 - jobsHeight
                const appsY = 135 - appsHeight
                
                return (
                  <g key={idx}>
                    {/* Jobs Bar */}
                    <rect 
                      x={xGroup - 6} 
                      y={jobsY} 
                      width={barWidth} 
                      height={Math.max(jobsHeight, 2)} 
                      rx="3" 
                      className="fill-indigo-500/80 dark:fill-indigo-500/50" 
                    />
                    {/* Applications Bar */}
                    <rect 
                      x={xGroup + 6} 
                      y={appsY} 
                      width={barWidth} 
                      height={Math.max(appsHeight, 2)} 
                      rx="3" 
                      className="fill-emerald-500/80 dark:fill-emerald-500/50" 
                    />
                  </g>
                )
              })}
            </svg>
            
            {/* X Axis labels */}
            <div className="flex justify-between mt-2 px-2 text-[9px] text-muted-foreground font-semibold">
              {trend.map((t, idx) => (
                <span key={idx}>{t.label.split(',')[0]}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header with Admin Shield Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <ShieldIcon className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">HustiQ Admin Console</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Monitor activity metrics, audit users and jobs, send targeted Firebase alerts, and generate promotional content.
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-muted/30 border border-border/40 p-1 rounded-2xl self-start sm:self-center">
          {(['overview', 'users', 'jobs', 'notifications', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all",
                activeTab === tab 
                  ? "bg-card text-foreground shadow-sm border border-border/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'ai' ? 'AI Assistant' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-card border border-border/40 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Overview Metric Grids */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
                    <Users className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mt-2 tracking-tight">
                    {stats?.metrics.totalUsers || 0}
                  </h3>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">Students: {stats?.metrics.totalStudents || 0}</span>
                    <span>•</span>
                    <span className="text-indigo-500 font-bold">Providers: {stats?.metrics.totalProviders || 0}</span>
                  </div>
                </div>

                <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gigs Posted</span>
                    <Briefcase className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mt-2 tracking-tight">
                    {stats?.metrics.totalJobs || 0}
                  </h3>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-1">
                    Active Listings: {stats?.metrics.activeJobs || 0}
                  </div>
                </div>

                <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Applications</span>
                    <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mt-2 tracking-tight">
                    {stats?.metrics.totalApplications || 0}
                  </h3>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-1">
                    Apply rate: {((stats?.metrics.totalApplications || 0) / Math.max(stats?.metrics.totalUsers || 1, 1)).toFixed(1)} per user
                  </div>
                </div>

                <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity (WAU)</span>
                    <Sparkles className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mt-2 tracking-tight">
                    {stats?.analytics.weeklyActiveUsers || 0}
                  </h3>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-1">
                    Daily Active (DAU): {stats?.analytics.dailyActiveUsers || 0}
                  </div>
                </div>
              </div>

              {/* Chart telemetry */}
              {renderTrendCharts()}
            </>
          )}
        </div>
      )}

      {/* VIEW: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user profiles by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value)
                  loadUsers(e.target.value)
                }}
                className="w-full bg-card border border-border/40 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/10 outline-none text-foreground font-medium"
              />
            </div>
            <button
              onClick={() => loadUsers(userSearch)}
              className="bg-primary text-primary-foreground font-black px-4 py-2 rounded-xl text-xs shadow-sm"
            >
              Refresh List
            </button>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-bold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading users directory...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">No users found matching search query.</td>
                    </tr>
                  ) : (
                    users.map(u => {
                      const isSuspended = u.metadata?.status === 'suspended'
                      const isDeleted = u.metadata?.status === 'deleted'
                      
                      return (
                        <tr key={u.id} className="hover:bg-muted/10 font-medium">
                          <td className="p-4">
                            <span className="font-bold text-foreground">{u.full_name || u.name || 'Anonymous User'}</span>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              u.role === 'admin' ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" :
                              u.role === 'provider' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400" :
                              "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold capitalize",
                              isSuspended ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                              isDeleted ? "bg-slate-100 text-slate-700" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            )}>
                              {u.metadata?.status || 'active'}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              
                              {isSuspended ? (
                                <button
                                  onClick={() => handleUserStatus(u.id, 'active')}
                                  disabled={submittingAction === u.id}
                                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50"
                                  title="Reactivate user"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserStatus(u.id, 'suspended')}
                                  disabled={submittingAction === u.id}
                                  className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg text-amber-600 hover:text-amber-500 transition-colors disabled:opacity-50"
                                  title="Suspend user"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to soft delete this user? They will be locked out and hidden from standard user directories.')) {
                                    handleUserStatus(u.id, 'deleted')
                                  }
                                }}
                                disabled={submittingAction === u.id}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-600 hover:text-rose-500 transition-colors disabled:opacity-50"
                                title="Soft delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: JOB MANAGEMENT */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-bold">
                    <th className="p-4">Title</th>
                    <th className="p-4">Business</th>
                    <th className="p-4">Payout</th>
                    <th className="p-4">Featured</th>
                    <th className="p-4">Verified</th>
                    <th className="p-4">Posted At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {loadingJobs ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">Loading job listings...</td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">No jobs currently posted.</td>
                    </tr>
                  ) : (
                    jobs.map(j => (
                      <tr key={j.id} className="hover:bg-muted/10 font-medium">
                        <td className="p-4">
                          <span className="font-bold text-foreground">{j.title}</span>
                        </td>
                        <td className="p-4 text-muted-foreground">{j.business_name}</td>
                        <td className="p-4">
                          <span className="font-bold">₹{j.payout}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">/{j.payout_type}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            j.is_premium ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" : "bg-muted text-muted-foreground"
                          )}>
                            {j.is_premium ? 'Premium' : 'Standard'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            j.is_verified ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                          )}>
                            {j.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {j.created_at ? new Date(j.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {j.is_premium ? (
                              <button
                                onClick={() => handleJobAction(j.id, 'unfeature')}
                                disabled={submittingAction === j.id}
                                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg text-amber-500 transition-colors disabled:opacity-50"
                                title="Demote standard"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJobAction(j.id, 'feature')}
                                disabled={submittingAction === j.id}
                                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg text-muted-foreground hover:text-amber-500 transition-colors disabled:opacity-50"
                                title="Promote premium"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {j.is_verified ? (
                              <button
                                onClick={() => handleJobAction(j.id, 'unverify')}
                                disabled={submittingAction === j.id}
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg text-emerald-500 transition-colors disabled:opacity-50"
                                title="Mark unverified"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-background" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJobAction(j.id, 'verify')}
                                disabled={submittingAction === j.id}
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg text-muted-foreground hover:text-emerald-500 transition-colors disabled:opacity-50"
                                title="Mark verified"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to permanently delete this job listing?')) {
                                  handleJobAction(j.id, 'delete')
                                }
                              }}
                              disabled={submittingAction === j.id}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-600 hover:text-rose-500 transition-colors disabled:opacity-50"
                              title="Delete job listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: NOTIFICATION CENTER */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notification Form */}
          <div className="lg:col-span-2 bg-card border border-border/40 p-6 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] space-y-4">
            <h3 className="text-base font-bold text-foreground">Send targeted FCM alerts</h3>
            
            <form onSubmit={handleSendNotification} className="space-y-4 font-medium text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">Target Audience</label>
                  <select
                    value={notifAudience}
                    onChange={(e: any) => setNotifAudience(e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-xl p-2.5 outline-none focus:border-primary/40 text-foreground font-bold"
                  >
                    <option value="all">All Registered Users</option>
                    <option value="students">Students Only</option>
                    <option value="providers">Providers Only</option>
                    <option value="specific">Specific User ID</option>
                  </select>
                </div>

                {notifAudience === 'specific' && (
                  <div>
                    <label className="block text-muted-foreground mb-1.5 font-bold">Recipient User ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                      value={notifUserId}
                      onChange={(e) => setNotifUserId(e.target.value)}
                      className="w-full bg-muted/40 border border-border/40 rounded-xl p-2.5 outline-none focus:border-primary/40 text-foreground font-bold"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Notification Title</label>
                <input
                  type="text"
                  placeholder="e.g. New Gigs Nearby"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-xl p-2.5 outline-none focus:border-primary/40 text-foreground font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Notification Message</label>
                <textarea
                  rows={4}
                  placeholder="Type push message details here..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-xl p-2.5 outline-none focus:border-primary/40 text-foreground font-semibold leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">CTA Navigation Link (Action Path)</label>
                <input
                  type="text"
                  placeholder="e.g. /discover"
                  value={notifCta}
                  onChange={(e) => setNotifCta(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-xl p-2.5 outline-none focus:border-primary/40 text-foreground font-bold"
                />
                <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                  Clicking the push notification will navigate the user to this frontend screen in HustiQ.
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingNotif}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black py-2.5 px-4 rounded-xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingNotif ? 'Sending Broadcast...' : 'Broadcast FCM Notifications'}
              </button>
            </form>
          </div>

          {/* Quick Info Box */}
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-muted-foreground" /> Push Delivery Architecture
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-semibold">
                Notifications are sent concurrently via the Firebase Admin multicast protocol to all matching device registration tokens mapped under <strong>user_push_tokens</strong>.
              </p>
              <ul className="text-[10px] text-muted-foreground mt-3 space-y-1.5 list-disc pl-4 font-semibold">
                <li>Realtime Supabase subscriber synchronizes push status</li>
                <li>Invalidated or stale tokens are automatically deleted</li>
                <li>Action paths correctly trigger service-worker deep link navigation</li>
              </ul>
            </div>
            
            <div className="bg-muted/30 border border-border/20 p-4 rounded-2xl text-[10px] text-muted-foreground leading-relaxed font-semibold">
              Tip: Use the <strong>AI Assistant</strong> tab to generate high-conversion notifications and load them here with a single click.
            </div>
          </div>
        </div>
      )}

      {/* VIEW: AI ASSISTANT */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2 bg-card border border-border/40 p-6 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col h-[520px]">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-3">
              <Bot className="w-4 h-4 text-primary animate-pulse" /> Admin Intelligence Engine
            </h3>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              {aiResponse ? (
                <div className="space-y-4">
                  {/* User query */}
                  <div className="flex items-start gap-2.5 justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl max-w-md font-semibold leading-relaxed shadow-sm">
                      {aiPrompt}
                    </div>
                  </div>
                  
                  {/* AI Response card */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                    <div className="bg-muted/30 border border-border/30 p-4 rounded-2xl flex-1 leading-relaxed text-foreground prose dark:prose-invert max-w-none font-semibold overflow-x-auto">
                      <div className="whitespace-pre-line">{aiResponse}</div>
                      
                      {draftNotification && (
                        <div className="mt-4 border-t border-border/50 pt-4 space-y-3">
                          <div className="bg-card border border-primary/25 rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
                            <span className="text-[10px] bg-primary/10 text-primary font-black uppercase px-2 py-0.5 rounded-full">AI Generated Push Draft</span>
                            <div className="mt-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Bell className="w-3.5 h-3.5 shrink-0" /> {draftNotification.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 font-semibold leading-relaxed">
                              {draftNotification.message}
                            </div>
                            <div className="text-[9px] text-indigo-500 mt-2 font-black">
                              CTA Destination: {draftNotification.ctaLink}
                            </div>
                          </div>
                          
                          <button
                            onClick={applyDraftToForm}
                            className="bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 w-full sm:w-auto"
                          >
                            <Send className="w-3 h-3" /> Apply to Notification Broadcast Form
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 py-12">
                  <Bot className="w-12 h-12 stroke-[1.5] animate-bounce" />
                  <p className="font-bold text-sm text-foreground">Ask HustiQ AI Assistant</p>
                  <p className="max-w-sm text-[11px] leading-relaxed font-semibold">
                    Request campaign plans, announcement ideas, retention drives, or push notification drafts. Realtime platform analytics will be included in the generation context.
                  </p>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center gap-2 text-muted-foreground font-bold">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>AI Assistant is writing...</span>
                </div>
              )}
            </div>

            {/* Input Prompt Box */}
            <div className="border-t border-border/20 pt-4 flex gap-2">
              <input
                type="text"
                placeholder="Ask AI or write prompt..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAiChat()
                }}
                disabled={aiLoading}
                className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/40 text-foreground font-bold"
              />
              <button
                onClick={() => handleAiChat()}
                disabled={aiLoading || !aiPrompt.trim()}
                className="bg-primary text-primary-foreground p-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prompt Templates */}
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Suggestion Templates
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
              Click any blueprint below to analyze platform metrics and instantly generate corresponding promo campaigns:
            </p>
            
            <div className="flex flex-col gap-2 pt-2">
              {templatePrompts.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiPrompt(t.prompt)
                    handleAiChat(t.prompt)
                  }}
                  disabled={aiLoading}
                  className="w-full text-left bg-muted/30 hover:bg-muted/50 border border-border/20 p-3 rounded-2xl text-xs font-bold text-foreground transition-all flex items-center justify-between group"
                >
                  <span>{t.label}</span>
                  <Sparkles className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USER DETAILS DIALOG MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border/40 max-w-md w-full p-6 rounded-3xl shadow-xl z-10 relative space-y-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-black text-foreground">User Audit Profile</h3>
                <span className="text-[10px] text-muted-foreground uppercase font-black">ID: {selectedUser.id.substring(0, 8)}...</span>
              </div>

              <div className="space-y-3 font-medium text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black uppercase">
                    {(selectedUser.full_name || selectedUser.name || 'A')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{selectedUser.full_name || selectedUser.name || 'Anonymous User'}</h4>
                    <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3.5 rounded-2xl border border-border/10">
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-semibold">User Role</span>
                    <span className="font-bold capitalize">{selectedUser.role}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-semibold">Account Status</span>
                    <span className="font-bold capitalize">{selectedUser.metadata?.status || 'active'}</span>
                  </div>
                  <div className="col-span-2 border-t border-border/10 pt-2 mt-1">
                    <span className="block text-[10px] text-muted-foreground font-semibold">Last Active Telemetry</span>
                    <span className="font-bold text-[10px]">
                      {selectedUser.metadata?.last_active_at ? new Date(selectedUser.metadata.last_active_at).toLocaleString() : 'No activity recorded'}
                    </span>
                  </div>
                </div>

                {selectedUser.metadata?.bio && (
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-bold">Bio Description</span>
                    <p className="text-muted-foreground mt-1 leading-relaxed text-[11px] font-semibold">{selectedUser.metadata.bio}</p>
                  </div>
                )}

                {selectedUser.metadata?.phone && (
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-bold">Phone Number</span>
                    <p className="text-muted-foreground mt-1 font-semibold">{selectedUser.metadata.phone}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-border/40 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
