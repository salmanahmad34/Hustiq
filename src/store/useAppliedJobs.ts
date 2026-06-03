// @ts-nocheck
import { create } from 'zustand'
import { isSupabaseConfigured } from '@/services/supabase/auth'
import { fetchApplicationsFromDb } from '@/services/supabase/db'

export type ApplicationStatus = 'applied' | 'viewed' | 'accepted' | 'rejected'

export interface AppliedJobRecord {
  id: string
  status: ApplicationStatus
  appliedAt: number
}

interface AppliedJobsState {
  appliedJobs: Record<string, AppliedJobRecord>
  addAppliedJob: (id: string, status?: ApplicationStatus) => void
  isApplied: (id: string) => boolean
  loadAppliedJobs: (userId: string, role: 'student' | 'provider') => Promise<void>
}

export const useAppliedJobs = create<AppliedJobsState>((set, get) => ({
  appliedJobs: {},
  addAppliedJob: (id, status = 'applied') => set((state) => ({
    appliedJobs: {
      ...state.appliedJobs,
      [id]: {
        id,
        status,
        appliedAt: Date.now()
      }
    }
  })),
  isApplied: (id) => !!get().appliedJobs[id],
  loadAppliedJobs: async (userId, role) => {
    const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-') || userId.startsWith('00000000-')
    if (!isSupabaseConfigured() || isMock) return

    try {
      const data = await fetchApplicationsFromDb(userId, role)
      const loaded: Record<string, AppliedJobRecord> = {}
      
      data.forEach((row: any) => {
        const jobId = row.job_id?.id || row.job_id
        if (jobId) {
          loaded[jobId] = {
            id: jobId,
            status: row.status as ApplicationStatus,
            appliedAt: new Date(row.created_at).getTime()
          }
        }
      })

      set({ appliedJobs: loaded })
    } catch (err) {
      console.error('Failed to load applications from Supabase:', err)
    }
  }
}))
