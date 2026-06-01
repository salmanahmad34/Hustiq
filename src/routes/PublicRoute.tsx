import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/store/useAuth'

export const PublicRoute = () => {
  const { isAuthenticated, isRecovering } = useAuth()
  const location = useLocation()

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

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
