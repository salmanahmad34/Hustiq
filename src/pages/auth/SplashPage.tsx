import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'

export const SplashPage = () => {
  const { setSplashShown } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('Splash mounted')
  }, [])

  const handleComplete = () => {
    console.log('Splash finished')
    setSplashShown(true)
    const redirectTo = location.state?.redirectTo || ROUTES.DASHBOARD
    navigate(redirectTo, { replace: true })
  }

  return <SplashScreen onComplete={handleComplete} />
}
