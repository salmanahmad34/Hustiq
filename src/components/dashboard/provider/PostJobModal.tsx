import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Briefcase, MapPin, ListChecks, Eye, CheckCircle2, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePostJob } from '@/store/usePostJob'
import { useAuth } from '@/store/useAuth'
import { useJobs } from '@/store/useJobs'
import { createJob } from '@/services/supabase/db'
import { trackJobPostingStarted, trackJobPostingCompleted } from '@/services/analytics'

const STEPS = [
  { id: 1, title: 'Basics', icon: Briefcase },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Requirements', icon: ListChecks },
  { id: 4, title: 'Preview', icon: Eye }
]

export const PostJobModal = () => {
  const { isOpen, close, currentStep, nextStep, prevStep, draftData, updateDraft, isSuccess, setSuccess } = usePostJob()
  const { user } = useAuth()
  const [isPublishing, setIsPublishing] = useState(false)

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      trackJobPostingStarted()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePublish = async () => {
    if (!user?.id) {
      console.error('Cannot publish job: User session is missing.')
      return
    }
    
    setIsPublishing(true)
    try {
      const jobData = {
        title: draftData.title || 'Untitled Gig',
        business_name: user.name || 'My Business',
        description: draftData.notes || '',
        payout: parseInt(draftData.payout) || 0,
        payout_type: draftData.payoutType,
        is_urgent: draftData.isUrgent,
        is_premium: false,
        is_verified: false,
        location: draftData.location || 'Remote',
        timing: draftData.shiftTiming || '',
        tags: draftData.skills ? draftData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        provider_id: user.id,
        posted_time: 'Just now'
      }

      const result = await createJob(jobData)
      if (result && user?.id) {
        // Refresh the provider's jobs list
        await useJobs.getState().fetchProviderJobs(user.id)
      }
      
      setSuccess(true)

      // Track analytics event
      trackJobPostingCompleted(
        result?.id || `pj-${Date.now()}`,
        draftData.title || 'Untitled Gig',
        user?.name || 'Anonymous Provider',
        parseInt(draftData.payout) || 0,
        draftData.payoutType
      )
    } catch (error) {
      console.error('Error publishing job to Supabase:', error)
    } finally {
      setIsPublishing(false)
    }

    setTimeout(() => {
      close()
    }, 2500)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 400, damping: 30 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      transition: { duration: 0.2 }
    })
  } as const

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        
        {/* Backdrop (optimized) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSuccess && !isPublishing ? close : undefined}
          className="absolute inset-0 bg-background/90"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-card w-full max-w-2xl border border-border/50 rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Subtle Glow Underlay (optimized) */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Job Published!</h2>
              <p className="text-muted-foreground text-lg max-w-md">
                Your job is now live. We will notify you as soon as students start applying.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border/30 relative z-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-foreground">Post New Job</h2>
                  <p className="text-sm font-semibold text-muted-foreground mt-1">Attract the best local talent</p>
                </div>
                <button 
                  onClick={close}
                  className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors border border-border/50 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="px-6 sm:px-8 py-4 bg-muted/20 border-b border-border/30 flex items-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {STEPS.map((step, idx) => {
                  const isActive = step.id === currentStep
                  const isCompleted = step.id < currentStep
                  const Icon = step.icon
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0",
                        isActive ? "bg-foreground text-background" : 
                        isCompleted ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                        {step.title}
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className="w-4 sm:w-8 h-[2px] bg-border/50 mx-2 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Form Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative z-10">
                <AnimatePresence mode="wait" custom={1}>
                  
                  {currentStep === 1 && (
                    <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Job Title</label>
                        <input 
                          type="text" 
                          value={draftData.title}
                          onChange={(e) => updateDraft({ title: e.target.value })}
                          placeholder="e.g. Weekend Barista" 
                          className="w-full bg-muted/30 border border-border/50 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {['Cafe', 'Retail', 'Events', 'Delivery', 'Office'].map(cat => (
                            <button 
                              key={cat}
                              onClick={() => updateDraft({ category: cat })}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-colors border",
                                draftData.category === cat 
                                  ? "bg-primary/10 text-primary border-primary/20" 
                                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Payout</label>
                        <div className="flex gap-4">
                          <div className="relative flex-1">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input 
                              type="number" 
                              value={draftData.payout}
                              onChange={(e) => updateDraft({ payout: e.target.value })}
                              placeholder="450" 
                              className="w-full bg-muted/30 border border-border/50 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-black text-lg"
                            />
                          </div>
                          <select 
                            value={draftData.payoutType}
                            onChange={(e) => updateDraft({ payoutType: e.target.value as any })}
                            className="bg-muted/30 border border-border/50 rounded-xl px-4 py-3.5 font-bold text-muted-foreground focus:outline-none"
                          >
                            <option value="hr">/ hr</option>
                            <option value="shift">/ shift</option>
                            <option value="month">/ month</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Duration</label>
                        <div className="flex flex-wrap gap-2">
                          {['One-time', 'Weekend', 'Part-time', 'Full-time'].map(dur => (
                            <button 
                              key={dur}
                              onClick={() => updateDraft({ duration: dur })}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-colors border",
                                draftData.duration === dur 
                                  ? "bg-primary/10 text-primary border-primary/20" 
                                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                              )}
                            >
                              {dur}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Shift Timing</label>
                        <input 
                          type="text" 
                          value={draftData.shiftTiming}
                          onChange={(e) => updateDraft({ shiftTiming: e.target.value })}
                          placeholder="e.g. Sat-Sun, 8 AM - 4 PM" 
                          className="w-full bg-muted/30 border border-border/50 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Location Area</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="text" 
                            value={draftData.location}
                            onChange={(e) => updateDraft({ location: e.target.value })}
                            placeholder="e.g. Koramangala" 
                            className="w-full bg-muted/30 border border-border/50 rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Required Skills (comma separated)</label>
                        <input 
                          type="text" 
                          value={draftData.skills}
                          onChange={(e) => updateDraft({ skills: e.target.value })}
                          placeholder="e.g. Customer Service, Cashier" 
                          className="w-full bg-muted/30 border border-border/50 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Additional Notes</label>
                        <textarea 
                          value={draftData.notes}
                          onChange={(e) => updateDraft({ notes: e.target.value })}
                          placeholder="e.g. Must be comfortable standing for 8 hours." 
                          rows={3}
                          className="w-full bg-muted/30 border border-border/50 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl mt-2">
                        <div>
                          <h4 className="font-bold text-red-500">Urgent Hiring</h4>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Boost visibility and notify nearby students.</p>
                        </div>
                        <button 
                          onClick={() => updateDraft({ isUrgent: !draftData.isUrgent })}
                          className={cn(
                            "w-12 h-6 rounded-full transition-colors relative",
                            draftData.isUrgent ? "bg-red-500" : "bg-muted-foreground/30"
                          )}
                        >
                          <motion.div 
                            animate={{ x: draftData.isUrgent ? 24 : 2 }}
                            className="w-5 h-5 bg-white rounded-full mt-0.5 shadow-sm"
                          />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-6">
                      <div className="p-5 bg-card border border-border/50 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">{draftData.category || 'Category'}</span>
                          {draftData.isUrgent && <span className="text-xs font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-md">Urgent</span>}
                        </div>
                        <h3 className="text-xl font-black text-foreground">{draftData.title || 'Job Title'}</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-1 truncate">{draftData.notes || 'Job description preview...'}</p>
                        
                        <div className="flex items-center gap-1.5 mt-4">
                          <IndianRupee className="w-4 h-4 text-muted-foreground" />
                          <span className="text-lg font-bold text-foreground">{draftData.payout || '0'}</span>
                          <span className="text-sm font-semibold text-muted-foreground">/{draftData.payoutType}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {draftData.location || 'Location'}</span>
                        </div>
                      </div>

                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-center">
                        <p className="text-sm font-bold text-primary">This job will be sent to 45 nearby matched students.</p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              <div className="p-6 sm:p-8 border-t border-border/30 bg-background/50 flex justify-between items-center shrink-0 z-10 relative">
                {currentStep > 1 ? (
                  <button 
                    onClick={prevStep}
                    className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {currentStep < 4 ? (
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-1.5 text-sm font-bold bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-6 py-3 rounded-xl transition-all active:scale-95"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-1.5 text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 px-8 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-md shadow-primary/20"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Job'}
                  </button>
                )}
              </div>
            </>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  )
}
