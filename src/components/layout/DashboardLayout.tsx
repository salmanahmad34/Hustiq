import { Outlet, Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Home, MessageCircle, User, Briefcase, Zap, Bookmark, Wallet, Award, Compass } from 'lucide-react'
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
  { name: 'Jobs', href: ROUTES.JOBS, icon: Briefcase },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
  { name: 'Saved', href: ROUTES.SAVED, icon: Bookmark },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Growth', href: ROUTES.GROWTH, icon: Award },
  { name: 'Premium', href: ROUTES.PREMIUM, icon: Zap },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

const PROVIDER_NAV = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Discover', href: ROUTES.RECOMMENDATIONS, icon: Compass },
  { name: 'Messages', href: ROUTES.MESSAGES, icon: MessageCircle },
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <div className="bg-background/85 backdrop-blur-2xl border-t border-border/50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] rounded-t-3xl flex items-center justify-around px-2 h-[72px] pointer-events-auto relative">
          {navItems.slice(0, 5).map((item, index) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            const isCenter = index === 2

            if (isCenter) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex flex-col items-center justify-start w-16 h-full relative group z-10"
                >
                  <div className={cn(
                    "absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(var(--primary),0.4)] transition-transform duration-300 active:scale-95",
                    isActive ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground opacity-95 hover:scale-105"
                  )}>
                    <Icon className="w-6 h-6" fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "absolute top-[44px] text-[10px] font-bold transition-colors whitespace-nowrap",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.name}
                  </span>
                  <div className={cn(
                    "absolute bottom-2 w-4 h-1 rounded-full bg-primary transition-all duration-300",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )} />
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-start w-16 h-full relative group pt-3.5"
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                  fill={isActive ? "currentColor" : "none"} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-semibold transition-colors duration-300 whitespace-nowrap mt-1.5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.name}
                </span>
                <div className={cn(
                  "absolute bottom-2 w-4 h-1 rounded-full bg-primary transition-all duration-300",
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                )} />
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
