import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User, Settings, Briefcase, ChevronUp, Wallet, MessageSquare, Bookmark, Rocket, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuth' // We will mock this or just handle navigation directly

interface ProfileDropdownProps {
  isMobile?: boolean
}

export const ProfileDropdown = ({ isMobile = false }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate(ROUTES.HOME)
  }

  const isProvider = user?.role === 'provider'

  const menuItems = isProvider ? [
    { label: 'Profile', icon: User, action: () => navigate(ROUTES.PROFILE) },
    { label: 'Wallet & Spendings', icon: Wallet, action: () => navigate(ROUTES.WALLET) },
    { label: 'Posted Jobs', icon: Briefcase, action: () => navigate(ROUTES.JOBS) },
    { label: 'Give Feedback', icon: MessageSquare, action: () => {
      window.dispatchEvent(new CustomEvent('open-beta-feedback'))
    } },
    { label: 'Settings', icon: Settings, action: () => console.log('Settings clicked') }
  ] : [
    { label: 'Profile', icon: User, action: () => navigate(ROUTES.PROFILE) },
    { label: 'Saved Gigs', icon: Bookmark, action: () => navigate(ROUTES.SAVED) },
    { label: 'Growth Stats', icon: Rocket, action: () => navigate(ROUTES.GROWTH) },
    { label: 'Premium HustiQ', icon: Zap, action: () => navigate(ROUTES.PREMIUM) },
    { label: 'Wallet & Ledger', icon: Wallet, action: () => navigate(ROUTES.WALLET) },
    { label: 'Applications', icon: Briefcase, action: () => navigate(ROUTES.JOBS) },
    { label: 'Give Feedback', icon: MessageSquare, action: () => {
      window.dispatchEvent(new CustomEvent('open-beta-feedback'))
    } },
    { label: 'Settings', icon: Settings, action: () => console.log('Settings clicked') }
  ]

  if (isMobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          id="profile-dropdown-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-transform active:scale-95 border border-primary/20 overflow-hidden"
        >
          {(user?.avatar_url || user?.metadata?.avatarUrl) ? (
            <img src={user.avatar_url || user.metadata?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-56 bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col"
            >
              <div className="p-4 border-b border-border/30 bg-muted/20 flex flex-col gap-1">
                <p className="font-bold text-foreground text-sm leading-tight">{user?.full_name || user?.name || 'Zivaro User'}</p>
                <p className="text-xs text-muted-foreground truncate leading-tight mb-1">{user?.email || 'user@zivaro.com'}</p>
                <div className="inline-flex max-w-fit">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                    {user?.role === 'provider' ? 'Provider Account' : 'Student Account'}
                  </span>
                </div>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {menuItems.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setIsOpen(false); item.action(); }}
                    className="flex items-center gap-2.5 w-full p-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-border/30">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full p-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop Bottom Left Variant
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-full bg-card border border-border/50 rounded-2xl shadow-xl shadow-primary/5 overflow-hidden z-50 flex flex-col"
          >
            <div className="p-2 flex flex-col gap-1">
              {menuItems.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setIsOpen(false); item.action(); }}
                  className="flex items-center gap-2.5 w-full p-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-border/30">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full p-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        id="profile-dropdown-btn"
        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shrink-0 mr-3 overflow-hidden">
          {(user?.avatar_url || user?.metadata?.avatarUrl) ? (
            <img src={user.avatar_url || user.metadata?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user?.avatarPlaceholder || (user?.full_name || user?.name)?.charAt(0).toUpperCase() || 'Z'
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0 text-left">
          <span className="text-sm font-bold text-foreground leading-tight truncate">{user?.full_name || user?.name || 'Zivaro User'}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-primary mt-0.5 truncate">
            {user?.role || 'Student'}
          </span>
        </div>
        <ChevronUp className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2", isOpen && "rotate-180")} />
      </button>
    </div>
  )
}
