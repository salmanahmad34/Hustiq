import { Outlet, Navigate } from 'react-router-dom'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { BetaFeedbackModal } from '@/components/shared/BetaFeedbackModal'

export const LandingLayout = () => {
  const { isAuthenticated, isRecovering } = useAuth()
  
  if (isAuthenticated && !isRecovering) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col scroll-smooth overflow-x-hidden w-full">
      <LandingNavbar />
      
      <main className="flex-1 w-full flex flex-col items-center">
        <Outlet />
      </main>

      <BetaFeedbackModal />
    </div>
  )
}
