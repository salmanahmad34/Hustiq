import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuickApply } from '@/store/useQuickApply'
import { X, CheckCircle2, Clock, Zap, Send, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackJobApplicationStarted, trackJobApplicationSubmitted } from '@/services/analytics'

export const QuickApplyModal = () => {
  const { isOpen, selectedJob, isSuccess, close, submitApplication } = useQuickApply()
  const [isMobile, setIsMobile] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setNote('')
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && selectedJob) {
      trackJobApplicationStarted(selectedJob.id, selectedJob.title)
    }
  }, [isOpen, selectedJob])

  useEffect(() => {
    if (isSuccess && selectedJob) {
      trackJobApplicationSubmitted(
        selectedJob.id,
        selectedJob.title,
        'usr-salman',
        selectedJob.payout,
        selectedJob.payoutType
      )
    }
  }, [isSuccess, selectedJob])

  if (!selectedJob) return null

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  } as const

  const modalVariants = {
    hidden: isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 },
    visible: isMobile 
      ? { y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } } 
      : { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-center items-end sm:items-center">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={!isSuccess ? close : undefined}
            className="absolute inset-0 bg-background/80"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "relative bg-card flex flex-col shadow-2xl overflow-hidden border border-border/50",
              isMobile 
                ? "w-full rounded-t-[2.5rem] mt-auto" // Mobile Sheet
                : "w-full max-w-[500px] rounded-[2.5rem]" // Desktop Modal
            )}
          >
            {/* Subtle Glow Underlay */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {!isSuccess ? (
              // --------------------------------------------------------
              // APPLY FORM VIEW
              // --------------------------------------------------------
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="relative z-10 flex flex-col p-6 sm:p-8"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1rem] bg-muted/50 flex items-center justify-center text-2xl border border-border/50">
                      {selectedJob.logoPlaceholder}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{selectedJob.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedJob.businessName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={close}
                    className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedJob.isUrgent && (
                  <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 px-3 py-2 rounded-xl mb-6 w-max uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5" /> High Priority Applicant
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 shrink-0 text-background flex items-center justify-center font-bold text-lg shadow-sm">
                      S
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Applying as Salman</span>
                      <span className="text-xs text-muted-foreground mt-0.5">Your profile and verified skills will be attached automatically.</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-foreground/80 pl-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Optional Note
                    </label>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Why are you a good fit?"
                      className="w-full bg-background border border-border/50 rounded-2xl p-4 text-sm resize-none h-24 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => submitApplication(note)}
                  className="w-full bg-foreground text-background font-bold py-4 rounded-2xl hover:bg-primary hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 text-base flex items-center justify-center gap-2 group"
                >
                  Confirm Application
                  <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-center text-xs text-muted-foreground/60 mt-4">
                  By applying, you agree to share your profile with {selectedJob.businessName}.
                </p>
              </motion.div>
            ) : (
              // --------------------------------------------------------
              // SUCCESS VIEW
              // --------------------------------------------------------
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex flex-col items-center justify-center p-10 sm:p-14 text-center min-h-[350px]"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </motion.div>
                
                <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Application Sent!</h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-[280px] mb-8">
                  Your profile has been prioritized and delivered to {selectedJob.businessName}.
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold text-foreground/70 bg-muted/30 px-4 py-2 rounded-full border border-border/40">
                  <Clock className="w-3.5 h-3.5 text-primary" /> 
                  Usually responds in 2 hours
                </div>
              </motion.div>
            )}
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
