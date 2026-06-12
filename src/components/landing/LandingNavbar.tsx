import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const navLinks = [
  { name: 'Home', href: ROUTES.HOME },
  { name: 'How It Works', href: '#workflow' },
  { name: 'Benefits', href: '#benefits' },
  { name: 'Premium', href: '#premium' },
  { name: 'FAQ', href: '#faq' },
]

export const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-50 w-max max-w-[720px] transition-all duration-300 rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
        'bg-white/85 dark:bg-black/85 backdrop-blur-[20px] border-white/40 dark:border-white/10',
        isScrolled 
          ? 'top-2 py-0 scale-[0.98]' 
          : 'top-4 py-0'
      )}
    >
      <div className="relative flex items-center justify-between h-14 px-6 gap-8 lg:gap-16">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 group shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8">
            {/* Geometric upward growth symbol */}
            <div className="absolute w-4 h-4 border-[2.5px] border-foreground rounded-[3px] transition-colors duration-300 group-hover:border-primary" />
            <div className="absolute w-4 h-4 border-[2.5px] border-foreground/40 rounded-[3px] translate-x-1.5 -translate-y-1.5 transition-all duration-300 group-hover:border-primary/50 group-hover:translate-x-2.5 group-hover:-translate-y-2.5" />
            <div className="absolute w-1.5 h-1.5 bg-primary rounded-[2px] translate-x-1.5 -translate-y-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-4 group-hover:-translate-y-4" />
          </div>
          <span className="font-sans font-bold text-[22px] tracking-tighter text-foreground uppercase">
            HustiQ
          </span>
        </Link>

        {/* Desktop Nav - Centered */}
        <nav className="hidden lg:flex items-center space-x-8 shrink-0">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className="text-sm font-semibold text-foreground/75 hover:text-primary transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-4 shrink-0">
          <Link to={ROUTES.LOGIN} className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link 
            to={ROUTES.SIGNUP} 
            className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/95 transition-all shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 -mr-2 text-foreground flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[80px] left-4 right-4 lg:hidden border border-border/40 bg-background/95 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden z-50" p-6 flex flex-col space-y-4"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-foreground/80 hover:text-primary py-2.5 border-b border-border/10 last:border-0 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <div className="pt-4 border-t border-border/20 flex flex-col space-y-3">
              <Link 
                to={ROUTES.LOGIN} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-base font-semibold py-3 rounded-full hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to={ROUTES.SIGNUP}
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-base font-semibold bg-primary text-primary-foreground py-3.5 rounded-full shadow-soft"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
