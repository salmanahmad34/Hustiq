// @ts-nocheck
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  fetchStudentApplications,
  fetchProviderApplications,
  submitApplication,
  updateApplicationStatus,
  checkApplicationExists
} from '@/services/supabase/db'
import type { Application, ApplicationInsert, ApplicationUpdate } from '@/types/database'

interface ApplicationsState {
  applications: Application[]
  isLoading: boolean
  error: string | null
  completedAppIds: string[]

  // Actions
  fetchStudentApplications: (studentId: string) => Promise<void>
  fetchProviderApplications: (providerId: string) => Promise<void>
  submitApplication: (application: ApplicationInsert) => Promise<Application | null>
  updateApplicationStatus: (appId: string, updates: ApplicationUpdate) => Promise<Application | null>
  checkApplicationExists: (jobId: string, studentId: string) => Promise<boolean>
  completeApplication: (appId: string) => void
  clearError: () => void
}

export const useApplications = create<ApplicationsState>()(
  devtools(
    (set, get) => ({
      applications: [],
      isLoading: false,
      error: null,
      completedAppIds: JSON.parse(localStorage.getItem('hustiq_completed_apps') || '[]'),

      completeApplication: (appId: string) => {
        const current = get().completedAppIds
        if (!current.includes(appId)) {
          const updated = [...current, appId]
          localStorage.setItem('hustiq_completed_apps', JSON.stringify(updated))
          set({ completedAppIds: updated })
        }
      },

      fetchStudentApplications: async (studentId: string) => {
        set({ isLoading: true, error: null })
        try {
          const applications = await fetchStudentApplications(studentId)
          set({ applications })
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch applications' })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchProviderApplications: async (providerId: string) => {
        set({ isLoading: true, error: null })
        try {
          const applications = await fetchProviderApplications(providerId)
          set({ applications })
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch applications' })
        } finally {
          set({ isLoading: false })
        }
      },

      submitApplication: async (application: ApplicationInsert) => {
        set({ isLoading: true, error: null })
        try {
          const result = await submitApplication(application)
          if (result) {
            set((state) => ({
              applications: [result, ...state.applications]
            }))
          }
          return result
        } catch (err: any) {
          set({ error: err.message || 'Failed to submit application' })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      updateApplicationStatus: async (appId: string, updates: ApplicationUpdate) => {
        set({ isLoading: true, error: null })
        try {
          const result = await updateApplicationStatus(appId, updates)
          if (result) {
            set((state) => ({
              applications: state.applications.map((app) => (app.id === appId ? result : app))
            }))
          }
          return result
        } catch (err: any) {
          set({ error: err.message || 'Failed to update application' })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      checkApplicationExists: async (jobId: string, studentId: string) => {
        try {
          return await checkApplicationExists(jobId, studentId)
        } catch (err: any) {
          console.error('Failed to check application:', err)
          return false
        }
      },

      clearError: () => set({ error: null })
    }),
    { name: 'ApplicationsStore' }
  )
)
