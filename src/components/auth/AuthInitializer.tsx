import { useEffect, useState } from 'react'
import { useAuth } from '@/store/useAuth'
import { LogoLoader } from '@/components/shared/LogoLoader'

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { recoverUserSession } = useAuth()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // If coming back from OAuth, wait briefly for Supabase to parse the URL hash
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('[AuthInitializer] Detected OAuth hash. Waiting for Supabase processing...')
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Recover the session globally
        await recoverUserSession()
      } catch (error) {
        console.error('[AuthInitializer] Error during initialization:', error)
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [recoverUserSession])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <LogoLoader text="Authenticating session..." />
      </div>
    )
  }

  return <>{children}</>
}
