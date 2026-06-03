import { create } from 'zustand'
import { isSupabaseConfigured } from '@/services/supabase/auth'
import { 
  fetchNotificationsFromDb, 
  markNotificationReadInDb, 
  createNotificationInDb 
} from '@/services/supabase/db'

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  isUnread: boolean
  type: 
    | 'application_viewed'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'job_alert'
    | 'payout_update'
    | 'new_message'
    | 'new_applicant'
    | 'urgent_alert'
    | 'system'
  isPriority: boolean
  category: 'today' | 'earlier'
  role: 'student' | 'provider'
  actionPath?: string
  actionText?: string
}

interface NotificationsState {
  isOpen: boolean
  notifications: NotificationItem[]
  
  // Basic Actions
  toggleOpen: () => void
  close: () => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  loadNotifications: (userId: string, role: 'student' | 'provider') => Promise<void>
  
  // Realtime Simulation Actions
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'isUnread'>, userId?: string) => Promise<void>
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  // --- Student Notifications ---
  {
    id: 's-notif-1',
    title: 'Star of the Show! Application Accepted',
    message: 'Starbucks has accepted your Weekend Barista application. Confirm your shift now.',
    time: '2m ago',
    isUnread: true,
    type: 'offer_accepted',
    isPriority: true,
    category: 'today',
    role: 'student',
    actionPath: '/jobs',
    actionText: 'View Offer'
  },
  {
    id: 's-notif-2',
    title: 'Application Viewed by Employer',
    message: 'Reliance Smart viewed your recent Inventory Associate application.',
    time: '1h ago',
    isUnread: true,
    type: 'application_viewed',
    isPriority: false,
    category: 'today',
    role: 'student',
    actionPath: '/jobs',
    actionText: 'Track Status'
  },
  {
    id: 's-notif-3',
    title: 'Instant Bank Payout Successful',
    message: '₹1,500 has been securely deposited to your HDFC bank account.',
    time: '4h ago',
    isUnread: false,
    type: 'payout_update',
    isPriority: false,
    category: 'today',
    role: 'student',
    actionPath: '/wallet',
    actionText: 'Open Wallet'
  },
  {
    id: 's-notif-4',
    title: 'New Message from Coffee Shop Manager',
    message: 'Rohit from Third Wave Coffee: "Are you available for an extra hour?"',
    time: '1d ago',
    isUnread: false,
    type: 'new_message',
    isPriority: false,
    category: 'earlier',
    role: 'student',
    actionPath: '/messages',
    actionText: 'Reply'
  },
  {
    id: 's-notif-5',
    title: 'Urgent Cafe Gig Alert Nearby',
    message: 'Blue Tokai posted a weekend server shift matching your preferences.',
    time: '2d ago',
    isUnread: false,
    type: 'job_alert',
    isPriority: false,
    category: 'earlier',
    role: 'student',
    actionPath: '/jobs',
    actionText: 'Apply Now'
  },

  // --- Provider Notifications ---
  {
    id: 'p-notif-1',
    title: 'Highly Matched Applicant Received',
    message: 'Rahul Sharma (95% match) applied for your Weekend Barista slot.',
    time: '5m ago',
    isUnread: true,
    type: 'new_applicant',
    isPriority: true,
    category: 'today',
    role: 'provider',
    actionPath: '/dashboard',
    actionText: 'Review Candidate'
  },
  {
    id: 'p-notif-2',
    title: 'New Message from Support Desk',
    message: 'Priyanka (HustiQ Agent): "Your store verification is fully approved."',
    time: '2h ago',
    isUnread: true,
    type: 'new_message',
    isPriority: false,
    category: 'today',
    role: 'provider',
    actionPath: '/messages',
    actionText: 'View Message'
  },
  {
    id: 'p-notif-3',
    title: 'Hiring Budget Batch Processed',
    message: 'Monthly Store Assistant payments batch #4 has been cleared.',
    time: '1d ago',
    isUnread: false,
    type: 'payout_update',
    isPriority: false,
    category: 'earlier',
    role: 'provider',
    actionPath: '/wallet',
    actionText: 'View Spending'
  },
  {
    id: 'p-notif-4',
    title: 'Urgent Contract Shift Expiry Notice',
    message: 'Starbucks Cafe Assistant contract expires in 2 hours. Extend post?',
    time: '2d ago',
    isUnread: false,
    type: 'urgent_alert',
    isPriority: true,
    category: 'earlier',
    role: 'provider',
    actionPath: '/dashboard',
    actionText: 'Manage Post'
  }
]

export const useNotifications = create<NotificationsState>((set) => ({
  isOpen: false,
  notifications: INITIAL_NOTIFICATIONS,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isUnread: false } : n)
    }))

    try {
      if (isSupabaseConfigured() && !id.startsWith('s-notif-') && !id.startsWith('p-notif-') && !id.startsWith('sim-')) {
        await markNotificationReadInDb(id)
      }
    } catch (err) {
      console.error('Failed to mark notification read in Supabase:', err)
    }
  },

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isUnread: false }))
  })),

  deleteNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  loadNotifications: async (userId, role) => {
    const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-') || userId.startsWith('00000000-')
    if (!isSupabaseConfigured() || isMock) return

    try {
      const data = await fetchNotificationsFromDb(userId)
      const mapped: NotificationItem[] = data.map((row: any) => {
        const diffMs = Date.now() - new Date(row.created_at).getTime()
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
        const timeText = diffHrs < 1 ? 'Just now' : diffHrs < 24 ? `${diffHrs}h ago` : `${Math.floor(diffHrs / 24)}d ago`
        
        return {
          id: row.id,
          title: row.title,
          message: row.content,
          time: timeText,
          isUnread: !row.is_read,
          type: row.type as any,
          isPriority: row.is_important,
          category: diffHrs < 24 ? 'today' : 'earlier',
          role: role,
          actionPath: row.metadata?.actionPath,
          actionText: row.metadata?.actionText
        }
      })

      set({ notifications: mapped })
    } catch (err) {
      console.error('Failed to load notifications from Supabase:', err)
    }
  },

  addNotification: async (notification, userId) => {
    const newNotif: NotificationItem = {
      ...notification,
      id: `sim-notif-${Date.now()}`,
      time: 'Just now',
      isUnread: true
    }

    set((state) => ({
      notifications: [newNotif, ...state.notifications]
    }))

    try {
      const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-') || userId.startsWith('00000000-')
      if (isSupabaseConfigured() && userId && !isMock) {
        await createNotificationInDb(
          userId, 
          notification.type, 
          notification.title, 
          notification.message, 
          notification.isPriority, 
          { actionPath: notification.actionPath, actionText: notification.actionText }
        )
      }
    } catch (err) {
      console.error('Failed to submit notification to Supabase:', err)
    }
  }
}))
