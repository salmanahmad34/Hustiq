import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import {
  Mail, Lock, Eye, EyeOff,
  Loader2, UserPlus, Key, ArrowLeft, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackSignupStarted, trackSignupCompleted } from '@/services/analytics'

export const SignupPage = () => {
  const { signup, loginWithGoogle, verifyOtp, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // FIXED: role starts as null — user MUST explicitly select one
  const [role, setRole] = useState<'student' | 'provider' | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Verification states
  const [showVerification, setShowVerification] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  // Clear errors on load
  useEffect(() => {
    clearError()
    setFormError(null)
    trackSignupStarted()
  }, [clearError])

  useEffect(() => {
    clearError()
    setFormError(null)
  }, [showVerification, clearError])

  const handleRoleSelect = (selected: 'student' | 'provider') => {
    setRole(selected)
    setFormError(null)
    clearError()
    console.log('[Signup] Selected role:', selected)
  }

  const handleRealSignup = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setFormError(null)
    clearError()

    // Mandatory role validation
    if (!role) {
      setFormError('Please choose Student or Provider before continuing.')
      return
    }

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
      const result = await signup(email, password, name, role)
      trackSignupCompleted(`usr-${Date.now()}`, role, name)

      if (result && result.needsVerification) {
        navigate(ROUTES.LOGIN)
      } else {
        navigate(ROUTES.SPLASH)
      }
    } catch (err: any) {
      // Handled by store/errors
    }
  }

  const handleGoogleSignUp = async () => {
    if (isLoading) return

    // Mandatory role validation
    if (!role) {
      setFormError('Please choose Student or Provider before continuing.')
      return
    }

    clearError()
    setFormError(null)
    console.log('[Signup] Google signup started with role:', role)

    try {
      await loginWithGoogle(role)
    } catch (err) {
      // Handled by store/errors
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setFormError(null)
    clearError()

    if (!otpCode.trim()) {
      setFormError('Please enter the verification code.')
      return
    }
    if (otpCode.trim().length < 6) {
      setFormError('Verification code must be 6 digits.')
      return
    }

    try {
      await verifyOtp(email, otpCode.trim())
      navigate(ROUTES.SPLASH)
    } catch (err: any) {
      // Handled by store/errors
    }
  }

  const roleConfig = {
    student: {
      icon: '🎓',
      label: 'Student',
      subtitle: 'Looking for gigs & part-time work',
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/60',
      iconColor: 'text-blue-500',
    },
    provider: {
      icon: '🏪',
      label: 'Provider / Shop',
      subtitle: 'Hiring students & managing jobs',
      color: 'from-violet-500/20 to-violet-600/10 border-violet-500/60',
      iconColor: 'text-violet-500',
    },
  }

  return (
    <div className="flex flex-col space-y-6 w-full text-left pb-20 md:pb-0">
      <div className="flex flex-col space-y-2 text-center mb-2">
        <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
          {showVerification ? 'Verify your email' : 'Create an account'}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          {showVerification
            ? `We've sent a 6-digit confirmation code to ${email}`
            : 'Hustle flexible shifts or source verified local talent'
          }
        </p>
      </div>

      <AnimatePresence mode="wait">
        {(error || formError) && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold leading-relaxed"
          >
            {error || formError}
          </motion.div>
        )}
      </AnimatePresence>

      {!showVerification ? (
        <>
          <form onSubmit={handleRealSignup} className="flex flex-col space-y-5">

            {/* ── Role Selection Cards ── */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                Join HustiQ As <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'provider'] as const).map((r) => {
                  const cfg = roleConfig[r]
                  const isSelected = role === r
                  return (
                    <motion.button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      disabled={isLoading}
                      whileTap={{ scale: 0.97 }}
                      animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={cn(
                        'relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden',
                        isSelected
                          ? `bg-gradient-to-br ${cfg.color} shadow-lg`
                          : 'bg-muted/30 border-border/40 hover:border-border hover:bg-muted/50'
                      )}
                    >
                      {/* Checkmark badge */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="absolute top-2 right-2"
                          >
                            <CheckCircle2 className={cn('w-4 h-4', cfg.iconColor)} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <span className="text-2xl leading-none">{cfg.icon}</span>
                      <span className={cn(
                        'font-black text-sm',
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {cfg.label}
                      </span>
                      <span className={cn(
                        'text-[10px] font-semibold leading-tight',
                        isSelected ? 'text-foreground/70' : 'text-muted-foreground/60'
                      )}>
                        {cfg.subtitle}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Confirmation text */}
              <AnimatePresence>
                {role && (
                  <motion.p
                    key="confirmation"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs font-bold text-primary pl-1"
                  >
                    ✓ Signing up as {role === 'student' ? 'Student' : 'Provider / Shop'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Full Name */}
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Submit Button */}
            <motion.button
              type="submit"
              animate={role ? { opacity: 1 } : { opacity: 0.5 }}
              className="w-full h-14 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold text-[20px] rounded-[18px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:active:scale-100 shadow-sm"
              disabled={isLoading || !role}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering account...</span>
                </>
              ) : (
                <span>Register &amp; Start</span>
              )}
            </motion.button>
          </form>

          <div className="flex items-center my-1">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink mx-4 text-muted-foreground font-extrabold tracking-widest text-[10px] uppercase">
              Or continue with
            </span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          {/* Google Button */}
          <div className="relative">
            <motion.button
              type="button"
              onClick={handleGoogleSignUp}
              animate={role ? { opacity: 1 } : { opacity: 0.45 }}
              className="w-full h-14 bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 text-foreground font-bold text-[16px] rounded-[18px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:active:scale-100 shadow-sm"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Sign up with Google</span>
            </motion.button>

            {/* Overlay hint when no role selected */}
            {!role && (
              <div
                className="absolute inset-0 rounded-[18px] cursor-pointer"
                onClick={() => setFormError('Please choose Student or Provider before continuing.')}
              />
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">Verification Code</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold tracking-[0.2em] text-center text-lg"
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
                <span>Verifying code...</span>
              </>
            ) : (
              <span>Confirm &amp; Verify</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowVerification(false)}
            className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground py-2 focus:outline-none"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Registration</span>
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground font-semibold mt-4">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-extrabold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
