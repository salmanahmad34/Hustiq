import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Square, X, ChevronRight, CheckCircle2, Award } from 'lucide-react'
import { useAuth } from '@/store/useAuth'

interface GuideItem {
  id: string
  label: string
  desc: string
  targetId?: string
}

export const FirstTimeGuidance = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])

  const isProvider = user?.role === 'provider'
  const userId = user?.id || 'guest'

  // Load completed tasks and dismissed state from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem(`zivaro_tour_completed_${userId}`)
    const savedDismissed = localStorage.getItem(`zivaro_tour_dismissed_${userId}`)
    
    if (savedCompleted) setCompleted(JSON.parse(savedCompleted))
    if (savedDismissed !== 'true') {
      // Auto-open after a short delay for first-time users
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [userId])

  useEffect(() => {
    const handleOpenGuide = () => {
      setIsOpen(true)
    }
    window.addEventListener('open-setup-guide', handleOpenGuide)
    return () => window.removeEventListener('open-setup-guide', handleOpenGuide)
  }, [])

  // Define guide checklists
  const studentItems: GuideItem[] = [
    {
      id: 'st-1',
      label: 'Explore Local Gigs',
      desc: 'Scroll down to check out the live map showing gigs within 3km of you.',
      targetId: 'nearby-map-container'
    },
    {
      id: 'st-2',
      label: 'Check out Quick Picks',
      desc: 'Look at the Quick Picks list customized specifically for your profile.',
      targetId: 'quick-picks-container'
    },
    {
      id: 'st-3',
      label: 'View Growth XP Tracks',
      desc: 'Gigs earn you XP! Go to the Growth page to check out how you level up.',
      targetId: 'growth-nav-link'
    },
    {
      id: 'st-4',
      label: 'Set preferences',
      desc: 'Complete your profile setups so providers can invite you to high-paying shifts.',
      targetId: 'profile-dropdown-btn'
    }
  ]

  const providerItems: GuideItem[] = [
    {
      id: 'pr-1',
      label: 'Post Your First Job',
      desc: 'Tap "Post Job" in the header to draft and publish a gig in seconds.',
      targetId: 'post-job-btn'
    },
    {
      id: 'pr-2',
      label: 'Check Applicant Scores',
      desc: 'Look at the queue to view nearby students matched by proximity and trust scores.',
      targetId: 'applicants-queue-container'
    },
    {
      id: 'pr-3',
      label: 'Use Quick Actions',
      desc: 'Utilize hiring shortcuts to easily invite workers or manage payouts.',
      targetId: 'quick-actions-container'
    },
    {
      id: 'pr-4',
      label: 'Fund Escrow Escapes',
      desc: 'Check the Wallet page to secure credits for instant verified student payouts.',
      targetId: 'wallet-nav-link'
    }
  ]

  const items = isProvider ? providerItems : studentItems
  const progressPercent = Math.round((completed.length / items.length) * 100)

  const handleToggleTask = (id: string, targetId?: string) => {
    let newCompleted = [...completed]
    if (completed.includes(id)) {
      newCompleted = newCompleted.filter(c => c !== id)
    } else {
      newCompleted.push(id)
      
      // If a targetId is provided, scroll and highlight that section!
      if (targetId) {
        const el = document.getElementById(targetId) || document.querySelector(`[href*="${targetId}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-500')
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2')
          }, 3000)
        }
      }
    }
    
    setCompleted(newCompleted)
    localStorage.setItem(`zivaro_tour_completed_${userId}`, JSON.stringify(newCompleted))
    window.dispatchEvent(new CustomEvent('zivaro-tour-updated'))
  }

  const handleDismissTour = () => {
    localStorage.setItem(`zivaro_tour_dismissed_${userId}`, 'true')
    window.dispatchEvent(new CustomEvent('zivaro-tour-updated'))
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full sm:max-w-md bg-card border-t sm:border border-border shadow-2xl rounded-t-[2.2rem] sm:rounded-[2.2rem] overflow-hidden flex flex-col p-6 max-h-[85vh] z-10 gap-4"
          >
            {/* Header Glow */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Title Row */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-foreground">Getting Started</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist Progress */}
            <div className="relative z-10 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">Action checklist progress</span>
                <span className="text-foreground font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Tasks List */}
            <div className="relative z-10 space-y-2.5 overflow-y-auto pr-1">
              {items.map((item) => {
                const isCompleted = completed.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleTask(item.id, item.targetId)}
                    className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground'
                        : 'bg-muted/40 border-border/50 hover:bg-muted/70 hover:border-foreground/20 text-foreground'
                    }`}
                  >
                    <button className="shrink-0 mt-0.5 text-primary hover:text-primary/80 transition-colors">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h5 className={`text-xs font-bold leading-tight ${isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                        {item.label}
                      </h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    {!isCompleted && (
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground shrink-0 self-center" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Completion or Dismiss Footer */}
            <div className="relative z-10 pt-4 border-t border-border flex items-center justify-between gap-4">
              {progressPercent === 100 ? (
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                  <Award className="w-4 h-4" />
                  <span>Onboarding complete (+100 XP)</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">
                  Tap any action to highlight it
                </span>
              )}
              <button
                onClick={handleDismissTour}
                className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-destructive hover:underline ml-auto"
              >
                Dismiss Guide
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
