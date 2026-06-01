import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Heart, Lightbulb, AlertTriangle, CheckCircle, X, Send } from 'lucide-react'
import { trackFeedbackSubmitted } from '@/services/analytics'

type Tab = 'sentiment' | 'feature' | 'bug'
type EmojiReaction = 'love' | 'happy' | 'neutral' | 'sad' | 'angry' | null

export const BetaFeedbackModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('sentiment')
  const [emoji, setEmoji] = useState<EmojiReaction>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Suggestion Form State
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [suggestionDesc, setSuggestionDesc] = useState('')
  const [suggestionCategory, setSuggestionCategory] = useState('Jobs')

  // Bug Report Form State
  const [bugTitle, setBugTitle] = useState('')
  const [bugSteps, setBugSteps] = useState('')
  const [bugSeverity, setBugSeverity] = useState('Medium')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleEmojiSelect = (type: EmojiReaction) => {
    setEmoji(type)
  }

  const resetForm = () => {
    setEmoji(null)
    setComment('')
    setSuggestionTitle('')
    setSuggestionDesc('')
    setSuggestionCategory('Jobs')
    setBugTitle('')
    setBugSteps('')
    setBugSeverity('Medium')
    setIsSuccess(false)
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Construct the payload
    let feedbackPayload = {}
    if (activeTab === 'sentiment') {
      feedbackPayload = { type: 'sentiment', emoji, comment }
    } else if (activeTab === 'feature') {
      feedbackPayload = { type: 'feature', title: suggestionTitle, desc: suggestionDesc, category: suggestionCategory }
    } else {
      feedbackPayload = { type: 'bug', title: bugTitle, steps: bugSteps, severity: bugSeverity }
    }

    // Simulate sending to database/server
    setTimeout(() => {
      // Save feedback locally
      const storedFeedback = localStorage.getItem('zivaro_beta_feedback') || '[]'
      const feedbackList = JSON.parse(storedFeedback)
      feedbackList.push({
        ...feedbackPayload,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('zivaro_beta_feedback', JSON.stringify(feedbackList))

      // Track event in our new analytics service
      try {
        trackFeedbackSubmitted(activeTab)
      } catch (err) {
        console.error('Analytics tracking error:', err)
      }

      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1000)
  }

  const emojiList = [
    { type: 'love' as EmojiReaction, icon: '🤩', label: 'Love' },
    { type: 'happy' as EmojiReaction, icon: '🙂', label: 'Happy' },
    { type: 'neutral' as EmojiReaction, icon: '😐', label: 'Neutral' },
    { type: 'sad' as EmojiReaction, icon: '😕', label: 'Unhappy' },
    { type: 'angry' as EmojiReaction, icon: '😭', label: 'Broken' }
  ]

  return (
    <>
      {/* Floating Feedback Bubble */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-[9999]">
        <motion.button
          onClick={() => {
            resetForm()
            setIsOpen(true)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 h-12 px-4 rounded-full bg-foreground text-background dark:bg-card dark:text-foreground border border-foreground/15 dark:border-border hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl hover:shadow-primary/20"
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          <span className="text-xs font-black tracking-widest uppercase hidden md:inline-block">Beta Feedback</span>
        </motion.button>
      </div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-[2.2rem] overflow-hidden flex flex-col min-h-[480px]"
            >
              {/* Header abstract accent */}
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Body */}
              <div className="p-8 sm:p-10 flex flex-col flex-1 relative z-10">
                <div className="mb-6">
                  <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-1.5 block">
                    HustiQ Public Beta
                  </span>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Help us build HustiQ</h3>
                </div>

                {/* Success State */}
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex-1 flex flex-col items-center justify-center py-8 text-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4"
                      >
                        <CheckCircle className="w-8 h-8" />
                      </motion.div>
                      <h4 className="text-lg font-bold text-foreground">Feedback Received!</h4>
                      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                        Thank you for contributing to our public beta. Your suggestions help us shape a reliable, premium local gig environment.
                      </p>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="mt-6 px-6 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm hover:shadow-lg transition-all"
                      >
                        Back to Workspace
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col"
                    >
                      {/* Tabs Header */}
                      <div className="flex gap-1.5 bg-muted/65 p-1 rounded-xl border border-border/40 mb-6 select-none">
                        <button
                          onClick={() => setActiveTab('sentiment')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'sentiment'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Experience
                        </button>
                        <button
                          onClick={() => setActiveTab('feature')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'feature'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          Suggestion
                        </button>
                        <button
                          onClick={() => setActiveTab('bug')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'bug'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Report Bug
                        </button>
                      </div>

                      {/* Tab Contents */}
                      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
                        {activeTab === 'sentiment' && (
                          <div className="space-y-6 flex-1 flex flex-col">
                            <div>
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                How is your overall experience?
                              </label>
                              <div className="flex justify-between mt-3 gap-2">
                                {emojiList.map((e) => (
                                  <button
                                    key={e.type}
                                    type="button"
                                    onClick={() => handleEmojiSelect(e.type)}
                                    className={`w-12 h-12 text-2xl flex items-center justify-center rounded-2xl border transition-all duration-300 ${
                                      emoji === e.type
                                        ? 'bg-primary/10 border-primary scale-110 shadow-lg'
                                        : 'bg-muted/30 border-border/50 hover:bg-muted/75 hover:scale-105'
                                    }`}
                                  >
                                    {e.icon}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5 flex-1 flex flex-col">
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                Describe your experience (optional)
                              </label>
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What went well? What could we improve?"
                                className="w-full flex-1 bg-muted/40 border border-border/50 rounded-2xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm h-28 resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'feature' && (
                          <div className="space-y-4 flex-1 flex flex-col">
                            <div className="space-y-1.5">
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                Feature Title
                              </label>
                              <input
                                type="text"
                                required
                                value={suggestionTitle}
                                onChange={(e) => setSuggestionTitle(e.target.value)}
                                placeholder="e.g. Map Filter by Payout"
                                className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                  Category Area
                                </label>
                                <select
                                  value={suggestionCategory}
                                  onChange={(e) => setSuggestionCategory(e.target.value)}
                                  className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm appearance-none"
                                >
                                  <option value="Jobs">Job Matching & Feeds</option>
                                  <option value="Payments">Wallet & Escrow</option>
                                  <option value="Messaging">Chat & Notifications</option>
                                  <option value="Growth">Growth Levels & XP</option>
                                  <option value="UIUX">Interface Spacing & Aesthetics</option>
                                  <option value="Other">Other Suggestion</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5 flex-1 flex flex-col">
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                Description
                              </label>
                              <textarea
                                required
                                value={suggestionDesc}
                                onChange={(e) => setSuggestionDesc(e.target.value)}
                                placeholder="Describe the feature and why it would be helpful."
                                className="w-full flex-1 bg-muted/40 border border-border/50 rounded-2xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm h-28 resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'bug' && (
                          <div className="space-y-4 flex-1 flex flex-col">
                            <div className="space-y-1.5">
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                Issue Summary
                              </label>
                              <input
                                type="text"
                                required
                                value={bugTitle}
                                onChange={(e) => setBugTitle(e.target.value)}
                                placeholder="e.g. Wallet payment card does not scroll on iOS mobile"
                                className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                Severity Level
                              </label>
                              <div className="grid grid-cols-3 gap-2.5">
                                {['Low', 'Medium', 'High'].map((sev) => (
                                  <button
                                    key={sev}
                                    type="button"
                                    onClick={() => setBugSeverity(sev)}
                                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                      bugSeverity === sev
                                        ? sev === 'Low'
                                          ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                          : sev === 'Medium'
                                          ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                          : 'bg-destructive/10 border-destructive text-destructive'
                                        : 'bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/70'
                                    }`}
                                  >
                                    {sev}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5 flex-1 flex flex-col">
                              <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground pl-1">
                                Steps to Reproduce
                              </label>
                              <textarea
                                required
                                value={bugSteps}
                                onChange={(e) => setBugSteps(e.target.value)}
                                placeholder="1. Go to Wallet page.&#10;2. Try adding a test credit.&#10;3. Verify page freezes."
                                className="w-full flex-1 bg-muted/40 border border-border/50 rounded-2xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold text-sm h-28 resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Submit Row */}
                        <div className="flex gap-3 mt-4 w-full">
                          <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="h-12 flex-1 bg-muted/40 hover:bg-muted border border-border/60 text-foreground font-black rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              (activeTab === 'sentiment' && !emoji) ||
                              (activeTab === 'feature' && (!suggestionTitle || !suggestionDesc)) ||
                              (activeTab === 'bug' && (!bugTitle || !bugSteps))
                            }
                            className="h-12 flex-1 bg-foreground text-background font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-sm shrink-0"
                          >
                            {isSubmitting ? (
                              <span>Logging feedback...</span>
                            ) : (
                              <>
                                <Send className="w-4 h-4 shrink-0" />
                                <span>Submit Feedback</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
