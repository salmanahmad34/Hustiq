import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useNotifications } from '@/store/useNotifications'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'
import { 
  Briefcase, 
  Info, 
  MessageSquare, 
  CheckCircle2, 
  Eye, 
  Wallet, 
  UserCheck, 
  AlertTriangle, 
  Check, 
  Trash2, 
  BellOff, 

  Sliders, 
  CheckSquare,
  ArrowRight
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'

export const NotificationsPage = () => {
  const { user } = useAuth()
  const activeRole = user?.role || 'student'
  const isProvider = activeRole === 'provider'

  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    addNotification 
  } = useNotifications()

  // State for active category
  const [activeTab, setActiveTab] = useState<'today' | 'earlier' | 'important'>('today')

  // Settings State placeholders
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(true)
  const [gigAlerts, setGigAlerts] = useState(true)

  // Filter role-relevant notifications
  const roleNotifications = useMemo(() => {
    return notifications.filter(n => n.role === activeRole)
  }, [notifications, activeRole])

  // Segment notifications
  const filteredNotifications = useMemo(() => {
    return roleNotifications.filter(n => {
      if (activeTab === 'today') return n.category === 'today' && !n.isPriority
      if (activeTab === 'earlier') return n.category === 'earlier' && !n.isPriority
      if (activeTab === 'important') return n.isPriority
      return true
    })
  }, [roleNotifications, activeTab])

  const unreadCount = useMemo(() => {
    return roleNotifications.filter(n => n.isUnread).length
  }, [roleNotifications])

  // Helper icons
  const getIcon = (type: string) => {
    switch(type) {
      case 'offer_accepted':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'application_viewed':
        return <Eye className="w-5 h-5 text-primary" />
      case 'payout_update':
        return <Wallet className="w-5 h-5 text-emerald-500" />
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'job_alert':
        return <Briefcase className="w-5 h-5 text-primary" />
      case 'new_applicant':
        return <UserCheck className="w-5 h-5 text-purple-500" />
      case 'urgent_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />
    }
  }

  // Simulator Deck Triggers
  const triggerSimulation = (simType: string) => {
    if (simType === 'payout_credited') {
      addNotification({
        title: 'Instant Bank Payout Successful',
        message: '₹2,500 has been securely processed and sent to your HDFC bank account.',
        type: 'payout_update',
        isPriority: false,
        category: 'today',
        role: 'student',
        actionPath: ROUTES.WALLET,
        actionText: 'Track Payout'
      })
    } else if (simType === 'offer_received') {
      addNotification({
        title: 'New Contract Shift Offer Received!',
        message: 'Reliance Smart sent you a direct hiring invite for the Weekend stock associate gig.',
        type: 'offer_accepted',
        isPriority: true,
        category: 'today',
        role: 'student',
        actionPath: ROUTES.JOBS,
        actionText: 'Review Offer'
      })
    } else if (simType === 'message_received_s') {
      addNotification({
        title: 'New Message from Zepto Delivery Head',
        message: 'Amit: "Hi, can you pick up the 6 PM slot today? Incentives are active."',
        type: 'new_message',
        isPriority: false,
        category: 'today',
        role: 'student',
        actionPath: ROUTES.MESSAGES,
        actionText: 'Open Chat'
      })
    } else if (simType === 'applicant_received') {
      addNotification({
        title: 'Highly Matched Candidate Applied',
        message: 'Dev Patel (92% match) applied for your Event Manager shift.',
        type: 'new_applicant',
        isPriority: true,
        category: 'today',
        role: 'provider',
        actionPath: '/dashboard',
        actionText: 'View Candidate'
      })
    } else if (simType === 'payout_processed') {
      addNotification({
        title: 'Worker Payments Released Successfully',
        message: 'Instant payouts for 3 Cafe Assistants have been disbursed to contractor wallets.',
        type: 'payout_update',
        isPriority: false,
        category: 'today',
        role: 'provider',
        actionPath: ROUTES.WALLET,
        actionText: 'View Ledger'
      })
    } else if (simType === 'shift_expiry') {
      addNotification({
        title: 'Urgent Cafe Shift Expiry Notice',
        message: 'Your Evening Barista shift expires in 30 minutes with 2 unfilled openings.',
        type: 'urgent_alert',
        isPriority: true,
        category: 'today',
        role: 'provider',
        actionPath: '/dashboard',
        actionText: 'Boost Listing'
      })
    }
  }

  const handleSendTestNotification = async () => {
    if (!user?.id) {
      useUiStore.getState().addToast('Please login first to send a test notification.', 'error')
      return
    }

    try {
      useUiStore.getState().addToast('Triggering test push notification...', 'info')
      const res = await fetch(`/api/test-notification?userId=${user.id}`)
      const data = await res.json()
      
      if (res.ok) {
        useUiStore.getState().addToast('Test notification sent successfully!', 'success')
      } else {
        useUiStore.getState().addToast(data.error || 'Failed to send test notification.', 'error')
      }
    } catch (err) {
      console.error('[FCM Test] Error:', err)
      useUiStore.getState().addToast('Network error triggering test notification.', 'error')
    }
  }


  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } }
  } as const

  return (
    <div className="flex flex-col h-full w-full gap-6 pb-12 md:pb-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <ZivaroBrandIcon size="xs" />
            <span>Realtime Activity Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Activity & Notifications
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {isProvider 
              ? 'Stay updated on new contractor applications, message threads, and transaction payouts.' 
              : 'Track gig offers, application status changes, nearby match events, and instant payout balances.'
            }
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-muted/40 hover:bg-muted text-foreground border border-border/60 py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200"
          >
            <CheckSquare className="w-4 h-4 text-primary" />
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Left 2 Columns: Timeline Filter and Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Segmented Categories Controls */}
          <div className="flex items-center gap-2 p-1.5 bg-muted/20 border border-border/40 rounded-2xl w-full max-w-md">
            <button
              onClick={() => setActiveTab('today')}
              className={cn(
                "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                activeTab === 'today' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('earlier')}
              className={cn(
                "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                activeTab === 'earlier' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Earlier
            </button>
            <button
              onClick={() => setActiveTab('important')}
              className={cn(
                "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                activeTab === 'important' 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Important</span>
            </button>
          </div>

          {/* Activity Timeline List */}
          <div className="relative pl-6 sm:pl-8 flex flex-col gap-6">
            
            {/* Connecting Timeline Connector Line */}
            {filteredNotifications.length > 0 && (
              <div className="absolute left-3.5 sm:left-[21px] top-4 bottom-4 w-[1px] bg-border/40" />
            )}

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <motion.div 
                    variants={cardVariants}
                    className="glass-card p-12 rounded-2xl text-center border border-border/40 shadow-soft-lg flex flex-col items-center gap-4 py-16"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
                      <BellOff className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-foreground text-base">You're all caught up!</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        There are no notifications in this category. New platform alerts will appear here in realtime.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      variants={cardVariants}
                      exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }}
                      className={cn(
                        "relative bg-card border border-border/40 rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 overflow-hidden text-left",
                        notif.isPriority 
                          ? "border-primary/20 bg-primary/[0.01] shadow-soft-md shadow-primary/[0.01]" 
                          : "hover:border-border hover:shadow-soft-lg",
                        notif.isUnread ? "bg-primary/[0.02]" : ""
                      )}
                    >
                      {/* Interactive glowing overlay for priority items */}
                      {notif.isPriority && (
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[45px] bg-primary/5 pointer-events-none" />
                      )}

                      {/* Left border unread accent */}
                      {notif.isUnread && (
                        <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-primary rounded-r-full" />
                      )}

                      {/* Icon connector circle */}
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border relative z-10 transition-transform group-hover:scale-105 shadow-sm bg-card",
                        notif.isUnread ? "border-primary/20 text-primary" : "border-border/60 text-muted-foreground"
                      )}>
                        {getIcon(notif.type)}
                      </div>

                      {/* Card main text */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className={cn(
                            "text-sm tracking-tight leading-tight",
                            notif.isUnread ? "font-black text-foreground" : "font-bold text-foreground/80"
                          )}>
                            {notif.title}
                          </h4>
                          
                          {notif.isPriority && (
                            <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Important
                            </span>
                          )}

                          {notif.isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest">
                            {notif.time}
                          </span>
                          
                          {notif.actionPath && notif.actionText && (
                            <>
                              <span className="w-1 h-1 bg-border/80 rounded-full" />
                              <Link 
                                to={notif.actionPath}
                                className="text-[10px] font-extrabold text-primary hover:underline hover:text-primary-dark transition-colors inline-flex items-center gap-0.5 leading-none"
                              >
                                <span>{notif.actionText}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right quick actions */}
                      <div className="flex items-center gap-1 shrink-0 relative z-10">
                        {notif.isUnread && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            title="Mark as read"
                            className="w-8 h-8 rounded-full border border-border/40 bg-card hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-500 flex items-center justify-center text-muted-foreground transition-all duration-200"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          title="Delete notification"
                          className="w-8 h-8 rounded-full border border-border/40 bg-card hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 flex items-center justify-center text-muted-foreground transition-all duration-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>

          </div>

        </div>

        {/* Right Column: Settings & Live Simulator */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Simulator Deck Card */}
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="glass-card p-5 rounded-2xl border border-border/50 shadow-soft-lg flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
              <Info className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="font-bold text-base text-foreground tracking-tight">Realtime Simulator</h3>
            </div>
            
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inject mock events in your active viewport to simulate realtime websocket push alerts. Select a scenario:
            </p>

            <div className="flex flex-col gap-2.5 mt-1">
              {import.meta.env.DEV && (
                <>
                  <button 
                    onClick={handleSendTestNotification}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm border border-primary/20"
                  >
                    <span>Send Test Notification</span>
                  </button>

                  <div className="relative my-1 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30"></div>
                    </div>
                    <span className="relative px-2 bg-card text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Or Mock Viewport</span>
                  </div>
                </>
              )}

              {!isProvider ? (
                <>
                  <button 
                    onClick={() => triggerSimulation('offer_received')}
                    className="w-full text-left p-3 border border-border/40 hover:border-primary/20 rounded-xl hover:bg-primary/[0.02] transition-all text-xs font-bold text-foreground flex items-center justify-between"
                  >
                    <span>Simulate Direct Offer Accepted</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </button>

                  <button 
                    onClick={() => triggerSimulation('payout_credited')}
                    className="w-full text-left p-3 border border-border/40 hover:border-primary/20 rounded-xl hover:bg-primary/[0.02] transition-all text-xs font-bold text-foreground flex items-center justify-between"
                  >
                    <span>Simulate Instant Bank Payout</span>
                    <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                  </button>

                  <button 
                    onClick={() => triggerSimulation('message_received_s')}
                    className="w-full text-left p-3 border border-border/40 hover:border-primary/20 rounded-xl hover:bg-primary/[0.02] transition-all text-xs font-bold text-foreground flex items-center justify-between"
                  >
                    <span>Simulate Direct DM Alert</span>
                    <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => triggerSimulation('applicant_received')}
                    className="w-full text-left p-3 border border-border/40 hover:border-primary/20 rounded-xl hover:bg-primary/[0.02] transition-all text-xs font-bold text-foreground flex items-center justify-between"
                  >
                    <span>Simulate Applicant Received</span>
                    <UserCheck className="w-4 h-4 text-purple-500 shrink-0" />
                  </button>

                  <button 
                    onClick={() => triggerSimulation('payout_processed')}
                    className="w-full text-left p-3 border border-border/40 hover:border-primary/20 rounded-xl hover:bg-primary/[0.02] transition-all text-xs font-bold text-foreground flex items-center justify-between"
                  >
                    <span>Simulate Wage Batch Payout</span>
                    <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                  </button>

                  <button 
                    onClick={() => triggerSimulation('shift_expiry')}
                    className="w-full text-left p-3 border border-border/40 hover:border-primary/20 rounded-xl hover:bg-primary/[0.02] transition-all text-xs font-bold text-foreground flex items-center justify-between"
                  >
                    <span>Simulate Urgent Shift Expiry</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  </button>
                </>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-xl text-[10px] text-primary leading-normal flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>Simulated events will automatically trigger the unread bell indicator and arrive directly inside the timeline.</span>
            </div>
          </motion.div>

          {/* Preferences Settings Card */}
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="glass-card p-5 rounded-2xl border border-border/50 shadow-soft-lg flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-base text-foreground tracking-tight">Channel Toggles</h3>
            </div>
            
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Customize how and when you receive system alerts on your devices.
            </p>

            <div className="flex flex-col gap-3.5 mt-2">
              
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">Push Notifications</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Realtime updates in browser</p>
                </div>
                <button
                  onClick={() => setPushAlerts(!pushAlerts)}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors relative shrink-0",
                    pushAlerts ? "bg-primary" : "bg-muted border border-border"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-card shadow-sm transition-transform",
                    pushAlerts ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">Email Notifications</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Summary of applications & updates</p>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors relative shrink-0",
                    emailAlerts ? "bg-primary" : "bg-muted border border-border"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-card shadow-sm transition-transform",
                    emailAlerts ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">Nearby Gig Alerts</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Alerts for high-match urgent roles</p>
                </div>
                <button
                  onClick={() => setGigAlerts(!gigAlerts)}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors relative shrink-0",
                    gigAlerts ? "bg-primary" : "bg-muted border border-border"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-card shadow-sm transition-transform",
                    gigAlerts ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

            </div>
          </motion.div>

        </div>

      </div>

    </div>
  )
}
