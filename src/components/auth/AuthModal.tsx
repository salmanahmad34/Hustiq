import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuthModal } from '@/store/useAuthModal'
import { useProfileSetupModal } from '@/store/useProfileSetupModal'
import { useAuth } from '@/store/useAuth'

export const AuthModal = () => {
  const { isOpen, mode, closeModal, toggleMode } = useAuthModal()
  const { login, isLoading, error } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const openProfileSetupModal = useProfileSetupModal(state => state.openModal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    if (mode === 'login') {
      try {
        await login(email, password)
        closeModal()
      } catch (err) {
        // error handled by useAuth
      }
    } else {
      closeModal()
      setTimeout(() => {
        openProfileSetupModal()
      }, 150)
    }
  }

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeModal])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeModal}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-background border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col"
          >
            {/* Abstract Header Glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10 flex flex-col relative z-10">
              
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  {mode === 'signup' ? 'Create an account' : 'Welcome back'}
                </h2>
                <p className="text-muted-foreground">
                  {mode === 'signup' 
                    ? 'Enter your details to start earning.' 
                    : 'Log in to manage your gigs.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              {/* Auth Form */}
              <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-muted-foreground/70" />
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  {mode === 'login' && (
                    <div className="flex justify-between items-center pl-1 pr-1">
                      <span className="text-xs font-medium text-transparent select-none">Password</span>
                      <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-muted-foreground/70" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/70 hover:text-foreground transition-colors focus:outline-none"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              {/* Footer Toggle */}
              <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button 
                  onClick={toggleMode}
                  className="ml-2 font-bold text-foreground hover:text-primary transition-colors focus:outline-none"
                >
                  {mode === 'signup' ? 'Log in' : 'Sign up'}
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
