import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search, Bell, Plus } from 'lucide-react'

import { ActiveJobCard } from '@/components/dashboard/provider/ActiveJobCard'
import { ApplicantCard } from '@/components/dashboard/provider/ApplicantCard'
import { ProviderQuickActions } from '@/components/dashboard/provider/ProviderQuickActions'
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown'
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown'
import { FirstTimeGuidance } from '@/components/shared/FirstTimeGuidance'

import { usePostJob } from '@/store/usePostJob'
import { useNotifications } from '@/store/useNotifications'
import { useAuth } from '@/store/useAuth'
import { useJobs } from '@/store/useJobs'
import { useApplications } from '@/store/useApplications'
import type { ApplicationWithDetails } from '@/types/database'

export const ProviderDashboardPage = () => {
  const { open: openPostJob } = usePostJob()
  const { toggleOpen, notifications } = useNotifications()
  const { user } = useAuth()
  const { jobs, fetchProviderJobs, isLoading: isLoadingJobs } = useJobs()
  const { applications, fetchProviderApplications, isLoading: isLoadingApps } = useApplications()

  const [tourState, setTourState] = useState({ dismissed: true, progress: 0 })

  useEffect(() => {
    const updateState = () => {
      if (!user?.id) return
      const userId = user.id
      const savedDismissed = localStorage.getItem(`zivaro_tour_dismissed_${userId}`)
      const savedCompleted = localStorage.getItem(`zivaro_tour_completed_${userId}`)
      const completedList = savedCompleted ? JSON.parse(savedCompleted) : []
      setTourState({
        dismissed: savedDismissed === 'true',
        progress: Math.round((completedList.length / 4) * 100)
      })
    }

    updateState()
    window.addEventListener('zivaro-tour-updated', updateState)
    return () => window.removeEventListener('zivaro-tour-updated', updateState)
  }, [user?.id])

  const appsWithDetails = applications as ApplicationWithDetails[]

  useEffect(() => {
    if (user?.id) {
      fetchProviderJobs(user.id)
      fetchProviderApplications(user.id)
    }
  }, [user?.id, fetchProviderJobs, fetchProviderApplications])

  const hasUnread = notifications
    .filter(n => n.role === 'provider')
    .some(n => n.isUnread)

  const activeJobs = jobs.map(job => {
    const jobApps = appsWithDetails.filter(app => app.job_id === job.id)
    const newApps = jobApps.filter(app => app.status === 'applied').length
    
    return {
      id: job.id,
      title: job.title,
      applicantsCount: jobApps.length,
      newApplicants: newApps,
      isUrgent: job.is_urgent || false,
      isActive: true,
      payout: job.payout,
      payoutType: job.payout_type,
      postedDate: new Date(job.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    }
  })

  const applicantsList = appsWithDetails.map(app => {
    const studentProfile = app.student
    const jobInfo = app.job
    const studentMeta = studentProfile?.metadata || {}
    
    return {
      id: app.id,
      name: studentProfile?.name || 'Anonymous Student',
      avatar: studentMeta.avatar || '👨🏽‍🎓',
      jobApplied: jobInfo?.title || 'General Gig',
      distance: studentMeta.distance || '1.5km',
      availability: studentMeta.availability || 'Weekends',
      skills: studentMeta.skills || ['Hardworking'],
      matchScore: studentMeta.matchScore || 85,
      studentId: studentProfile?.id || '',
      jobId: jobInfo?.id || '',
      status: app.status
    }
  })

  return (
    <div className="flex flex-col h-full w-full pb-20 md:pb-0">

      {/* Provider Topbar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-4 px-2 -mx-2 sm:px-0 sm:mx-0 border-b border-border/40 mb-6">
        <div className="flex items-center justify-between gap-4 relative">

          <div className="relative flex-1 max-w-xl hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

            <input
              type="text"
              placeholder="Search jobs, applicants, or messages..."
              className="w-full bg-muted/30 border border-border/50 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">

            {/* Primary Post Job CTA */}
            <button
              id="post-job-btn"
              onClick={openPostJob}
              className="hidden sm:flex items-center gap-2 bg-foreground text-background font-bold py-2.5 px-5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Post Job
            </button>

            <div className="w-[1px] h-6 bg-border/50 hidden sm:block mx-1" />

            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={toggleOpen}
                className="relative w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors border border-border/50 shadow-sm"
              >
                <Bell className="w-5 h-5" />

                {hasUnread && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                )}
              </button>

              <NotificationDropdown />
            </div>

            <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-border/40">

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-foreground leading-tight">
                  {user?.name || 'Third Wave Coffee'}
                </span>

                <span className="text-xs font-semibold text-primary">
                  Provider Account
                </span>
              </div>

              <ProfileDropdown isMobile={true} />
            </div>
          </div>
        </div>
      </div>

      {!tourState.dismissed && tourState.progress < 100 && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden text-left mb-6 max-w-[1600px] mx-auto w-full px-6">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm inline-block mb-2">
              HustiQ Provider Onboarding
            </span>
            <h4 className="text-lg font-black text-foreground">Complete Provider Setup</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Complete all onboarding setup milestones to fully unlock smart applicant matching and escrow payout structures!
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${tourState.progress}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground">{tourState.progress}% Done</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-setup-guide'))}
              className="bg-primary text-primary-foreground font-black text-xs py-2.5 px-5 rounded-xl hover:shadow-lg active:scale-95 transition-all"
            >
              Resume Setup
            </button>
            <button
              onClick={() => {
                if (user?.id) {
                  localStorage.setItem(`zivaro_tour_dismissed_${user.id}`, 'true')
                  window.dispatchEvent(new CustomEvent('zivaro-tour-updated'))
                }
              }}
              className="bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto px-2 sm:px-0">

        {/* Left Column: Active Jobs */}
        <div className="flex-1 flex flex-col gap-6">

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
              Hiring Workspace
            </h1>

            <p className="text-muted-foreground font-medium">
              Manage your active job postings and track applicant metrics.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {isLoadingJobs ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : activeJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border/40 rounded-[2rem] h-[200px]">
                  <p className="text-muted-foreground font-semibold">No active jobs posted yet.</p>
                  <button onClick={openPostJob} className="text-primary font-bold text-sm hover:underline mt-2">Post your first gig now</button>
                </div>
              ) : (
                activeJobs.map((job, index) => (
                  <ActiveJobCard
                    key={job.id}
                    job={job}
                    index={index}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Applicants & Actions */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col gap-8">

          <div id="quick-actions-container">
            <ProviderQuickActions />
          </div>

          <div
            id="applicants-queue-container"
            className="flex flex-col gap-4"
          >

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Applicants Queue
              </h2>

              <button className="text-sm font-bold text-primary hover:underline">
                View All
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {isLoadingApps ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                  </div>
                ) : applicantsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm font-semibold bg-card border border-border/40 rounded-[1.5rem] p-4">
                    No applicants in queue.
                  </div>
                ) : (
                  applicantsList.map((app, index) => (
                    <ApplicantCard
                      key={app.id}
                      applicant={app}
                      index={index}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>

      <FirstTimeGuidance />
    </div>
  )
}