// @ts-nocheck
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { User, Briefcase, Mail, Lock, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackSignupStarted, trackSignupCompleted } from '@/services/analytics'

export const SignupPage = () => {
  const { signup, googleLogin, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'provider'>('student')
  
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Clear errors on load
  useEffect(() => {
    clearError()
    setFormError(null)
    trackSignupStarted()
  }, [clearError])

  const handleRealSignup = async (e: FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setFormError(null)
    clearError()

    if (!name.trim()) {
      setFormError('Please enter your full name.')
      return
    }
    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      return
    }

    try {
      await signup(email, password, name, role)
      trackSignupCompleted(`usr-${Date.now()}`, role, name)
      navigate(ROUTES.DASHBOARD)
    } catch (err: any) {
      // Handled by store/errors
    }
  }

  const handleMockSignup = async (selectedRole: 'student' | 'provider') => {
    if (isLoading) return
    setFormError(null)
    clearError()
    try {
      const mockName = selectedRole === 'student' ? 'HustiQ Student' : 'HustiQ Provider'
      await signup(`${selectedRole}@hustiq.com`, undefined, mockName, selectedRole)
      trackSignupCompleted(`usr-mock-${Date.now()}`, selectedRole, mockName)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      console.error('Mock signup failed:', err)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full text-left pb-20 md:pb-0">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">Create an account</h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          Hustle flexible shifts or source verified local talent
        </p>
      </div>

      {/* Social Auth */}
      <button 
        type="button"
        onClick={async () => {
          try {
            await googleLogin()
          } catch (err) {
            // error is handled in store
          }
        }}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-muted/50 hover:bg-muted text-foreground font-medium py-3 rounded-xl transition-colors border border-transparent hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative flex items-center my-2">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">or continue with email</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <form onSubmit={handleRealSignup} className="flex flex-col space-y-4">
        {(error || formError) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold leading-relaxed">
            {error || formError}
          </div>
        )}

        {/* Dynamic Role Tab Selectors */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Join HustiQ As</label>
          <div className="grid grid-cols-2 gap-3 bg-muted/20 border border-border/40 rounded-2xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={cn(
                "flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs transition-all",
                role === 'student'
                  ? "bg-card text-foreground shadow-sm border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={isLoading}
            >
              <User className="w-4 h-4 shrink-0" /> Student
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={cn(
                "flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs transition-all",
                role === 'provider'
                  ? "bg-card text-foreground shadow-sm border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={isLoading}
            >
              <Briefcase className="w-4 h-4 shrink-0" /> Provider / Shop
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Full Name</label>
          <div className="relative">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Salman Ahmad"
              className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create strong password"
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
              <span>Registering account...</span>
            </>
          ) : (
            <span>Register & Start</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border/40"></div>
        <span className="flex-shrink mx-4 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 select-none">
          Demo Bypass Registrations
        </span>
        <div className="flex-grow border-t border-border/40"></div>
      </div>

      {/* Mock Fast Registrations */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <button
          type="button"
          onClick={() => handleMockSignup('student')}
          className="h-12 bg-muted/30 hover:bg-primary/5 hover:text-primary hover:border-primary/20 text-foreground rounded-2xl font-bold flex items-center justify-center gap-1.5 border border-border/40 text-xs transition-all active:scale-95"
          disabled={isLoading}
        >
          <User className="w-4 h-4 shrink-0" /> Student
        </button>
        <button
          type="button"
          onClick={() => handleMockSignup('provider')}
          className="h-12 bg-muted/30 hover:bg-primary/5 hover:text-primary hover:border-primary/20 text-foreground rounded-2xl font-bold flex items-center justify-center gap-1.5 border border-border/40 text-xs transition-all active:scale-95"
          disabled={isLoading}
        >
          <Briefcase className="w-4 h-4 shrink-0" /> Provider
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground font-semibold mt-4">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-extrabold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}


