import { Outlet, Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Home, MessageCircle, User, Wallet, Compass, Plus, Rocket } from 'lucide-react'
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
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

const PROVIDER_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Chat', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Post a Job', href: '#', icon: Plus, action: 'post-job' },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Growth', href: ROUTES.GROWTH, icon: Rocket },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

const MOBILE_STUDENT_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Discover', href: ROUTES.RECOMMENDATIONS, icon: Compass },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

const MOBILE_PROVIDER_NAV: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Chat', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Growth', href: ROUTES.GROWTH, icon: Rocket },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

export const DashboardLayout = () => {
  const location = useLocation()
  const { user, error, clearError } = useAuth()
  const { open: openPostJob } = usePostJob()
  
  const navItems = user?.role === 'provider' ? PROVIDER_NAV : STUDENT_NAV
  const mobileNavItems = user?.role === 'provider' ? MOBILE_PROVIDER_NAV : MOBILE_STUDENT_NAV

  const isChatRoute = 
    location.pathname.startsWith('/chat/') || 
    location.pathname.startsWith('/conversation/') || 
    (location.pathname.startsWith('/messages/') && location.pathname !== '/messages')

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <JobDetailsPanel />
      <QuickApplyModal />
      <PostJobModal />
      <NetworkStatusDetector />
      {error && <SessionErrorRecovery error={error} onDismiss={clearError} />}
      <BetaFeedbackModal />
      <ToastContainer />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-card px-4 py-6">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <ZivaroBrandIcon size="md" className="text-primary" />
          <Link to={ROUTES.DASHBOARD} className="font-bold text-2xl gradient-text">HustiQ</Link>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            if (item.action === 'post-job') {
              return (
                <button
                  key={item.name}
                  onClick={openPostJob}
                  id={`${item.name.toLowerCase().replace(/\s+/g, '-')}-nav-link`}
                  className={cn(
                    "flex items-center w-full space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                    "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                id={`${item.name.toLowerCase().replace(/\s+/g, '-')}-nav-link`}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto w-full">
          <ProfileDropdown />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 md:pb-0",
        isChatRoute ? "pb-0" : "pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
      )}>
        {/* Mobile Topbar */}
        {!isChatRoute && (
          <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 font-bold text-xl gradient-text">
              <ZivaroBrandIcon size="sm" className="text-primary" />
              HustiQ
            </Link>
            <div className="flex items-center gap-3">
              {user?.role === 'provider' && (
                <button
                  onClick={openPostJob}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <ProfileDropdown isMobile={true} />
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-auto",
          isChatRoute ? "p-0" : "p-4 md:p-8"
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] pointer-events-none">
          <div className="bg-background/90 backdrop-blur-2xl border-t border-border/50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] rounded-t-3xl flex items-center justify-around px-2 h-[68px] pointer-events-auto relative">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex flex-col items-center justify-center w-16 h-full relative group pt-1"
                >
                  <div className="relative flex flex-col items-center justify-center">
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-all duration-300",
                        isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
                      )} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={cn(
                      "text-[10px] font-semibold transition-colors duration-300 whitespace-nowrap mt-1",
                      isActive ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                      {item.name}
                    </span>
                  </div>
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-1.5 w-6 h-1 rounded-full bg-gradient-to-r from-primary to-accent"
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
