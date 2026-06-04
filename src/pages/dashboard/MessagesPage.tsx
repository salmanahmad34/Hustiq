import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { ChatArea, type Conversation } from '@/components/dashboard/ChatArea'
import { cn } from '@/lib/utils'
import { useMessages } from '@/store/useMessagesStore'
import { useAuth } from '@/store/useAuth'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '@/services/supabase/auth'

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    providerName: 'Third Wave Coffee',
    providerAvatar: '☕',
    jobTitle: 'Weekend Barista',
    jobStatus: 'Accepted',
    lastMessage: 'Awesome, see you on Saturday at 8 AM!',
    lastMessageTime: '10m ago',
    isUnread: true,
    isOnline: true,
    messages: [
      { id: 'm1', content: 'Hi Salman, your profile looks great! We would love to have you this weekend.', senderId: 'provider', timestamp: 'Yesterday, 4:00 PM' },
      { id: 'm2', content: 'Thank you! I am available and looking forward to it.', senderId: 'me', timestamp: 'Yesterday, 4:30 PM' },
      { id: 'm3', content: 'Awesome, see you on Saturday at 8 AM! Ask for Rahul when you arrive.', senderId: 'provider', timestamp: '10m ago' }
    ]
  },
  {
    id: 'conv-2',
    providerName: 'Sunburn Arena',
    providerAvatar: '🎟️',
    jobTitle: 'Registration Staff',
    jobStatus: 'Interviewing',
    lastMessage: 'Can you confirm your availability for tomorrow?',
    lastMessageTime: '2h ago',
    isUnread: false,
    isOnline: false,
    messages: [
      { id: 'm4', content: 'We received your application for the VIP registration desk.', senderId: 'provider', timestamp: '2h ago' },
      { id: 'm5', content: 'Can you confirm your availability for tomorrow?', senderId: 'provider', timestamp: '2h ago' }
    ]
  },
  {
    id: 'conv-3',
    providerName: 'Reliance Smart',
    providerAvatar: '📦',
    jobTitle: 'Inventory Assistant',
    jobStatus: 'Applied',
    lastMessage: 'Thanks for applying. We will review your profile shortly.',
    lastMessageTime: '1d ago',
    isUnread: false,
    isOnline: true,
    messages: [
      { id: 'm6', content: 'Thanks for applying. We will review your profile shortly.', senderId: 'provider', timestamp: '1d ago' }
    ]
  }
]

