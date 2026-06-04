import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import { useApplications } from '@/store/useApplications'
import { useNotifications } from '@/store/useNotifications'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'
import { isSupabaseConfigured } from '@/services/supabase/auth'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ReviewModal } from '@/components/reviews/ReviewModal'

export interface Applicant {
  id: string
  name: string
  avatar: string
  jobApplied: string
  distance: string
  availability: string
  skills: string[]
  matchScore: number
  studentId: string
  jobId: string
  status?: string
}

interface ApplicantCardProps {
  applicant: Applicant
  index: number
}

const itemVariants = {
  hidden: { opacity: 0, x: 15 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
} as const

export const ApplicantCard = memo(({ applicant }: ApplicantCardProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAccepted = applicant.status === 'accepted'
  const isRejected = applicant.status === 'rejected'
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const handleAccept = async () => {
    try {
      const isMock = !applicant.studentId || applicant.studentId.startsWith('00000000-') || applicant.id.startsWith('sim-')
      
      if (isSupabaseConfigured() && !isMock) {
        await useApplications.getState().updateApplicationStatus(applicant.id, { status: 'accepted' })
        
        // Notify the student
        await useNotifications.getState().addNotification({
          title: 'Application Accepted! 🎉',
          message: `${user?.name || 'The provider'} has accepted your application for ${applicant.jobApplied}.`,
          type: 'offer_accepted',
          isPriority: true,
          category: 'today',
          role: 'student',
          actionPath: '/jobs',
          actionText: 'View Status'
        }, applicant.studentId)
        
        useUiStore.getState().addToast('Application accepted successfully!', 'success')
      } else {
        useUiStore.getState().addToast('Application accepted (Demo Mode)', 'success')
      }
    } catch (err) {
      console.error(err)
      useUiStore.getState().addToast('Failed to accept application', 'error')
    }
  }

  const handleReject = async () => {
    try {
      const isMock = !applicant.studentId || applicant.studentId.startsWith('00000000-') || applicant.id.startsWith('sim-')
      
      if (isSupabaseConfigured() && !isMock) {
        await useApplications.getState().updateApplicationStatus(applicant.id, { status: 'rejected' })
        
        // Notify the student
        await useNotifications.getState().addNotification({
          title: 'Application Update',
          message: `Your application for ${applicant.jobApplied} was not selected this time.`,
          type: 'offer_rejected',
          isPriority: false,
          category: 'today',
          role: 'student',
          actionPath: '/jobs',
          actionText: 'View Status'
        }, applicant.studentId)
        
        useUiStore.getState().addToast('Application rejected.', 'info')
      } else {
        useUiStore.getState().addToast('Application rejected (Demo Mode)', 'info')
      }
    } catch (err) {
      console.error(err)
      useUiStore.getState().addToast('Failed to reject application', 'error')
    }
  }

  const handleChat = () => {
    if (applicant.studentId) {
      navigate(`/messages?recipientId=${applicant.studentId}`)
    } else {
      useUiStore.getState().addToast('Chat is not available for this candidate.', 'error')
    }
  }

  return (
    <motion.div 
      variants={itemVariants}
      className={cn(
        "group bg-card border border-border/40 hover:border-border/80 shadow-sm transition-all duration-200 rounded-[1.5rem] p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden",
        isAccepted && "border-emerald-500/30 bg-emerald-500/5",
        isRejected && "border-red-500/10 bg-red-500/5 opacity-70"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl border border-border/50 shrink-0 shadow-sm">
          {applicant.avatar}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-foreground truncate text-base">{applicant.name}</h4>
            <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
              {applicant.matchScore}% Match
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-1">
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {applicant.distance}
            </span>
            <span>•</span>
            <span className="truncate">{applicant.jobApplied}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/80" />
          Available: {applicant.availability}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {applicant.skills.map((skill, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-muted rounded-md text-foreground/70">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {isAccepted ? (
          <div className="flex-1 flex gap-2">
            <div className="flex-1 bg-emerald-500/20 text-emerald-500 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Accepted
            </div>
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 text-sm transition-all"
            >
              ★ Review Student
            </button>
          </div>
        ) : isRejected ? (
          <div className="flex-1 bg-red-500/10 text-red-500 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm">
            <XCircle className="w-4 h-4" /> Rejected
          </div>
        ) : (
          <>
            <button 
              onClick={handleAccept}
              className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept
            </button>
            <button 
              onClick={handleReject}
              className="flex-1 bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </>
        )}
        <button 
          onClick={handleChat}
          className="w-10 shrink-0 bg-muted/30 text-muted-foreground hover:text-primary font-bold rounded-xl transition-colors flex items-center justify-center"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      <ReviewModal 
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        subjectId={applicant.studentId || 'mock-student'}
        subjectName={applicant.name}
        subjectAvatar={applicant.avatar}
        reviewerRole="provider"
        jobTitle={applicant.jobApplied}
      />
    </motion.div>
  )
})

ApplicantCard.displayName = 'ApplicantCard'
