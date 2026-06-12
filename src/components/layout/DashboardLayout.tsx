import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Home, MessageCircle, Wallet, Compass, Plus, LayoutGrid, Bell, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JobDetailsPanel } from '@/components/dashboard/JobDetailsPanel'
import { QuickApplyModal } from '@/components/dashboard/QuickApplyModal'
import { PostJobModal } from '@/components/dashboard/provider/PostJobModal'
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown'
import { useAuth } from '@/store/useAuth'
import { usePostJob } from '@/store/usePostJob'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'
import { NetworkStatusDetector } from '@/components/shared/NetworkStatusDetector'
import { SessionErrorRecovery } from '@/components/shared/SessionErrorRecovery'
import { BetaFeedbackModal } from '@/components/shared/BetaFeedbackModal'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { motion } from 'framer-motion'
import { useNotifications } from '@/store/useNotifications'
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown'

interface NavItem {
  name: string
  href: string
  icon: any
  action?: string
}



const MOBILE_STUDENT_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Discover', href: ROUTES.RECOMMENDATIONS, icon: Compass },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Menu', href: ROUTES.PROFILE, icon: LayoutGrid },
]

const MOBILE_PROVIDER_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Chat', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Post', href: '#', icon: Plus, action: 'post-job' },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Menu', href: ROUTES.PROFILE, icon: LayoutGrid },
]

const MOBILE_ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Admin', href: ROUTES.ADMIN, icon: Shield },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Menu', href: ROUTES.PROFILE, icon: LayoutGrid },
]

export const DashboardLayout = () => {
  const location = useLocation()
  const { user, error, clearError, updateUserProfile } = useAuth()
  const { open: openPostJob } = usePostJob()
  const { notifications } = useNotifications()

  // Track active status for analytics (DAU/WAU tracking)
  useEffect(() => {
    if (user?.id && user?.role) {
      const now = new Date().toISOString()
      const lastActive = user.metadata?.last_active_at
      const fiveMinsMs = 1000 * 60 * 5

      const shouldUpdate = !lastActive || (Date.now() - new Date(lastActive).getTime() > fiveMinsMs)

      if (shouldUpdate) {
        console.log('[DashboardLayout] Updating active telemetry for user:', user.id)
        updateUserProfile({
          metadata: {
            ...(user.metadata || {}),
            last_active_at: now
          }
        }).catch(err => {
          console.warn('[DashboardLayout] Failed to update user activity telemetry:', err)
        })
      }
    }
  }, [user?.id, user?.role])
  
  const mobileNavItems = user?.role === 'admin' 
    ? MOBILE_ADMIN_NAV 
    : user?.role === 'provider' 
      ? MOBILE_PROVIDER_NAV 
      : MOBILE_STUDENT_NAV

  const activeRole = user?.role || 'student'
  const unreadCount = notifications.filter(n => n.role === activeRole && n.isUnread).length

  const isChatRoute = 
    location.pathname.startsWith('/chat/') || 
    location.pathname.startsWith('/conversation/') || 
    (location.pathname.startsWith('/messages/') && location.pathname !== '/messages')

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden w-full">
      <JobDetailsPanel />
      <QuickApplyModal />
      <PostJobModal />
      <NetworkStatusDetector />
      {error && <SessionErrorRecovery error={error} onDismiss={clearError} />}
      <BetaFeedbackModal />
      <ToastContainer />

      {/* Top Floating Utility Header */}
      {!isChatRoute && (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-7xl h-14 bg-card/85 backdrop-blur-[20px] border border-border/40 rounded-full px-5 flex items-center justify-between shadow-soft">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 font-bold text-xl gradient-text shrink-0">
            <ZivaroBrandIcon size="sm" className="text-primary" />
            <span className="hidden sm:inline">HustiQ</span>
          </Link>

          <div className="flex items-center gap-3">
            {user?.role === 'provider' && (
              <button
                onClick={openPostJob}
                className="bg-primary text-primary-foreground text-sm font-semibold h-9 px-3 sm:px-5 rounded-full flex items-center gap-1.5 shadow-soft hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Post a Job</span>
              </button>
            )}

            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => useNotifications.getState().toggleOpen()}
                className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/60 text-foreground flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform relative notification-bell-btn"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown />
            </div>

            <ProfileDropdown isMobile={true} />
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-auto",
          isChatRoute ? "p-0" : "p-4 md:p-8 pt-[88px] md:pt-[96px] pb-[104px] md:pb-[112px]"
        )}>
          <div className={cn(
            "max-w-[1600px] mx-auto w-full h-full",
            isChatRoute && "max-w-none"
          )}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Floating iOS-style Navigation Dock */}
      {!isChatRoute && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-max pointer-events-none">
          <div className="bg-background/85 backdrop-blur-[20px] border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full px-4 h-[72px] flex items-center justify-center gap-3 pointer-events-auto relative">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              if (item.action === 'post-job') {
                return (
                  <button
                    key={item.name}
                    onClick={openPostJob}
                    className="w-12 h-12 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    <Icon className="w-6 h-6 transition-all duration-300" />
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 z-10",
                    isActive ? "text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      isActive ? "scale-110" : ""
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Active Indicator Bubble */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeDockIndicator"
                      className="absolute inset-0 bg-foreground rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
