import { create } from 'zustand'
import { isSupabaseConfigured } from '@/services/supabase/auth'
import { supabase } from '@/services/supabase/supabaseClient'
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
    | 'job_completed'
    | 'system'
  isPriority: boolean
  category: 'today' | 'earlier'
  role: 'student' | 'provider' | 'admin'
  actionPath?: string
  actionText?: string
}

interface NotificationsState {
  isOpen: boolean
  notifications: NotificationItem[]
  channel: any | null
  
  // Basic Actions
  toggleOpen: () => void
  close: () => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  loadNotifications: (userId: string, role: 'student' | 'provider' | 'admin') => Promise<void>
  
  // Realtime Simulation Actions
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'isUnread'>, userId?: string) => Promise<void>

  // Realtime Subscription Actions
  subscribeToNotifications: (userId: string, role: 'student' | 'provider' | 'admin') => void
  unsubscribeFromNotifications: () => void
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  isOpen: false,
  notifications: [],
  channel: null,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isUnread: false } : n)
    }))

    try {
      if (isSupabaseConfigured() && !id.startsWith('sim-')) {
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
    const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-')
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
      const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-')
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
  },

  subscribeToNotifications: (userId, role) => {
    // Unsubscribe from any active channel first
    const currentChannel = get().channel
    if (currentChannel) {
      currentChannel.unsubscribe()
    }

    const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-')
    if (!isSupabaseConfigured() || isMock) return

    const channel = supabase
      .channel(`notifications_room_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const row = payload.new as any
          const diffMs = Date.now() - new Date(row.created_at).getTime()
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
          const timeText = diffHrs < 1 ? 'Just now' : diffHrs < 24 ? `${diffHrs}h ago` : `${Math.floor(diffHrs / 24)}d ago`

          const newNotif: NotificationItem = {
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

          set((state) => ({
            notifications: [newNotif, ...state.notifications]
          }))

          // Trigger a global UI toast
          import('@/store/uiStore').then(({ useUiStore }) => {
            useUiStore.getState().addToast(newNotif.title, 'success')
          }).catch(err => console.warn('Could not trigger toast for notification:', err))
        }
      )
      .subscribe()

    set({ channel })
  },

  unsubscribeFromNotifications: () => {
    const channel = get().channel
    if (channel) {
      channel.unsubscribe()
      set({ channel: null })
    }
    set({ notifications: [] })
  }
}))
