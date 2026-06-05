/**
 * Session Error Recovery Component
 * Handles auth/session failures and provides recovery options
 */

import { AlertCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { useNavigate } from 'react-router-dom'

interface SessionErrorProps {
  error: string
  onDismiss?: () => void
}

export const SessionErrorRecovery = ({ error, onDismiss }: SessionErrorProps) => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.HOME)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold max-w-sm z-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="mb-3">{error}</p>
          <div className="flex gap-2">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1 rounded bg-destructive/20 hover:bg-destructive/30 transition-colors"
              >
                Dismiss
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-destructive/20 hover:bg-destructive/30 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
