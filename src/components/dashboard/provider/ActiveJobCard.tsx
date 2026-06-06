import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, AlertCircle, IndianRupee, MoreHorizontal, Power, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveJob {
  id: string
  title: string
  applicantsCount: number
  newApplicants: number
  isUrgent: boolean
  isActive: boolean
  payout: number
  payoutType: string
  postedDate: string
}

interface ActiveJobCardProps {
  job: ActiveJob
  index: number
  onToggleActive: () => Promise<void>
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
} as const

export const ActiveJobCard = memo(({ job, onToggleActive }: ActiveJobCardProps) => {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
      await onToggleActive()
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="group bg-card border border-border/40 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col rounded-[2rem] p-6 sm:p-8 cursor-pointer relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        
        {/* Left Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border",
              job.isActive 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                : "bg-muted text-muted-foreground border-border/50"
            )}>
              {job.isActive ? "Active" : "Closed"}
            </span>
            {job.isUrgent && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Urgent
              </span>
            )}
            <span className="text-xs font-semibold text-muted-foreground/70 ml-2">
              Posted {job.postedDate}
            </span>
          </div>
          
          <h3 className="text-2xl font-black text-foreground truncate">{job.title}</h3>
          
          <div className="flex items-center gap-1.5 mt-2">
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{job.payout}</span>
            <span className="text-sm font-semibold text-muted-foreground">/{job.payoutType}</span>
          </div>
        </div>

        {/* Right Actions & Stats */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 shrink-0">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors border border-border/40 sm:border-transparent group-hover:border-border/40">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-foreground flex items-center gap-1">
                {job.applicantsCount} <Users className="w-5 h-5 text-muted-foreground/50" />
              </span>
              {job.newApplicants > 0 && (
                <span className="text-xs font-bold text-primary">
                  +{job.newApplicants} new
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
        <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
          View Applicants
        </button>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={cn(
            "text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60",
            job.isActive ? "text-muted-foreground hover:text-red-500" : "text-muted-foreground hover:text-emerald-500"
          )}
        >
          {isToggling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Power className="w-4 h-4" />
          )}
          {isToggling
            ? (job.isActive ? 'Closing...' : 'Reactivating...')
            : (job.isActive ? 'Close Job' : 'Reactivate')}
        </button>
      </div>

    </motion.div>
  )
})

ActiveJobCard.displayName = 'ActiveJobCard'
