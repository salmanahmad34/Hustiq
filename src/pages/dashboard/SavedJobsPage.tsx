import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Zap, Navigation, MapPin, IndianRupee, Clock, Trash2, ArrowUpRight } from 'lucide-react'
import { useSavedJobs } from '@/store/useSavedJobs'
import { useJobDetails } from '@/store/useJobDetails'
import { useQuickApply } from '@/store/useQuickApply'
import { cn } from '@/lib/utils'
import type { Job } from '@/components/dashboard/JobCard'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
} as const

// Compact saved job card used inside the Saved Jobs page
const SavedJobRow = ({ job, savedAt }: { job: Job; savedAt: number }) => {
  const { open: openDetails } = useJobDetails()
  const { open: openQuickApply } = useQuickApply()
  const { unsaveJob } = useSavedJobs()
  const savedDate = new Date(savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <motion.div
      layout
      variants={itemVariants}
      exit="exit"
      onClick={() => openDetails(job)}
      className="group relative bg-card border border-border/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary/20 hover:shadow-lg transition-all duration-200 overflow-hidden text-left"
    >
      {/* Subtle Glow */}
      <div className={cn(
        "absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        job.isUrgent ? "bg-destructive/10" : job.isNearby ? "bg-emerald-500/8" : "bg-primary/8"
      )} />

      {/* Main body (Logo + Title/Meta) */}
      <div className="flex items-start gap-4 flex-1 min-w-0 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-xl shrink-0 group-hover:bg-primary/5 transition-colors">
          {job.logoPlaceholder}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {job.isUrgent && (
              <span className="flex items-center gap-1 bg-destructive/10 text-destructive text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                <Zap className="w-2.5 h-2.5" /> Urgent
              </span>
            )}
            {job.isNearby && (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                <Navigation className="w-2.5 h-2.5" /> Nearby
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium truncate">{job.businessName}</p>
          
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className={cn("w-3.5 h-3.5", job.isNearby && "text-emerald-500")} />
              <span className="truncate max-w-[120px] sm:max-w-[150px]">{job.location}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px] sm:max-w-[150px]">{job.timing}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Payout & Date Block */}
      <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-3 sm:pt-0 border-t sm:border-t-0 border-border/20 shrink-0 relative z-10 gap-2">
        <div className="flex flex-col text-left sm:text-right">
          <div className="flex items-baseline gap-0.5">
            <IndianRupee className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-black text-xl text-foreground tracking-tighter">{job.payout}</span>
            <span className="text-xs text-muted-foreground ml-0.5">/{job.payoutType}</span>
          </div>
          <span className="text-[9px] text-muted-foreground/60 mt-0.5">Saved {savedDate}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); openQuickApply(job) }}
            className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:shadow-lg transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); unsaveJob(job.id) }}
            className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Empty state
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={springTransition}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
      <Bookmark className="w-9 h-9 text-muted-foreground/40" />
    </div>
    <h3 className="text-xl font-bold text-foreground mb-2">No saved jobs yet</h3>
    <p className="text-muted-foreground max-w-xs leading-relaxed">
      Tap the <Bookmark className="w-4 h-4 inline relative -top-0.5" /> bookmark on any job card to save it here for later.
    </p>
  </motion.div>
)

export const SavedJobsPage = () => {
  const { getSavedList } = useSavedJobs()
  const savedList = getSavedList()

  const recentlySaved = savedList.slice(0, 5)
  const nearbySaved = savedList.filter(({ job }) => job.isNearby)
  const urgentSaved = savedList.filter(({ job }) => job.isUrgent)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-primary fill-primary/30" />
              </span>
              Saved Jobs
            </h1>
            <p className="text-muted-foreground mt-1.5 ml-[52px]">
              {savedList.length === 0
                ? 'Jobs you bookmark will appear here.'
                : `${savedList.length} job${savedList.length !== 1 ? 's' : ''} saved — apply anytime.`}
            </p>
          </div>
        </div>
      </motion.div>

      {savedList.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Recently Saved */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Recently Saved
            </h2>
            <motion.div className="space-y-3">
              <AnimatePresence>
                {recentlySaved.map(({ job, savedAt }) => (
                  <SavedJobRow key={job.id} job={job} savedAt={savedAt} />
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.section>

          {/* Nearby Saved */}
          {nearbySaved.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
            >
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Nearby Saved
              </h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {nearbySaved.map(({ job, savedAt }) => (
                    <SavedJobRow key={`nearby-${job.id}`} job={job} savedAt={savedAt} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* Urgent Saved */}
          {urgentSaved.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
            >
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-destructive" />
                Urgent Saved
              </h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {urgentSaved.map(({ job, savedAt }) => (
                    <SavedJobRow key={`urgent-${job.id}`} job={job} savedAt={savedAt} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </>
      )}
    </div>
  )
}