export const MessagesPage = () => {
  const [searchParams] = useSearchParams()
  const recipientParam = searchParams.get('recipientId')
  const { chatId } = useParams()
  const navigate = useNavigate()

  const { user } = useAuth()
  const {
    messages,
    conversations,
    fetchConversations,
    fetchConversation,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    setActiveRecipientId
  } = useMessages()

  const activeId = chatId || null
  const [isMobile, setIsMobile] = useState(false)

  // Listen for window resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load conversations and subscribe to real-time events
  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id)
      subscribeToMessages(user.id)
    }
    return () => {
      unsubscribeFromMessages()
    }
  }, [user?.id, fetchConversations, subscribeToMessages, unsubscribeFromMessages])

  // Redirect recipientParam to route-based chatId if present
  useEffect(() => {
    if (recipientParam) {
      navigate(`/messages/${recipientParam}`, { replace: true })
    }
  }, [recipientParam, navigate])

  // Set recipient active status when activeId changes
  useEffect(() => {
    setActiveRecipientId(activeId)
  }, [activeId, setActiveRecipientId])

  // Fetch individual conversation history when activeId changes
  useEffect(() => {
    if (user?.id && activeId) {
      const isMock = user.id.startsWith('00000000-') || activeId.startsWith('sim-')
      if (isSupabaseConfigured() && !isMock) {
        fetchConversation(user.id, activeId)
      } else {
        // Fallback for Demo session - load local mock conversations if they match activeId
        const match = MOCK_CONVERSATIONS.find(c => c.id === activeId)
        if (match) {
          useMessages.setState({
            messages: match.messages.map(m => ({
              id: m.id,
              sender_id: m.senderId === 'me' ? user.id : activeId,
              recipient_id: m.senderId === 'me' ? activeId : user.id,
              content: m.content,
              is_read: true,
              created_at: new Date().toISOString()
            }))
          })
        } else {
          useMessages.setState({ messages: [] })
        }
      }
    }
  }, [user?.id, activeId, fetchConversation])

  const displayConversations = useMemo(() => {
    if (!user?.id) return []

    // Group real database conversations
    const groupedMap = new Map<string, any>()
    conversations.forEach((msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
      if (!groupedMap.has(otherUserId)) {
        groupedMap.set(otherUserId, msg)
      }
    })

    const list: Conversation[] = []
    groupedMap.forEach((msg, otherUserId) => {
      const otherProfile = msg.sender_id === user.id ? msg.recipient : msg.sender
      const otherName = otherProfile?.name || 'Contact ' + otherUserId.substring(0, 5)
      const isProvider = otherProfile?.role === 'provider'
      const otherAvatar = otherProfile?.metadata?.avatar || (isProvider ? '☕' : '👨🏽‍🎓')

      const diffMs = Date.now() - new Date(msg.created_at).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHrs = Math.floor(diffMins / 60)
      const timeText = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : diffHrs < 24 ? `${diffHrs}h ago` : `${Math.floor(diffHrs / 24)}d ago`

      list.push({
        id: otherUserId,
        providerName: otherName,
        providerAvatar: otherAvatar,
        jobTitle: isProvider ? 'Employer' : 'Candidate',
        jobStatus: isProvider ? 'Chat' : 'Applicant',
        lastMessage: msg.content,
        lastMessageTime: timeText,
        isUnread: !msg.is_read && msg.recipient_id === user.id,
        isOnline: true,
        messages: []
      })
    })

    // Combine with MOCK_CONVERSATIONS for demo session completeness
    const finalConversations = [...list]
    MOCK_CONVERSATIONS.forEach((mc) => {
      if (!finalConversations.some(fc => fc.id === mc.id)) {
        finalConversations.push(mc)
      }
    })

    return finalConversations
  }, [conversations, user?.id])

  const activeConversation = useMemo(() => {
    if (!activeId || !user?.id) return null
    const conv = displayConversations.find(c => c.id === activeId)
    
    const uiMessages = messages.map(m => ({
      id: m.id,
      content: m.content,
      senderId: m.sender_id === user.id ? 'me' : 'other',
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))

    if (!conv) {
      // Dynamic fallback for new chat recipient
      return {
        id: activeId,
        providerName: 'Candidate Chat',
        providerAvatar: '👨🏽‍🎓',
        jobTitle: 'Candidate',
        jobStatus: 'Applicant',
        lastMessage: '',
        lastMessageTime: '',
        isUnread: false,
        isOnline: true,
        messages: uiMessages
      }
    }

    return {
      ...conv,
      messages: uiMessages
    }
  }, [activeId, displayConversations, messages, user?.id])

  const handleSendMessage = async (content: string) => {
    if (!user?.id || !activeId) return

    const isMock = user.id.startsWith('00000000-') || activeId.startsWith('conv-') || activeId.startsWith('sim-')

    if (isSupabaseConfigured() && !isMock) {
      await sendMessage({
        sender_id: user.id,
        recipient_id: activeId,
        content
      })
    } else {
      // Simulated chat for demo accounts
      const userMsgId = Date.now().toString()
      useMessages.setState(state => ({
        messages: [
          ...state.messages,
          {
            id: userMsgId,
            sender_id: user.id,
            recipient_id: activeId,
            content,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]
      }))

      // Auto response trigger after 1.5s
      setTimeout(() => {
        useMessages.setState(state => ({
          messages: [
            ...state.messages,
            {
              id: (Date.now() + 1).toString(),
              sender_id: activeId,
              recipient_id: user.id,
              content: `Hello! This is a demo auto-response. Supabase database tables sync your chat messages exactly like this!`,
              is_read: false,
              created_at: new Date().toISOString()
            }
          ]
        }))
      }, 1500)
    }
  }

  // Mobile layout state: if mobile and active conversation, show chat. Else show sidebar.
  const showSidebar = !isMobile || (isMobile && !activeId)
  const showChat = !isMobile || (isMobile && activeId)

  return (
    <div className={cn(
      "flex w-full overflow-hidden bg-background md:h-full md:absolute md:top-0 md:bottom-0 md:z-auto left-0 right-0",
      activeId 
        ? "fixed top-0 bottom-0 h-[100dvh] z-50"
        : "fixed top-14 bottom-[calc(68px+env(safe-area-inset-bottom))] h-[calc(100vh-56px-68px-env(safe-area-inset-bottom))] z-30"
    )}>
      
      {/* Sidebar (Conversations List) */}
      {showSidebar && (
        <div className="w-full md:w-[350px] lg:w-[400px] h-full flex flex-col shrink-0">
          <div className="p-4 sm:p-6 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-muted/30 border border-border/50 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60 shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex flex-col">
              {displayConversations.map((conv) => {
                const isActive = activeId === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className={cn(
                      "flex items-start gap-4 p-4 sm:p-5 w-full text-left transition-all border-b border-border/20 last:border-0 relative group",
                      isActive 
                        ? "bg-muted/50" 
                        : "hover:bg-muted/30"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-chat-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-foreground"
                      />
                    )}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-xl border border-border/50 shadow-sm">
                        {conv.providerAvatar}
                      </div>
                      {conv.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className={cn(
                          "font-bold truncate",
                          conv.isUnread ? "text-foreground" : "text-foreground/80"
                        )}>
                          {conv.providerName}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest shrink-0",
                          conv.isUnread ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80">
                        {conv.jobTitle} • {conv.jobStatus}
                      </div>
                      <p className={cn(
                        "text-sm truncate mt-0.5",
                        conv.isUnread ? "text-foreground font-medium" : "text-muted-foreground/80"
                      )}>
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.isUnread && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Chat Area */}
      {showChat && (
        <div className="flex-1 h-full w-full absolute md:relative inset-0 z-20 md:z-auto bg-background">
          <ChatArea 
            conversation={activeConversation} 
            onBack={() => navigate('/messages')} 
            onSendMessage={handleSendMessage}
          />
        </div>
      )}

    </div>
  )
}
