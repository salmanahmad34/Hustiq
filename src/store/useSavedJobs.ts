import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Job } from '@/components/dashboard/JobCard'
import { isSupabaseConfigured } from '@/services/supabase/auth'
import { saveJobToDb, unsaveJobFromDb, fetchSavedJobsFromDb } from '@/services/supabase/db'

interface SavedJobsState {
  savedJobs: Record<string, { job: Job; savedAt: number }>
  saveJob: (job: Job, studentId?: string) => Promise<void>
  unsaveJob: (id: string, studentId?: string) => Promise<void>
  isSaved: (id: string) => boolean
  getSavedList: () => { job: Job; savedAt: number }[]
  loadSavedJobs: (studentId: string) => Promise<void>
}

export const useSavedJobs = create<SavedJobsState>()(
  persist(
    (set, get) => ({
      savedJobs: {},

      saveJob: async (job, studentId) => {
        set((state) => ({
          savedJobs: {
            ...state.savedJobs,
            [job.id]: { job, savedAt: Date.now() },
          },
        }))

        try {
          const isMock = !studentId || studentId.startsWith('mock-') || studentId.startsWith('demo-') || studentId.startsWith('00000000-')
          if (isSupabaseConfigured() && !isMock) {
            await saveJobToDb(studentId, job.id)
          }
        } catch (err) {
          console.error('Error saving job to Supabase:', err)
        }
      },

      unsaveJob: async (id, studentId) => {
        set((state) => {
          const next = { ...state.savedJobs }
          delete next[id]
          return { savedJobs: next }
        })

        try {
          const isMock = !studentId || studentId.startsWith('mock-') || studentId.startsWith('demo-') || studentId.startsWith('00000000-')
          if (isSupabaseConfigured() && !isMock) {
            await unsaveJobFromDb(studentId, id)
          }
        } catch (err) {
          console.error('Error deleting saved job from Supabase:', err)
        }
      },

      isSaved: (id) => !!get().savedJobs[id],

      getSavedList: () =>
        Object.values(get().savedJobs).sort((a, b) => b.savedAt - a.savedAt),

      loadSavedJobs: async (studentId) => {
        const isMock = !studentId || studentId.startsWith('mock-') || studentId.startsWith('demo-') || studentId.startsWith('00000000-')
        if (!isSupabaseConfigured() || isMock) return

        try {
          const data = await fetchSavedJobsFromDb(studentId)
          const loaded: Record<string, { job: Job; savedAt: number }> = {}
          
          data.forEach((row: any) => {
            if (row.job_id) {
              const job: Job = {
                id: row.job_id.id,
                title: row.job_id.title,
                businessName: row.job_id.business_name,
                description: row.job_id.description,
                payout: row.job_id.payout,
                payoutType: row.job_id.payout_type,
                isUrgent: row.job_id.is_urgent,
                isPremium: row.job_id.is_premium,
                isVerified: row.job_id.is_verified,
                location: row.job_id.location,
                distance: row.job_id.distance,
                timing: row.job_id.timing,
                postedTime: row.job_id.posted_time,
                tags: row.job_id.tags,
                logoPlaceholder: row.job_id.logo_placeholder
              }
              loaded[job.id] = { job, savedAt: new Date(row.created_at).getTime() }
            }
          })

          set({ savedJobs: loaded })
        } catch (err) {
          console.error('Failed to load saved jobs from Supabase:', err)
        }
      }
    }),
    { name: 'zivaro-saved-jobs' }
  )
)
