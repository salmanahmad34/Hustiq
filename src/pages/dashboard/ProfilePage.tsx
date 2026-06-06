import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { MapPin, BadgeCheck, Mail, Phone, Building2, Briefcase, GraduationCap, Edit2, Wallet, Camera, Bookmark, Rocket, Zap, ChevronUp, Plus, User, Bell } from 'lucide-react'
import { TrustBanner } from '@/components/trust/TrustSystem'
import { ReputationSummary } from '@/components/reviews/ReviewDisplay'
import { useAuth } from '@/store/useAuth'
import { usePostJob } from '@/store/usePostJob'
import { BrowserSettingsGuideModal } from '@/components/shared/BrowserSettingsGuideModal'

// Spring physics for snappy app-like feel
const springTransition = { type: "spring" as const, stiffness: 400, damping: 30 }

// Staggered list animation wrapper
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: springTransition }
} as const

export const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth()
  const isProvider = user?.role === 'provider'
  const navigate = useNavigate()
  const { open: openPostJob } = usePostJob()

  // Hub/Editor toggle
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  // Notification Permission State
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const getPermissionLabel = (state: NotificationPermission) => {
    if (state === 'granted') return 'Granted'
    if (state === 'denied') return 'Denied'
    return 'Not Requested'
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const updatePermission = () => {
      setPermissionState(Notification.permission)
    }

    updatePermission()

    window.addEventListener('focus', updatePermission)
    document.addEventListener('visibilitychange', updatePermission)
    const interval = setInterval(updatePermission, 2000)

    let permissionStatus: PermissionStatus | null = null
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        permissionStatus = status
        status.onchange = updatePermission
      }).catch(() => {})
    }

    return () => {
      window.removeEventListener('focus', updatePermission)
      document.removeEventListener('visibilitychange', updatePermission)
      clearInterval(interval)
      if (permissionStatus) {
        permissionStatus.onchange = null
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (!user?.id) return
    try {
      const { registerFCM } = await import('@/services/firebase/fcm')
      await registerFCM(user.id, true)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission)
      }
    } catch (err) {
      console.log('[FCM Permission] Enable notification failed.')
    }
  }

  const handleSendTestPushFromProfile = async () => {
    if (!user?.id) return
    try {
      const { useUiStore } = await import('@/store/uiStore')
      useUiStore.getState().addToast('Triggering test push notification...', 'info')
      const res = await fetch(`/api/test-notification?userId=${user.id}`)
      const data = await res.json()
      if (res.ok) {
        useUiStore.getState().addToast('Test notification sent successfully!', 'success')
      } else {
        useUiStore.getState().addToast(data.error || 'Failed to send test notification.', 'error')
      }
    } catch (err) {
      console.log('[FCM Profile Test] Failed to trigger test notification.')
    }
  }

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '')
  const [bio, setBio] = useState(user?.bio || user?.metadata?.bio || '')
  const [phone, setPhone] = useState(user?.phone || user?.metadata?.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Sync state with user data changes (e.g. initial load)
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || '')
      setBio(user.bio || user.metadata?.bio || '')
      setPhone(user.phone || user.metadata?.phone || '')
    }
  }, [user])

  const handleSaveChanges = async () => {
    setIsSaving(true)
    setSuccessMsg(null)
    try {
      await updateUserProfile({
        full_name: fullName,
        name: fullName,
        bio,
        phone
      })
      
      const { useUiStore } = await import('@/store/uiStore')
      useUiStore.getState().addToast('Profile saved successfully!', 'success')
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      const { useUiStore } = await import('@/store/uiStore')
      useUiStore.getState().addToast(err.message || 'Failed to save changes.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      try {
        await updateUserProfile({
          avatar_url: base64String,
          metadata: {
            ...user?.metadata,
            avatarUrl: base64String
          }
        })
        const { useUiStore } = await import('@/store/uiStore')
        useUiStore.getState().addToast('Profile avatar updated!', 'success')
      } catch (err: any) {
        console.error('Error updating avatar:', err)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      try {
        await updateUserProfile({
          metadata: {
            ...user?.metadata,
            coverUrl: base64String
          }
        })
        const { useUiStore } = await import('@/store/uiStore')
        useUiStore.getState().addToast('Cover photo updated!', 'success')
      } catch (err: any) {
        console.error('Error updating cover:', err)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={handleAvatarChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={handleCoverChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {!showProfileEditor ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* 1. Header Section */}
          <motion.section 
            variants={itemVariants}
            className="relative w-full rounded-3xl bg-card border border-border/50 shadow-soft-lg overflow-hidden"
          >
            {/* Cover Image/Gradient */}
            <div 
              className="h-40 sm:h-48 w-full bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 relative overflow-hidden bg-cover bg-center"
              style={user?.metadata?.coverUrl ? { backgroundImage: `url(${user.metadata.coverUrl})` } : undefined}
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              {!user?.metadata?.coverUrl && (
                <>
                  <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-primary/40 rounded-full blur-[80px]" />
                  <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 bg-accent/40 rounded-full blur-[80px]" />
                </>
              )}
            </div>

            {/* Profile Identity Area */}
            <div className="px-6 sm:px-10 pb-8 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20 relative z-10">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 shrink-0">
                    {(user?.avatar_url || user?.metadata?.avatarUrl) ? (
                      <img src={user.avatar_url || user.metadata?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-bold text-muted-foreground">
                        {user?.avatarPlaceholder || (user?.full_name || user?.name)?.charAt(0).toUpperCase() || 'Z'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Badges */}
                <div className="flex-1 space-y-2 pb-2 text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      {user?.full_name || user?.name || 'HustiQ User'}
                      <BadgeCheck className="w-6 h-6 text-primary" />
                    </h1>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {isProvider ? <Building2 className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                      {isProvider ? 'Verified Provider' : 'Verified Student'}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      Mumbai, Maharashtra
                    </span>
                  </div>

                  <TrustBanner
                    role={user?.role ?? 'student'}
                    isVerified={true}
                    trustScore={88}
                    responseRate={isProvider ? 94 : undefined}
                    completedJobs={isProvider ? undefined : 7}
                    reliabilityLevel={isProvider ? 'high' : undefined}
                    className="mt-1"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pb-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowProfileEditor(true)}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-foreground text-background font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 2. Grid of Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Profile Settings */}
            <motion.div
              variants={itemVariants}
              onClick={() => setShowProfileEditor(true)}
              className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
              </div>
              <div className="mt-8">
                <h3 className="font-bold text-lg text-foreground">Profile Settings</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isProvider ? 'Edit business logo, name, description, and contact info.' : 'Edit display name, bio, phone number, and avatar photos.'}
                </p>
              </div>
            </motion.div>

            {/* Card 2: Saved Gigs (Student) or Post Job (Provider) */}
            {!isProvider ? (
              <motion.div
                variants={itemVariants}
                onClick={() => navigate(ROUTES.SAVED)}
                className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
                </div>
                <div className="mt-8">
                  <h3 className="font-bold text-lg text-foreground">Saved Gigs</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    View and manage your bookmarked weekend gigs and shifts.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                onClick={openPostJob}
                className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
                </div>
                <div className="mt-8">
                  <h3 className="font-bold text-lg text-foreground">Post a Job</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Launch and publish a new shift or weekend opportunity for workers.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Card 3: Growth Tracker */}
            <motion.div
              variants={itemVariants}
              onClick={() => navigate(ROUTES.GROWTH)}
              className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6" />
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
              </div>
              <div className="mt-8">
                <h3 className="font-bold text-lg text-foreground">Growth Tracker</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Analyze your earning trajectory, shift metrics, and milestones.
                </p>
              </div>
            </motion.div>

            {/* Card 4: Premium Plan (Student) or empty/Wallet (Provider) */}
            {!isProvider && (
              <motion.div
                variants={itemVariants}
                onClick={() => navigate(ROUTES.PREMIUM)}
                className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
                </div>
                <div className="mt-8">
                  <h3 className="font-bold text-lg text-foreground">Premium Plans</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Upgrade to get matching boosts, priority tags, and verifications.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Card 5: Wallet & Ledger */}
            <motion.div
              variants={itemVariants}
              onClick={() => navigate(ROUTES.WALLET)}
              className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
              </div>
              <div className="mt-8">
                <h3 className="font-bold text-lg text-foreground">Wallet & Ledger</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Track offline settlements, record payments, and manage balances.
                </p>
              </div>
            </motion.div>

            {/* Card 6: Applications */}
            <motion.div
              variants={itemVariants}
              onClick={() => navigate(ROUTES.JOBS)}
              className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
              </div>
              <div className="mt-8">
                <h3 className="font-bold text-lg text-foreground">
                  {isProvider ? 'Manage Jobs' : 'Applications'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isProvider ? 'Manage applicant details and view shift applications.' : 'Track active job applications, statuses, and history.'}
                </p>
              </div>
            </motion.div>

            {/* Card 7: Notification Settings */}
            <motion.div
              variants={itemVariants}
              className="glass-card p-6 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg text-left"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl transition-transform ${
                    permissionState === 'granted' ? 'bg-emerald-500/10 text-emerald-500' :
                    permissionState === 'denied' ? 'bg-rose-500/10 text-rose-500 animate-pulse' :
                    'bg-primary/10 text-primary'
                  }`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    permissionState === 'granted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    permissionState === 'denied' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                    'bg-muted text-muted-foreground border border-border/60'
                  }`}>
                    {getPermissionLabel(permissionState)}
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="font-bold text-lg text-foreground">Notification Settings</h3>
                  
                  {permissionState === 'granted' && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Push notifications are active! You will receive instant alerts for accepted applications, new nearby gigs, and incoming messages.
                    </p>
                  )}
                  {permissionState === 'denied' && (
                    <div className="space-y-3 mt-2">
                      <p className="text-xs text-rose-500 font-semibold leading-relaxed">
                        Notifications are currently blocked in your browser.
                      </p>
                      <div className="p-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl space-y-1.5">
                        <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-rose-500 leading-none">To unblock:</h4>
                        <ol className="list-decimal pl-4 text-[10px] text-muted-foreground space-y-1">
                          <li>Click the <strong>Lock icon</strong> (🔒) in your browser address bar.</li>
                          <li>Find <strong>Notifications</strong> under site settings.</li>
                          <li>Set permission to <strong>Allow</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  )}
                  {permissionState === 'default' && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Stay updated on shift invitations, payout status, and new applicant matching alerts instantly.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {permissionState === 'default' && (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-sm border border-primary/20 text-center"
                  >
                    Enable Notifications
                  </button>
                )}

                {permissionState === 'denied' && (
                  <button
                    onClick={() => setIsGuideOpen(true)}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-sm border border-rose-600 text-center"
                  >
                    Open Browser Notification Settings
                  </button>
                )}

                {permissionState === 'granted' && (
                  <button
                    onClick={handleSendTestPushFromProfile}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-sm border border-emerald-600 text-center"
                  >
                    Send Test Notification
                  </button>
                )}
              </div>
            </motion.div>

          </div>

          {/* Reputation Summary */}
          <motion.div variants={itemVariants}>
            <ReputationSummary
              subjectId={isProvider ? 'mock-provider' : 'mock-student'}
              title={isProvider ? 'Your Business Reviews' : 'Your Reviews'}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Back Button */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <button
              onClick={() => setShowProfileEditor(false)}
              className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ChevronUp className="w-4 h-4 -rotate-90" /> Back to Menu Hub
            </button>
            <h2 className="text-xl font-black text-foreground tracking-tight animate-fade-in">Profile Settings</h2>
          </div>

          {/* 1. Header Section (for Cover and Avatar upload) */}
          <motion.section 
            variants={itemVariants}
            className="relative w-full rounded-3xl bg-card border border-border/50 shadow-soft-lg overflow-hidden animate-fade-in"
          >
            {/* Cover Image/Gradient */}
            <div 
              className="h-40 sm:h-48 w-full bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 relative overflow-hidden bg-cover bg-center"
              style={user?.metadata?.coverUrl ? { backgroundImage: `url(${user.metadata.coverUrl})` } : undefined}
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              {!user?.metadata?.coverUrl && (
                <>
                  <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-primary/40 rounded-full blur-[80px]" />
                  <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 bg-accent/40 rounded-full blur-[80px]" />
                </>
              )}
              
              {/* Edit Cover Button */}
              <button 
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background/80 backdrop-blur-md rounded-full text-foreground transition-all shadow-sm z-10 animate-fade-in"
                title="Upload cover photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Identity Area */}
            <div className="px-6 sm:px-10 pb-8 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20 relative z-10">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 shrink-0">
                    {(user?.avatar_url || user?.metadata?.avatarUrl) ? (
                      <img src={user.avatar_url || user.metadata?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-bold text-muted-foreground">
                        {user?.avatarPlaceholder || (user?.full_name || user?.name)?.charAt(0).toUpperCase() || 'Z'}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-foreground text-background rounded-full shadow-lg hover:scale-105 transition-transform"
                    title="Upload profile photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 pb-2 text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      {user?.full_name || user?.name || 'HustiQ User'}
                    </h1>
                  </div>
                  <p className="text-xs text-muted-foreground">Click the icons to upload cover and avatar photos</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Form and Stats block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              {/* Info Card */}
              <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4 border border-border/50 shadow-soft-lg text-left">
                <h3 className="font-bold text-base text-foreground">Why edit?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Keeping your contact number, bio, and business profile updated helps in matching with shifts and ensuring clean verification across the platform.
                </p>
              </motion.div>
            </div>

            {/* Editable Form */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div variants={itemVariants} className="glass-card rounded-2xl shadow-soft-lg overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-border/50 bg-muted/10 text-left">
                  <h2 className="text-xl font-bold text-foreground">Profile Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update your personal details and public presence.</p>
                </div>
                
                <div className="p-6 sm:p-8 space-y-6">
                  {successMsg && (
                    <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl text-xs font-semibold leading-relaxed">
                      {successMsg}
                    </div>
                  )}

                  {/* Name Section */}
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-foreground">Display Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Bio Section */}
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-foreground">{isProvider ? 'Business Description' : 'About Me'}</label>
                    <textarea 
                      className="w-full h-32 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed font-medium text-sm"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={isProvider ? "Describe your business, culture, and what kind of students you're looking for..." : "Write a short bio about yourself, your studies, and the types of gigs you prefer..."}
                      disabled={isSaving}
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
                      </label>
                      <input 
                        type="email" 
                        className="w-full bg-muted/20 border border-border/80 rounded-xl px-4 py-3 text-foreground/60 cursor-not-allowed font-semibold text-sm"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number
                      </label>
                      <input 
                        type="tel" 
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-sm"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXXXXXXX"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* Save Actions */}
                  <div className="pt-6 mt-6 border-t border-border/50 flex items-center justify-end gap-4">
                    <button 
                      type="button"
                      onClick={() => {
                        if (user) {
                          setFullName(user.full_name || user.name || '')
                          setBio(user.bio || user.metadata?.bio || '')
                          setPhone(user.phone || user.metadata?.phone || '')
                        }
                        setShowProfileEditor(false)
                      }}
                      className="px-6 py-2.5 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm focus:outline-none"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={async () => {
                        await handleSaveChanges()
                        setShowProfileEditor(false)
                      }}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-black text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:active:scale-100"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
      <BrowserSettingsGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  )
}
