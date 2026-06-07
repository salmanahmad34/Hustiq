import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { recoverSession, buildUserSession } from '@/services/supabase/auth'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'

/**
 * AuthCallbackPage
 *
 * Handles the redirect from Google OAuth (and any Supabase auth callback).
 * Reads the actual profile role from the database and routes the user to the
 * correct dashboard. Never hardcodes the destination.
 *
 * Flow:
 *   Google OAuth completes
 *     → Supabase redirects to /auth/callback
 *     → This page recovers the session
 *     → Fetches profile from DB via buildUserSession
 *     → Reads real role from profile row
 *     → Redirects: provider → /dashboard (DashboardIndex handles role routing)
 *                  student  → /dashboard
 */
export const AuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Auth] OAuth callback received — recovering session...')

        // Recover session from Supabase (handles the OAuth token exchange)
        const session = await recoverSession()

        if (!session || !session.user) {
          console.error('[Auth] No session found after OAuth callback — redirecting to login')
          navigate(ROUTES.LOGIN, { replace: true })
          return
        }

        const { id: userId, email } = session.user
        console.log('[Auth] Session recovered for user:', userId)

        // Build the full user session — this reads the REAL role from the DB profile row
        const userSession = await buildUserSession(userId, email || '')

        if (!userSession) {
          console.error('[Auth] Failed to build user session — redirecting to login')
          navigate(ROUTES.LOGIN, { replace: true })
          return
        }

        // Set user in auth store
        useAuth.setState({
          user: userSession,
          isAuthenticated: true,
          isRecovering: false,
          error: null,
        })

        const role = userSession.role
        console.log('[Auth] User role from DB:', role)

        // DashboardIndex already handles role-based routing (student vs provider).
        // We send everyone to /dashboard — the role is correctly set in the store.
        if (role === 'admin') {
          console.log('[Auth] Redirecting admin to /admin')
          navigate(ROUTES.ADMIN, { replace: true })
        } else if (role === 'provider') {
          console.log('[Auth] Redirecting provider to /dashboard (provider workspace)')
          navigate(ROUTES.DASHBOARD, { replace: true })
        } else {
          console.log('[Auth] Redirecting student to /dashboard')
          navigate(ROUTES.DASHBOARD, { replace: true })
        }
      } catch (err) {
        console.error('[Auth] Auth callback error:', err)
        navigate(ROUTES.LOGIN, { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-sm font-semibold text-muted-foreground animate-pulse">
        Signing you in…
      </p>
    </div>
  )
}
