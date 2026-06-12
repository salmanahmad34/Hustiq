import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useNotifications } from '@/store/useNotifications'
import { useAuth } from '@/store/useAuth'
import { ROUTES } from '@/constants/routes'
import { 
  Bell, 
  Briefcase, 
  Info, 
  MessageSquare, 
  CheckCircle2, 
  Eye, 
  Wallet, 
  UserCheck, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const NotificationDropdown = () => {
  const { isOpen, notifications, close, markAsRead, markAllAsRead } = useNotifications()
  const { user } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeRole = user?.role || 'student'

  // Filter notifications relevant to current user role
  const roleNotifications = notifications.filter(notif => notif.role === activeRole)
  const unreadCount = roleNotifications.filter(n => n.isUnread).length

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Prevent closing if they clicked the toggle button itself
        if (!(event.target as Element).closest('#notification-bell-btn')) {
          close()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  const getIcon = (type: string) => {
    switch(type) {
      case 'offer_accepted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'application_viewed':
        return <Eye className="w-4 h-4 text-primary" />
      case 'payout_update':
        return <Wallet className="w-4 h-4 text-emerald-500" />
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'job_alert':
        return <Briefcase className="w-4 h-4 text-primary" />
      case 'new_applicant':
        return <UserCheck className="w-4 h-4 text-purple-500" />
      case 'urgent_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute right-0 top-14 w-[320px] sm:w-[380px] bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-border/40 bg-muted/10">
            <div>
              <h3 className="font-bold text-foreground leading-none">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] text-primary font-bold mt-1 inline-block">
                  {unreadCount} new alert{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex flex-col max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {roleNotifications.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Bell className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              roleNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    "flex gap-4 p-5 border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors relative group",
                    notif.isUnread ? "bg-primary/5" : ""
                  )}
                >
                  {notif.isUnread && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors",
                    notif.isUnread ? "bg-background border-primary/20 shadow-sm" : "bg-muted/50 border-border/50 group-hover:border-foreground/20"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex flex-col gap-1 pr-2 flex-1 min-w-0">
                    <h4 className={cn(
                      "text-sm leading-tight transition-colors truncate",
                      notif.isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/80 group-hover:text-foreground"
                    )}>
                      {notif.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] font-bold text-muted-foreground/60 mt-1.5 uppercase tracking-widest">
                      {notif.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3.5 bg-muted/20 border-t border-border/40 text-center">
            <Link 
              to={ROUTES.NOTIFICATIONS}
              onClick={close}
              className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 leading-none py-1"
            >
              View Activity Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
