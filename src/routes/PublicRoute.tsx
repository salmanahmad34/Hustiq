import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/store/useAuth'

export const PublicRoute = () => {
  const { isAuthenticated, isRecovering, isSplashActive } = useAuth()
  const location = useLocation()

  console.log('auth state', {
    isAuthenticated,
    isRecovering,
    isSplashActive,
    pathname: location.pathname
  })

  // Always allow access to OAuth callback to process the token
  // If we don't do this, Supabase might set isAuthenticated syncly 
  // and redirect to dashboard before the callback finishes its onboarding check.
  if (location.pathname.includes('/auth/callback')) {
    return <Outlet />
  }

  // Don't redirect while recovering session
  if (isRecovering) {
    return <Outlet />
  }

  // Redirect authenticated users to dashboard if splash is not active
  if (isAuthenticated && !isSplashActive) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
