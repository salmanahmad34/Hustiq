// @ts-nocheck
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { User, Briefcase, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { SplashScreen } from '@/components/shared/SplashScreen'

export const LoginPage = () => {
  const { login, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Clear errors on load
  useEffect(() => {
    clearError()
    setFormError(null)
  }, [clearError])

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
      setShowSplash(true)
    } catch (err: any) {
      // Error handled by store/errors
    }
  }

  const handleMockLogin = async (role: 'student' | 'provider') => {
    if (isLoading) return
    setFormError(null)
    clearError()
    try {
      await login(`${role}@hustiq.com`, undefined, role)
      setShowSplash(true)
    } catch (err) {
      console.error('Mock login failed:', err)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full text-left pb-20 md:pb-0">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">Welcome back</h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          Access your personalized HustiQ workspace
        </p>
      </div>

      {/* Real Form Credentials Input */}
      <form onSubmit={handleRealLogin} className="flex flex-col space-y-4">
        {(error || formError) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold leading-relaxed">
            {error || formError}
          </div>
        )}

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
            <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
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
          className="h-13 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
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

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border/40"></div>
        <span className="flex-shrink mx-4 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 select-none">
          Quick Demo Sessions
        </span>
        <div className="flex-grow border-t border-border/40"></div>
      </div>

      {/* Mock Fast Logins */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <button
          type="button"
          onClick={() => handleMockLogin('student')}
          className="h-12 bg-muted/30 hover:bg-primary/5 hover:text-primary hover:border-primary/20 text-foreground rounded-2xl font-bold flex items-center justify-center gap-1.5 border border-border/40 text-xs transition-all active:scale-95"
          disabled={isLoading}
        >
          <User className="w-4 h-4 shrink-0" /> Student
        </button>
        <button
          type="button"
          onClick={() => handleMockLogin('provider')}
          className="h-12 bg-muted/30 hover:bg-primary/5 hover:text-primary hover:border-primary/20 text-foreground rounded-2xl font-bold flex items-center justify-center gap-1.5 border border-border/40 text-xs transition-all active:scale-95"
          disabled={isLoading}
        >
          <Briefcase className="w-4 h-4 shrink-0" /> Provider
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground font-semibold mt-4">
        Don't have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="font-extrabold text-primary hover:underline">
          Sign up
        </Link>
      </p>

      {showSplash && (
        <SplashScreen onComplete={() => navigate(ROUTES.DASHBOARD)} />
      )}
    </div>
  )
}
