import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MoreVertical, Image as ImageIcon, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  content: string
  senderId: string // 'me' or 'other'
  timestamp: string
}

export interface Conversation {
  id: string
  providerName: string
  providerAvatar: string
  jobTitle: string
  jobStatus: string
  lastMessage: string
  lastMessageTime: string
  isUnread: boolean
  isOnline: boolean
  messages: Message[]
}

interface ChatAreaProps {
  conversation: Conversation | null
  onBack: () => void
  onSendMessage: (content: string) => Promise<void>
}

export const ChatArea = ({ conversation, onBack, onSendMessage }: ChatAreaProps) => {
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Reset messages when conversation changes
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages)
    }
  }, [conversation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div className="hidden md:flex h-full flex-col items-center justify-center bg-card/30 border-l border-border/40">
        <div className="w-20 h-20 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center mb-6">
          <MessageSquareIcon className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Your Messages</h3>
        <p className="text-muted-foreground mt-2">Select a conversation to start chatting.</p>
      </div>
    )
  }

  const handleSend = async () => {
    if (!inputText.trim()) return
    const text = inputText.trim()
    setInputText('')
    await onSendMessage(text)
  }

  return (
    <div className="h-full flex flex-col bg-background md:border-l border-border/40 overflow-hidden relative">
      
      {/* Chat Header */}
      <div className="h-[76px] shrink-0 border-b border-border/40 flex items-center justify-between px-4 sm:px-6 bg-card/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-xl border border-border/50 shadow-sm shrink-0">
              {conversation.providerAvatar}
            </div>
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
            )}
          </div>
          
          <div className="flex flex-col">
            <h3 className="font-bold text-foreground leading-tight">{conversation.providerName}</h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80 mt-0.5">
              <Briefcase className="w-3 h-3" />
              {conversation.jobTitle} • <span className="text-primary">{conversation.jobStatus}</span>
            </div>
          </div>
        </div>
        
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === 'me'
            // Add a little extra top margin if the previous message was from the other person
            const prevMsg = idx > 0 ? messages[idx - 1] : null
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[75%]",
                  isMe ? "self-end items-end" : "self-start items-start",
                  isFirstInGroup ? "mt-2" : "mt-0"
                )}
              >
                <div 
                  className={cn(
                    "px-5 py-3.5 text-sm sm:text-base leading-relaxed shadow-sm",
                    isMe 
                      ? "bg-foreground text-background rounded-[1.5rem] rounded-tr-md" 
                      : "bg-muted/50 border border-border/50 text-foreground rounded-[1.5rem] rounded-tl-md"
                  )}
                >
                  {msg.content}
                </div>
                {isFirstInGroup && (
                  <span className="text-[10px] font-bold text-muted-foreground/50 mt-1.5 px-2 uppercase tracking-widest">
                    {msg.timestamp}
                  </span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Composer Input Bar */}
      <div className="p-4 sm:p-6 bg-background border-t border-border/40 shrink-0">
        <div className="relative flex items-center">
          <button className="absolute left-3 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors z-10">
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full bg-muted/30 border border-border/50 rounded-full py-4 pl-14 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60 shadow-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              "absolute right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 shadow-sm",
              inputText.trim() 
                ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95" 
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
      </div>

    </div>
  )
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
