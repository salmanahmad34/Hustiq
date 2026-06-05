import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/store/useAuth'
import { LogoLoader } from '@/components/shared/LogoLoader'

export const ProtectedRoute = () => {
  const { isAuthenticated, isRecovering, hasShownSplash } = useAuth()
  const location = useLocation()

  console.log('auth state', {
    isAuthenticated,
    isRecovering,
    hasShownSplash,
    pathname: location.pathname
  })

  // Show nothing while recovering session
  if (isRecovering) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <LogoLoader text="Loading your workspace..." />
      </div>
    )
  }

  // Redirect to landing page if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to landing page.')
    return <Navigate to={ROUTES.HOME} replace />
  }

  // Redirect to splash if not yet shown during this session, unless already visiting it
  if (!hasShownSplash && location.pathname !== ROUTES.SPLASH) {
    console.log(`[ProtectedRoute] Splash screen not shown yet in this session. Redirecting to /splash from ${location.pathname}`)
    return <Navigate to={ROUTES.SPLASH} state={{ redirectTo: location.pathname }} replace />
  }

  // Render protected routes
  return <Outlet />
}
