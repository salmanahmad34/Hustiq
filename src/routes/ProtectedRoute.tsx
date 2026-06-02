import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/store/useAuth'

export const ProtectedRoute = () => {
  const { isAuthenticated, isRecovering } = useAuth()
  const location = useLocation()

  console.log('auth state', {
    isAuthenticated,
    isRecovering,
    pathname: location.pathname
  })

  // Show nothing while recovering session
  if (isRecovering) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login.')
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Render protected routes
  return <Outlet />
}
