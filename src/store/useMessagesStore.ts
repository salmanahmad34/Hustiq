import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  fetchConversation,
  fetchConversations,
  sendMessage,
  markMessageAsRead
} from '@/services/supabase/db'
import { supabase } from '@/services/supabase/supabaseClient'
import { isSupabaseConfigured } from '@/services/supabase/auth'
import type { Message, MessageInsert } from '@/types/database'

interface MessagesState {
  messages: Message[]
  conversations: Message[]
  isLoading: boolean
  error: string | null
  activeRecipientId: string | null
  channel: any | null

  // Actions
  fetchConversation: (userId: string, recipientId: string) => Promise<void>
  fetchConversations: (userId: string) => Promise<void>
  sendMessage: (message: MessageInsert) => Promise<Message | null>
  markMessageAsRead: (messageId: string) => Promise<Message | null>
  subscribeToMessages: (userId: string) => void
  unsubscribeFromMessages: () => void
  setActiveRecipientId: (id: string | null) => void
  clearError: () => void
}

export const useMessages = create<MessagesState>()(
  devtools(
    (set, get) => ({
      messages: [],
      conversations: [],
      isLoading: false,
      error: null,
      activeRecipientId: null,
      channel: null,

      fetchConversation: async (userId: string, recipientId: string) => {
        set({ isLoading: true, error: null })
        try {
          const messages = await fetchConversation(userId, recipientId)
          set({ messages })
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch conversation' })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchConversations: async (userId: string) => {
        set({ isLoading: true, error: null })
        try {
          const conversations = await fetchConversations(userId)
          set({ conversations })
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch conversations' })
        } finally {
          set({ isLoading: false })
        }
      },

      sendMessage: async (message: MessageInsert) => {
        set({ isLoading: true, error: null })
        try {
          const result = await sendMessage(message)
          if (result) {
            set((state) => ({
              messages: [...state.messages, result]
            }))
            // Refresh conversation list after sending
            get().fetchConversations(message.sender_id)
          }
          return result
        } catch (err: any) {
          set({ error: err.message || 'Failed to send message' })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      markMessageAsRead: async (messageId: string) => {
        try {
          const result = await markMessageAsRead(messageId)
          if (result) {
            set((state) => ({
              messages: state.messages.map((m) => (m.id === messageId ? result : m))
            }))
          }
          return result
        } catch (err: any) {
          set({ error: err.message || 'Failed to mark message as read' })
          return null
        }
      },

      subscribeToMessages: (userId: string) => {
        // Unsubscribe from any active channel first
        const currentChannel = get().channel
        if (currentChannel) {
          currentChannel.unsubscribe()
        }

        if (!isSupabaseConfigured()) return

        const channel = supabase
          .channel(`messages_room_${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `recipient_id=eq.${userId}`
            },
            async (payload) => {
              const newMsg = payload.new as any
              
              // Refresh contacts list
              get().fetchConversations(userId)

              // If the message is from the active conversation user, refresh current chat
              const activeRecipient = get().activeRecipientId
              if (activeRecipient && newMsg.sender_id === activeRecipient) {
                get().fetchConversation(userId, activeRecipient)
              }
            }
          )
          .subscribe()

        set({ channel })
      },

      unsubscribeFromMessages: () => {
        const channel = get().channel
        if (channel) {
          channel.unsubscribe()
          set({ channel: null })
        }
      },

      setActiveRecipientId: (id) => set({ activeRecipientId: id }),

      clearError: () => set({ error: null })
    }),
    { name: 'MessagesStore' }
  )
)
