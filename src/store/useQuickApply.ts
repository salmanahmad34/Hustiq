import { create } from 'zustand'
import { type Job } from '@/components/dashboard/JobCard'
import { useAppliedJobs } from '@/store/useAppliedJobs'
import { useApplications } from '@/store/useApplications'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'
import { isSupabaseConfigured } from '@/services/supabase/auth'

interface QuickApplyState {
  selectedJob: Job | null
  isOpen: boolean
  isSuccess: boolean
  open: (job: Job) => void
  close: () => void
  submitApplication: (note?: string) => Promise<void>
  reset: () => void
}

export const useQuickApply = create<QuickApplyState>((set, get) => ({
  selectedJob: null,
  isOpen: false,
  isSuccess: false,
  open: (job) => set({ selectedJob: job, isOpen: true, isSuccess: false }),
  close: () => set({ isOpen: false }),
  submitApplication: async (note?: string) => {
    const job = get().selectedJob
    if (!job) return

    const { isApplied, addAppliedJob } = useAppliedJobs.getState()
    
    // Prevent duplicate applications
    if (isApplied(job.id)) {
      useUiStore.getState().addToast('You have already applied for this job.', 'error')
      return
    }

    const { user } = useAuth.getState()
    const studentId = user?.id || 'demo-user-123'
    const isMock = !studentId || studentId.startsWith('demo-') || studentId.startsWith('mock-')

    if (isSupabaseConfigured() && !isMock) {
      const application = {
        job_id: job.id,
        student_id: studentId,
        status: 'applied' as const,
        note: typeof note === 'string' ? note : ''
      }
      
      const result = await useApplications.getState().submitApplication(application)
      const error = useApplications.getState().error
      if (error || !result) {
        useUiStore.getState().addToast(error || 'Failed to submit application. Please try again.', 'error')
        return
      }

      // Notify the provider of the new application in Supabase
      if (job.provider_id) {
        const { useNotifications } = await import('@/store/useNotifications')
        await useNotifications.getState().addNotification({
          title: 'New Applicant Received',
          message: `${user?.name || 'A student'} applied for your job "${job.title}"`,
          type: 'new_applicant',
          isPriority: true,
          category: 'today',
          role: 'provider',
          actionPath: '/dashboard',
          actionText: 'Review Candidate'
        }, job.provider_id)
      }
    }

    // Success flow
    addAppliedJob(job.id)
    set({ isSuccess: true })
    useUiStore.getState().addToast('Application submitted successfully!', 'success')
    
    // Auto close after success animation
    setTimeout(() => {
      set({ isOpen: false })
      setTimeout(() => set({ isSuccess: false, selectedJob: null }), 300)
    }, 2500)
  },
  reset: () => set({ isSuccess: false, selectedJob: null, isOpen: false })
}))
