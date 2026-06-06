import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, type NotificationItem } from '@/store/useNotifications'
import { useAuth } from '@/store/useAuth'
import { 
  Bell, 
  MessageSquare, 
  Wallet, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle, 
  Briefcase, 
  Eye 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const NotificationsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const activeRole = user?.role || 'student'

  const { 
    notifications, 
    markAsRead, 
    loadNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications
  } = useNotifications()

  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id, activeRole)
      subscribeToNotifications(user.id, activeRole)
    }
    return () => {
      unsubscribeFromNotifications()
    }
  }, [user?.id, activeRole, loadNotifications, subscribeToNotifications, unsubscribeFromNotifications])

  const roleNotifications = useMemo(() => {
    return notifications.filter(n => n.role === activeRole)
  }, [notifications, activeRole])

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (notif.isUnread) {
      await markAsRead(notif.id)
    }
    if (notif.actionPath) {
      navigate(notif.actionPath)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer_accepted':
      case 'offer_rejected':
      case 'job_completed':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      case 'new_message':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <MessageSquare className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      case 'payout_update':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Wallet className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      case 'new_applicant':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <UserCheck className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      case 'application_viewed':
        return (
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Eye className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      case 'job_alert':
        return (
          <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Briefcase className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      case 'urgent_alert':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <AlertCircle className="w-5 h-5" strokeWidth={2} />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Bell className="w-5 h-5" strokeWidth={2} />
          </div>
        )
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Clean, simple title */}
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {roleNotifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm font-medium">
            No notifications yet
          </div>
        ) : (
          roleNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={cn(
                "group flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:hover:border-border/60 transition-all duration-200 cursor-pointer relative",
                notif.isUnread 
                  ? "border-primary/20 bg-primary/[0.01]" 
                  : "border-border/50 bg-card"
              )}
            >
              {getNotificationIcon(notif.type)}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className={cn(
                    "text-sm text-foreground truncate transition-colors",
                    notif.isUnread ? "font-bold" : "font-medium text-foreground/90"
                  )}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {notif.time}
                  </span>
                </div>
                <p className={cn(
                  "text-xs mt-1 leading-relaxed",
                  notif.isUnread ? "text-foreground/85 font-medium" : "text-muted-foreground"
                )}>
                  {notif.message}
                </p>
              </div>
              
              {notif.isUnread && (
                <span className="relative flex h-2.5 w-2.5 shrink-0 self-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
