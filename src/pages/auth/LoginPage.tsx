import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export const LoginPage = () => {
  const { login, loginWithGoogle, forgotPassword, isLoading, error, clearError } = useAuth()
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

  const handleGoogleSignIn = async () => {
    if (isLoading) return
    clearError()
    setFormError(null)
    try {
      await loginWithGoogle()
    } catch (err) {
      // Handled by store/errors
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
        <>
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
            className="w-full h-14 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold text-[20px] rounded-[18px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
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

        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-border/50"></div>
          <span className="flex-shrink mx-4 text-muted-foreground font-extrabold tracking-widest text-[10px] uppercase">
            Or continue with
          </span>
          <div className="flex-grow border-t border-border/50"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-14 bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 text-foreground font-bold text-[16px] rounded-[18px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm animate-fade-in"
          disabled={isLoading}
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
      </>
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
            className="w-full h-14 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold text-[20px] rounded-[18px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
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
