import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ApplicationCard } from '@/components/dashboard/ApplicationCard'
import { type Job } from '@/components/dashboard/JobCard'
import { type ApplicationStatus } from '@/store/useAppliedJobs'
import { cn } from '@/lib/utils'
import { useApplications } from '@/store/useApplications'
import { useAuth } from '@/store/useAuth'

interface TrackedApplication {
  id: string
  job: Job
  status: ApplicationStatus
  appliedDate: string
  responseEstimate: string
}

const TABS: { id: ApplicationStatus | 'all', label: string }[] = [
  { id: 'all', label: 'All Applications' },
  { id: 'applied', label: 'Applied' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Not Selected' }
]

// Mock data representing the tracking pipeline
const MOCK_APPLICATIONS: TrackedApplication[] = [
  {
    id: 'app-1',
    status: 'accepted',
    appliedDate: 'Oct 12',
    responseEstimate: 'Responded',
    job: {
      id: 'job-101',
      title: 'Weekend Barista',
      businessName: 'Third Wave Coffee',
      description: 'Looking for an energetic barista for weekend shifts.',
      payout: 450,
      payoutType: 'shift',
      isUrgent: false,
      isPremium: true,
      location: 'Koramangala',
      distance: '1.2km',
      timing: 'Sat-Sun, Morning',
      postedTime: '2d ago',
      tags: ['Cafe', 'Weekend'],
      logoPlaceholder: '☕'
    }
  },
  {
    id: 'app-2',
    status: 'viewed',
    appliedDate: 'Oct 15',
    responseEstimate: 'Usually responds in 4h',
    job: {
      id: 'job-102',
      title: 'Inventory Assistant',
      businessName: 'Reliance Smart',
      description: 'Help organize the backroom inventory on a flexible schedule.',
      payout: 8000,
      payoutType: 'month',
      isUrgent: false,
      isPremium: false,
      location: 'HSR Layout',
      distance: '3.5km',
      timing: 'Flexible',
      postedTime: '5h ago',
      tags: ['Retail', 'Flexible'],
      logoPlaceholder: '📦'
    }
  },
  {
    id: 'app-3',
    status: 'applied',
    appliedDate: 'Today',
    responseEstimate: 'Usually responds in 2h',
    job: {
      id: 'job-103',
      title: 'Event Registration Staff',
      businessName: 'Sunburn Arena',
      description: 'Manage VIP registrations for the upcoming music festival.',
      payout: 1200,
      payoutType: 'task',
      isUrgent: true,
      isPremium: true,
      location: 'Bhartiya City',
      distance: '12km',
      timing: 'Nov 5th, 4 PM',
      postedTime: '1h ago',
      tags: ['Events', 'Urgent'],
      logoPlaceholder: '🎟️'
    }
  },
  {
    id: 'app-4',
    status: 'rejected',
    appliedDate: 'Oct 01',
    responseEstimate: 'Closed',
    job: {
      id: 'job-104',
      title: 'Delivery Partner',
      businessName: 'Zepto',
      description: 'Deliver groceries in under 10 minutes.',
      payout: 15000,
      payoutType: 'month',
      isUrgent: false,
      isPremium: false,
      location: 'Indiranagar',
      distance: '4km',
      timing: 'Full-time',
      postedTime: '1w ago',
      tags: ['Delivery'],
      logoPlaceholder: '🛵'
    }
  }
]

export const JobsPage = () => {
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all')
  const { user } = useAuth()
  const { applications, fetchStudentApplications } = useApplications()

  useEffect(() => {
    if (user?.id) {
      fetchStudentApplications(user.id)
    }
  }, [user?.id, fetchStudentApplications])

  const displayApps = useMemo(() => {
    const dbApps: TrackedApplication[] = (applications || []).map((app: any) => {
      const jobInfo = app.job || {}
      return {
        id: app.id,
        status: app.status as ApplicationStatus,
        appliedDate: app.applied_date || new Date(app.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        responseEstimate: app.response_estimate || 'Pending review',
        job: {
          id: jobInfo.id || app.job_id,
          title: jobInfo.title || 'General Gig',
          businessName: jobInfo.business_name || 'HustiQ Employer',
          description: jobInfo.description || '',
          payout: jobInfo.payout || 0,
          payoutType: jobInfo.payout_type || 'hr',
          isUrgent: jobInfo.is_urgent || false,
          isPremium: jobInfo.is_premium || false,
          location: jobInfo.location || '',
          distance: jobInfo.distance || '1.5km',
          timing: jobInfo.timing || '',
          postedTime: jobInfo.posted_time || '',
          tags: jobInfo.tags || [],
          logoPlaceholder: jobInfo.logo_placeholder || '💼'
        }
      }
    })

    // Combine with MOCK_APPLICATIONS for demo completeness, checking matching job IDs
    const combined = [...dbApps, ...MOCK_APPLICATIONS.filter(ma => !dbApps.some(da => da.job.id === ma.job.id))]
    return combined
  }, [applications])

  const filteredApps = activeTab === 'all' 
    ? displayApps 
    : displayApps.filter(app => app.status === activeTab)

  return (
    <div className="flex flex-col h-full w-full pb-20 md:pb-0">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-2 sm:px-0">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">My Applications</h1>
        <p className="text-muted-foreground font-medium">Track your opportunities and manage your pipeline.</p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 mb-6 border-b border-border/40 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className="absolute inset-0 bg-muted/80 rounded-full border border-border/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Applications List */}
      <div className="flex flex-col gap-4 px-2 sm:px-0 max-w-4xl">
        <AnimatePresence mode="popLayout">
          {filteredApps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-20 text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground border border-border/50">
                <span className="text-2xl opacity-50">📋</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">No applications here</h3>
              <p className="text-muted-foreground text-sm">When you apply for a job, it will appear in this pipeline.</p>
            </motion.div>
          ) : (
            filteredApps.map((app, index) => (
              <ApplicationCard 
                key={app.id} 
                job={app.job}
                status={app.status}
                appliedDate={app.appliedDate}
                responseEstimate={app.responseEstimate}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
