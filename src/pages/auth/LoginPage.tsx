import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export const LoginPage = () => {
  const { login, forgotPassword, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Clear errors on load or mode change
  useEffect(() => {
    clearError()
    setFormError(null)
    setSuccessMessage(null)
  }, [clearError, mode])

  const handleRealLogin = async (e: FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setFormError(null)
    clearError()

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password.')
      return
    }

    try {
      await login(email, password)
      navigate(ROUTES.SPLASH)
    } catch (err: any) {
      // Error handled by store/errors
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setFormError(null)
    clearError()
    setSuccessMessage(null)

    if (!email.trim()) {
      setFormError('Please enter your email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.')
      return
    }

    try {
      await forgotPassword(email)
      setSuccessMessage('We have sent a password reset link to your email. Please check your inbox.')
    } catch (err: any) {
      // Error handled by store/errors
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full text-left pb-20 md:pb-0">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
          {mode === 'login' ? 'Welcome back' : 'Reset Password'}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          {mode === 'login' 
            ? 'Access your personalized HustiQ workspace' 
            : 'Enter your email to receive a recovery link'
          }
        </p>
      </div>

      {(error || formError) && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold leading-relaxed">
          {error || formError}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl text-xs font-semibold leading-relaxed">
          {successMessage}
        </div>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleRealLogin} className="flex flex-col space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1 pr-1">
              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Password</label>
              <button 
                type="button" 
                onClick={() => setMode('forgot')} 
                className="text-xs font-bold text-primary hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-16 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold text-[22px] rounded-[22px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleForgotPassword} className="flex flex-col space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-16 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold text-[22px] rounded-[22px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode('login')}
            className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground py-2 focus:outline-none"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground font-semibold mt-4">
        Don't have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="font-extrabold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
