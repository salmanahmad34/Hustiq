import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { User, Briefcase, Mail, Lock, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackSignupStarted, trackSignupCompleted } from '@/services/analytics'
import { SplashScreen } from '@/components/shared/SplashScreen'

export const SignupPage = () => {
  const { signup, isLoading, error, clearError, isSplashActive, setSplashActive } = useAuth()
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
    } catch (err: any) {
      // Handled by store/errors
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full text-left pb-20 md:pb-0">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">Create an account</h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          Hustle flexible shifts or source verified local talent
        </p>
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

      <p className="text-center text-xs text-muted-foreground font-semibold mt-4">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-extrabold text-primary hover:underline">
          Sign in
        </Link>
      </p>

      {isSplashActive && (
        <SplashScreen 
          onComplete={() => {
            setSplashActive(false)
            navigate(ROUTES.DASHBOARD)
          }} 
        />
      )}
    </div>
  )
}
