import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, IndianRupee, MapPin, Eye, CheckCircle2, XCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Job } from '@/components/dashboard/JobCard'
import { type ApplicationStatus } from '@/store/useAppliedJobs'
import { ReviewModal } from '@/components/reviews/ReviewModal'

interface ApplicationCardProps {
  job: Job
  status: ApplicationStatus
  appliedDate: string
  responseEstimate: string
  index: number
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
} as const

export const ApplicationCard = ({ job, status, appliedDate, responseEstimate }: ApplicationCardProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  
  const getStatusConfig = () => {
    switch(status) {
      case 'viewed':
        return {
          label: 'Viewed',
          icon: <Eye className="w-3.5 h-3.5" />,
          style: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }
      case 'accepted':
        return {
          label: 'Accepted',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }
      case 'rejected':
        return {
          label: 'Not Selected',
          icon: <XCircle className="w-3.5 h-3.5" />,
          style: 'bg-muted text-muted-foreground border-border/50 opacity-80'
        }
      default:
        return {
          label: 'Application Sent',
          icon: <Send className="w-3.5 h-3.5" />,
          style: 'bg-primary/10 text-primary border-primary/20'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2 }}
      className="group bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 rounded-[2rem] p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center w-full relative overflow-hidden"
    >
      {/* Visual Accent for Accepted */}
      {status === 'accepted' && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-[2rem]" />
      )}

      {/* Provider Logo */}
      <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform duration-500">
        {job.logoPlaceholder}
      </div>

      {/* Core Info */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">{job.businessName}</span>
          <span className="w-1 h-1 rounded-full bg-border/50" />
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {job.location}
          </span>
        </div>
        <h3 className="text-xl font-bold text-foreground leading-tight">{job.title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Applied: {appliedDate}
          </span>
          {status !== 'rejected' && status !== 'accepted' && (
            <span className="text-xs font-semibold text-muted-foreground/70 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {responseEstimate}
            </span>
          )}
        </div>
      </div>

      {/* Payout & Status Badge */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-border/30 sm:border-t-0 shrink-0">
        <div className="flex items-baseline gap-1">
          <IndianRupee className="w-4 h-4 text-foreground/80 -mr-1" />
          <span className="text-2xl font-black text-foreground tracking-tight">{job.payout}</span>
          <span className="text-xs font-bold text-muted-foreground">/{job.payoutType}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {status === 'accepted' && (
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1"
            >
              ★ Leave Review
            </button>
          )}
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold", config.style)}>
            {config.icon} {config.label}
          </div>
        </div>
      </div>

      <ReviewModal 
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        subjectId={job.provider_id || 'mock-provider'}
        subjectName={job.businessName}
        subjectAvatar={job.logoPlaceholder}
        reviewerRole="student"
        jobTitle={job.title}
      />
    </motion.div>
  )
}
