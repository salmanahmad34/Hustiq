import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/store/useAuth'
import { LogoLoader } from '@/components/shared/LogoLoader'

export const AdminRoute = () => {
  const { user, isAuthenticated, isRecovering } = useAuth()

  // Show nothing or loader while recovering session
  if (isRecovering) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <LogoLoader text="Verifying admin access..." />
      </div>
    )
  }

  // Redirect to dashboard/home if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    console.log('[AdminRoute] Access denied. Non-admin or unauthenticated user redirecting.')
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
