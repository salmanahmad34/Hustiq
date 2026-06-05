import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/store/useAuth'
import { LogoLoader } from '@/components/shared/LogoLoader'
import { supabase } from '@/services/supabase/supabaseClient'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useNotifications } from '@/store/useNotifications'
import { useAppliedJobs } from '@/store/useAppliedJobs'
import { useSavedJobs } from '@/store/useSavedJobs'

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { recoverUserSession, resetPassword, user } = useAuth()
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Password Reset / Recovery states
  const [isResetMode, setIsResetMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Manage data loaders and realtime notifications subscription
  useEffect(() => {
    if (user?.id) {
      // 1. Fetch initial notifications
      useNotifications.getState().loadNotifications(user.id, user.role)
      // 2. Subscribe to realtime updates
      useNotifications.getState().subscribeToNotifications(user.id, user.role)
      // 3. Load applied jobs
      useAppliedJobs.getState().loadAppliedJobs(user.id, user.role)
      // 4. Load saved jobs for students
      if (user.role === 'student') {
        useSavedJobs.getState().loadSavedJobs(user.id)
      }
      // 5. Register FCM Push Notifications
      import('@/services/firebase/fcm').then(({ registerFCM }) => {
        registerFCM(user.id)
      }).catch(err => console.error('[AuthInitializer] Failed to register FCM:', err))
    } else {
      useNotifications.getState().unsubscribeFromNotifications()
    }

    return () => {
      useNotifications.getState().unsubscribeFromNotifications()
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // If coming back from OAuth/recovery, wait briefly for Supabase to parse the URL hash
        if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
          console.log('[AuthInitializer] Detected hash token. Waiting for Supabase processing...')
          await new Promise(resolve => setTimeout(resolve, 800))
        }

        // Check if the URL has type=recovery
        if (window.location.hash && window.location.hash.includes('type=recovery')) {
          console.log('[AuthInitializer] Found recovery type in hash.')
          setIsResetMode(true)
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

    // Register listener for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('[AuthInitializer] Auth State Changed Event:', event)
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [recoverUserSession])

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (isResetting) return

    setResetError(null)

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.')
      return
    }

    setIsResetting(true)
    try {
      await resetPassword(newPassword)
      setResetSuccess(true)
      
      // Wait for 2 seconds to let the user see the success, then close reset mode
      setTimeout(() => {
        setIsResetMode(false)
        // Clean URL hashes
        window.history.replaceState(null, '', window.location.pathname)
      }, 2000)
    } catch (err: any) {
      setResetError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <LogoLoader text="Authenticating session..." />
      </div>
    )
  }

  if (isResetMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 overflow-y-auto">
        <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">New Password</h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Create a secure new password for your HustiQ account
            </p>
          </div>

          {resetError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold leading-relaxed">
              {resetError}
            </div>
          )}

          {resetSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-primary animate-bounce" />
              <p className="text-sm font-extrabold text-foreground">Password updated successfully!</p>
              <p className="text-xs text-muted-foreground">Redirecting you to HustiQ...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="flex flex-col space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                    disabled={isResetting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                    disabled={isResetting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="h-13 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm mt-2"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
