import { Outlet, Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Home, MessageSquare, User, Briefcase, Zap, Bookmark, Wallet, Award, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JobDetailsPanel } from '@/components/dashboard/JobDetailsPanel'
import { QuickApplyModal } from '@/components/dashboard/QuickApplyModal'
import { PostJobModal } from '@/components/dashboard/provider/PostJobModal'
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown'
import { useAuth } from '@/store/useAuth'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'
import { NetworkStatusDetector } from '@/components/shared/NetworkStatusDetector'
import { SessionErrorRecovery } from '@/components/shared/SessionErrorRecovery'
import { BetaFeedbackModal } from '@/components/shared/BetaFeedbackModal'
import { ToastContainer } from '@/components/ui/ToastContainer'

const STUDENT_NAV = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Discover', href: ROUTES.RECOMMENDATIONS, icon: Compass },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageSquare },
  { name: 'Jobs', href: ROUTES.JOBS, icon: Briefcase },
  { name: 'Saved', href: ROUTES.SAVED, icon: Bookmark },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Growth', href: ROUTES.GROWTH, icon: Award },
  { name: 'Premium', href: ROUTES.PREMIUM, icon: Zap },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

const PROVIDER_NAV = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Discover', href: ROUTES.RECOMMENDATIONS, icon: Compass },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageSquare },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Growth', href: ROUTES.GROWTH, icon: Award },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

export const DashboardLayout = () => {
  const location = useLocation()
  const { user, error, clearError } = useAuth()
  
  const navItems = user?.role === 'provider' ? PROVIDER_NAV : STUDENT_NAV

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
            return (
              <Link
                key={item.href}
                to={item.href}
                id={`${item.name.toLowerCase()}-nav-link`}
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
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Mobile Topbar */}
        <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 font-bold text-xl gradient-text">
            <ZivaroBrandIcon size="sm" className="text-primary" />
            HustiQ
          </Link>
          <ProfileDropdown isMobile={true} />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-md flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))]">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
