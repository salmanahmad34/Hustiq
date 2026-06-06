import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { fetchAllJobs, fetchProviderJobs, fetchJobById, updateJob } from '@/services/supabase/db'
import type { Job } from '@/types/database'

interface JobsState {
  jobs: Job[]
  isLoading: boolean
  error: string | null
  lastFetch: number | null

  // Actions
  fetchJobs: (forceRefresh?: boolean) => Promise<void>
  fetchProviderJobs: (providerId: string) => Promise<void>
  getJobById: (jobId: string) => Promise<Job | null>
  toggleJobActive: (jobId: string, currentlyActive: boolean) => Promise<void>
  clearError: () => void
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export const useJobs = create<JobsState>()(
  devtools((set, get) => ({
    jobs: [],
    isLoading: false,
    error: null,
    lastFetch: null,

    fetchJobs: async (forceRefresh = false) => {
      const state = get()

      // Return cached data if fresh
      if (!forceRefresh && state.lastFetch && Date.now() - state.lastFetch < CACHE_DURATION) {
        return
      }

      set({ isLoading: true, error: null })
      try {
        const jobs = await fetchAllJobs()
        set({
          jobs,
          lastFetch: Date.now()
        })
      } catch (err: any) {
        set({ error: err.message || 'Failed to fetch jobs' })
      } finally {
        set({ isLoading: false })
      }
    },

    fetchProviderJobs: async (providerId: string) => {
      set({ isLoading: true, error: null })
      try {
        const jobs = await fetchProviderJobs(providerId)
        set({ jobs })
      } catch (err: any) {
        set({ error: err.message || 'Failed to fetch provider jobs' })
      } finally {
        set({ isLoading: false })
      }
    },

    getJobById: async (jobId: string) => {
      try {
        return await fetchJobById(jobId)
      } catch (err: any) {
        set({ error: err.message || 'Failed to fetch job' })
        return null
      }
    },

    toggleJobActive: async (jobId: string, currentlyActive: boolean) => {
      const newActive = !currentlyActive
      // Optimistic update
      set(state => ({
        jobs: state.jobs.map(j => j.id === jobId ? { ...j, is_active: newActive } : j)
      }))
      try {
        console.log(`[JOB] Toggling job ${jobId} → is_active: ${newActive}`)
        const updated = await updateJob(jobId, { is_active: newActive })
        if (!updated) throw new Error('Update returned null')
        console.log(`[JOB] Job ${jobId} is now ${newActive ? 'active' : 'closed'}`)
      } catch (err: any) {
        console.error('[JOB] Toggle failed, reverting:', err)
        // Revert on failure
        set(state => ({
          jobs: state.jobs.map(j => j.id === jobId ? { ...j, is_active: currentlyActive } : j)
        }))
      }
    },

    clearError: () => set({ error: null })
  }), { name: 'JobsStore' })
)
