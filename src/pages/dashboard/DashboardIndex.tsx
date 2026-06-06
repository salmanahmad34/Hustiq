import { useEffect } from 'react'
import { useAuth } from '@/store/useAuth'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProviderDashboardPage } from '@/pages/dashboard/ProviderDashboardPage'

export const DashboardIndex = () => {
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'provider') {
      console.log('Redirecting to provider dashboard')
    } else {
      console.log('Redirecting to student dashboard')
    }
  }, [user?.role])

  // If the user is a provider, route them to the specialized hiring workspace
  if (user?.role === 'provider') {
    return <ProviderDashboardPage />
  }

  // Default to student dashboard
  return <DashboardPage />
}
