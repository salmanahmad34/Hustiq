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

const STUDENT_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Discover', href: ROUTES.RECOMMENDATIONS, icon: Compass },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Menu', href: ROUTES.PROFILE, icon: LayoutGrid },
]

const PROVIDER_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Chat', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Post a Job', href: '#', icon: Plus, action: 'post-job' },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Menu', href: ROUTES.PROFILE, icon: LayoutGrid },
]

const ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Admin Panel', href: ROUTES.ADMIN, icon: Shield },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Menu', href: ROUTES.PROFILE, icon: LayoutGrid },
]

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
  
  const navItems = user?.role === 'admin' 
    ? ADMIN_NAV 
    : user?.role === 'provider' 
      ? PROVIDER_NAV 
      : STUDENT_NAV

  const mobileNavItems = user?.role === 'admin' 
    ? MOBILE_ADMIN_NAV 
    : user?.role === 'provider' 
      ? MOBILE_PROVIDER_NAV 
      : MOBILE_STUDENT_NAV

  const centerNavItems = navItems.filter(item => 
    item.name !== 'Notifications' && 
    item.name !== 'Menu' && 
    item.action !== 'post-job'
  )

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

      {/* Desktop Floating Navbar */}
      {!isChatRoute && (
        <header className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-7xl h-16 bg-card/85 backdrop-blur-md border border-border/40 rounded-full px-6 items-center justify-between shadow-soft">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
            <ZivaroBrandIcon size="md" className="text-primary" />
            <span className="font-bold text-2xl gradient-text">HustiQ</span>
          </Link>

          <nav className="flex items-center gap-2">
            {centerNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  id={`${item.name.toLowerCase().replace(/\s+/g, '-')}-nav-link`}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-semibold transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-4">
            {user?.role === 'provider' && (
              <button
                onClick={openPostJob}
                className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full flex items-center gap-1.5 shadow-soft hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Post a Job</span>
              </button>
            )}

            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => useNotifications.getState().toggleOpen()}
                className="w-10 h-10 rounded-full bg-muted/40 hover:bg-muted/60 text-foreground flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform relative notification-bell-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
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
      <div className={cn(
        "flex-1 flex flex-col min-w-0 md:pb-0",
        isChatRoute ? "pb-0" : "pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
      )}>
        {/* Mobile Topbar */}
        {!isChatRoute && (
          <header className="md:hidden fixed top-3 left-4 right-4 z-40 bg-background/80 backdrop-blur-md border border-border/40 rounded-full px-4 h-12 flex items-center justify-between shadow-md">
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 font-bold text-lg gradient-text">
              <ZivaroBrandIcon size="xs" className="text-primary" />
              HustiQ
            </Link>
            <div className="flex items-center gap-2.5">
              {user?.role === 'provider' && (
                <button
                  onClick={openPostJob}
                  className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              
              <div className="relative">
                <button
                  id="notification-bell-btn-mobile"
                  onClick={() => useNotifications.getState().toggleOpen()}
                  className="w-7 h-7 rounded-full bg-muted/40 hover:bg-muted/60 text-foreground flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform relative notification-bell-btn"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
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

        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-auto",
          isChatRoute ? "p-0" : "p-4 md:p-8 pt-[76px] md:pt-[104px]"
        )}>
          <div className={cn(
            "max-w-[1600px] mx-auto w-full h-full",
            isChatRoute && "max-w-none"
          )}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {!isChatRoute && (
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[520px] pointer-events-none">
          <div className="bg-background/80 backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[32px] flex items-center justify-around px-2 h-16 pointer-events-auto relative">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              if (item.action === 'post-job') {
                return (
                  <button
                    key={item.name}
                    onClick={openPostJob}
                    className="flex flex-col items-center justify-center flex-1 h-full relative group py-1.5 z-10 text-muted-foreground hover:text-foreground"
                  >
                    <div className="relative flex flex-col items-center justify-center">
                      <Icon className="w-5 h-5 transition-all duration-300" />
                      <span className="text-[10px] font-semibold transition-colors mt-0.5 whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full relative group py-1.5 z-10",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative flex flex-col items-center justify-center">
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-all duration-300",
                        isActive ? "scale-110" : ""
                      )} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={cn(
                      "text-[10px] font-semibold transition-colors duration-300 whitespace-nowrap mt-0.5",
                      isActive ? "font-bold" : ""
                    )}>
                      {item.name}
                    </span>
                  </div>
                  {/* Active Pill Indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute inset-x-2 inset-y-1.5 bg-primary/10 dark:bg-primary/25 rounded-2xl -z-10"
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
