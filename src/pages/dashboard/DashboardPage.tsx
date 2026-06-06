import { useMemo, useEffect, useState } from 'react'
import { Search, Bell, AlertTriangle } from 'lucide-react'
import { JobCard, type Job } from '@/components/dashboard/JobCard'
import { HorizontalFeed } from '@/components/dashboard/HorizontalFeed'
import { MasonryFeed } from '@/components/dashboard/MasonryFeed'
import { SectionHeader } from '@/components/dashboard/SectionHeader'
import { NearbyMap } from '@/components/dashboard/NearbyMap'
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown'
import { useNotifications } from '@/store/useNotifications'
import { useAppliedJobs } from '@/store/useAppliedJobs'
import { FirstTimeGuidance } from '@/components/shared/FirstTimeGuidance'
import { useJobs } from '@/store/useJobs'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'
import { BrowserSettingsGuideModal } from '@/components/shared/BrowserSettingsGuideModal'


const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Weekend Barista Needed',
    businessName: 'Third Wave Coffee',
    description: 'Looking for an energetic barista to handle the weekend morning rush. You will be responsible for brewing coffee, managing the cash register, and maintaining a clean workspace.',
    payout: 500,
    payoutType: 'hr',
    isUrgent: true,
    isPremium: true,
    isVerified: true,
    location: 'Bandra West',
    distance: '1.2 km away',
    timing: 'Sat-Sun, 8 AM - 2 PM',
    postedTime: 'Posted 2 hours ago',
    tags: ['Cafe', 'No Experience Needed'],
    logoPlaceholder: '☕',
    isNearby: true
  },
  {
    id: '2',
    title: 'Event Registration Staff',
    businessName: 'Sunburn Festival',
    description: 'Join our energetic team to manage the main gates, scan QR tickets, and distribute wristbands to thousands of excited festival attendees.',
    payout: 2500,
    payoutType: 'shift',
    isUrgent: false,
    isPremium: true,
    isVerified: true,
    location: 'Jio World Centre',
    distance: '4.5 km away',
    timing: 'Dec 15, 10 AM - 8 PM',
    postedTime: 'Posted 5 hours ago',
    tags: ['Events', 'High Paying'],
    logoPlaceholder: '🎪'
  },
  {
    id: '3',
    title: 'Inventory Assistant',
    businessName: 'Reliance Smart',
    description: 'Help us restock shelves, organize the backroom, and assist customers during peak evening hours. Reliable candidates preferred.',
    payout: 350,
    payoutType: 'hr',
    isUrgent: true,
    isPremium: false,
    location: 'Andheri East',
    distance: '2.0 km away',
    timing: 'Mon-Fri, 5 PM - 9 PM',
    postedTime: 'Posted 1 day ago',
    tags: ['Retail', 'Evening Shift'],
    logoPlaceholder: '🛒',
    isNearby: true
  },
  {
    id: '4',
    title: 'Social Media Manager',
    businessName: 'Local Agency',
    description: 'Create engaging reels, design simple graphics, and manage DMs for two of our biggest local cafe clients. Work completely from home.',
    payout: 5000,
    payoutType: 'task',
    isUrgent: false,
    isPremium: false,
    location: 'Remote',
    distance: 'Online',
    timing: 'Flexible',
    postedTime: 'Posted 3 days ago',
    tags: ['Online Work', 'Creative'],
    logoPlaceholder: '📱'
  },
  {
    id: '5',
    title: 'Delivery Executive',
    businessName: 'Swiggy Instamart',
    description: 'Fast-paced grocery delivery within a 3km radius. Guaranteed daily payouts and high volume incentives available. Must have a valid two-wheeler license.',
    payout: 1200,
    payoutType: 'shift',
    isUrgent: true,
    isPremium: true,
    isVerified: true,
    location: 'Powai',
    distance: '3.1 km away',
    timing: 'Flexible Shifts',
    postedTime: 'Posted 1 hour ago',
    tags: ['Delivery', 'Bike Required'],
    logoPlaceholder: '🛵',
    isNearby: true
  },
  {
    id: '6',
    title: 'Brand Ambassador',
    businessName: 'Red Bull India',
    description: 'Represent our brand on campus and at local events.',
    payout: 800,
    payoutType: 'hr',
    isUrgent: false,
    isPremium: true,
    isVerified: true,
    location: 'Multiple Locations',
    distance: 'Flexible',
    timing: 'Weekends',
    postedTime: 'Posted 2 days ago',
    tags: ['Events', 'Student Friendly'],
    logoPlaceholder: '🐂'
  }
]

export const DashboardPage = () => {
  const { toggleOpen, notifications, loadNotifications } = useNotifications()
  const { user } = useAuth()
  const { jobs, fetchJobs } = useJobs()
  const isApplied = useAppliedJobs((state) => state.isApplied)

  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const updatePermission = () => {
      setPermissionState(Notification.permission)
    }

    updatePermission()

    window.addEventListener('focus', updatePermission)
    document.addEventListener('visibilitychange', updatePermission)
    const interval = setInterval(updatePermission, 2000)

    let permissionStatus: PermissionStatus | null = null
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        permissionStatus = status
        status.onchange = updatePermission
      }).catch(() => {})
    }

    return () => {
      window.removeEventListener('focus', updatePermission)
      document.removeEventListener('visibilitychange', updatePermission)
      clearInterval(interval)
      if (permissionStatus) {
        permissionStatus.onchange = null
      }
    }
  }, [])

  const handleSendDirectFCMTest = async () => {
    try {
      const { getCurrentFCMToken } = await import('@/services/firebase/fcm')
      const token = await getCurrentFCMToken()
      
      console.log("Current Token:", token)
      
      if (!token) {
        useUiStore.getState().addToast('No FCM token generated. Make sure notifications are allowed.', 'error')
        return
      }

      console.log("Sending Notification...")
      useUiStore.getState().addToast('Sending Direct Token Push...', 'info')

      const response = await fetch('/api/send-to-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          title: 'HustiQ Test',
          body: 'Notification system is working successfully.'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log("Notification Sent:", data.response)
        useUiStore.getState().addToast('Push delivered successfully!', 'success')
      } else {
        console.error("Notification Failed:", data.error)
        useUiStore.getState().addToast(data.error || 'Push delivery failed.', 'error')
      }
    } catch (err: any) {
      console.error("Notification Failed:", err)
      useUiStore.getState().addToast(err.message || 'Direct Push Delivery Failed.', 'error')
    }
  }

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

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id, user.role)
    }
  }, [user?.id, user?.role, loadNotifications])

  const hasUnread = notifications.some(n => n.isUnread)

  // Memoize heavy array derivations to prevent re-renders when toggleOpen or other states change
  const { 
    urgentJobs, 
    nearbyJobs, 
    cafeJobs, 
    featuredJob, 
    quickPicks, 
    discoveryJobs 
  } = useMemo(() => {
    // Helper to sort applied jobs to the end
    const sortByApplied = (jobs: Job[]) => [...jobs].sort((a, b) => {
      const aApplied = isApplied(a.id) ? 1 : 0
      const bApplied = isApplied(b.id) ? 1 : 0
      return aApplied - bApplied
    })

    const dbJobs: Job[] = jobs.map((dbJob: any) => ({
      id: dbJob.id,
      title: dbJob.title,
      businessName: dbJob.business_name,
      description: dbJob.description || '',
      payout: dbJob.payout,
      payoutType: dbJob.payout_type,
      isUrgent: dbJob.is_urgent || false,
      isPremium: dbJob.is_premium || false,
      isVerified: dbJob.is_verified || false,
      location: dbJob.location || 'Local Area',
      distance: dbJob.distance || '1.5 km away',
      timing: dbJob.timing || 'Flexible Shifts',
      postedTime: dbJob.posted_time || 'Posted recently',
      tags: dbJob.tags || [],
      logoPlaceholder: dbJob.logo_placeholder || '💼',
      isNearby: dbJob.is_urgent || false
    }))

    const combinedJobs = [...dbJobs, ...MOCK_JOBS.filter(mj => !dbJobs.some(dj => dj.id === mj.id))]
    const featured = combinedJobs.find(j => j.id === '2') || combinedJobs[0]

    return {
      urgentJobs: sortByApplied(combinedJobs.filter(j => j.isUrgent)).slice(0, 6),
      nearbyJobs: sortByApplied(combinedJobs.filter(j => j.isNearby || j.location.includes('Bandra') || j.location.includes('Andheri'))).slice(0, 6),
      cafeJobs: sortByApplied(combinedJobs.filter(j => j.tags.includes('Cafe') || j.title.toLowerCase().includes('barista') || j.title.toLowerCase().includes('cafe'))),
      featuredJob: featured,
      quickPicks: sortByApplied(combinedJobs.filter(j => j.id !== featured.id).slice(0, 4)),
      discoveryJobs: sortByApplied(combinedJobs.filter(j => !j.isUrgent && j.id !== featured.id)).slice(0, 6)
    }
  }, [isApplied, jobs])

  return (
    <div className="flex flex-col h-full space-y-10 w-full pb-20 md:pb-0">
      
      {/* Feed Top Navigation */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-4 px-2 -mx-2 sm:px-0 sm:mx-0">
        <div className="flex items-center justify-between gap-4 max-w-3xl relative">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search gigs, cafes, events..." 
              className="w-full bg-muted/50 border border-border/50 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center shrink-0 pl-4 relative">
            <button 
              id="notification-bell-btn"
              onClick={toggleOpen}
              className="relative p-3 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all rounded-full border border-border/40 hover:border-border hover:shadow-sm"
            >
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
              )}
            </button>
            <NotificationDropdown />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-16">
        {/* Browser Settings Guide Modal */}
        <BrowserSettingsGuideModal 
          isOpen={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)} 
        />

        {/* Denied Permission Alert Banner */}
        {permissionState === 'denied' && (
          <div 
            onClick={() => setIsGuideOpen(true)}
            className="glass-card p-5 rounded-3xl border border-rose-500/25 bg-rose-500/[0.01] shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-3xl text-left cursor-pointer hover:bg-rose-500/[0.03] transition-all relative overflow-hidden group animate-fade-in"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] bg-rose-500/10 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-4 min-w-0 z-10">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full inline-block mb-2 border border-rose-500/20">
                  Permission Blocked
                </span>
                <h4 className="text-base font-black text-foreground tracking-tight">Notifications are currently blocked in your browser.</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Click here to enable notifications and receive real-time gig updates and messages.
                </p>
              </div>
            </div>
            <button 
              className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white py-2.5 px-5 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm z-10 border border-rose-600"
            >
              Enable Notifications
            </button>
          </div>
        )}

        {/* Temporary FCM Direct Test Banner (DEV MODE ONLY) */}
        {import.meta.env.DEV && (
          <div className="glass-card p-5 rounded-3xl border border-primary/20 bg-primary/[0.01] shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-3xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] bg-primary/10 pointer-events-none" />
            <div className="flex-1 min-w-0 z-10">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full inline-block mb-2 border border-primary/20">
                FCM Test Suite
              </span>
              <h4 className="text-base font-black text-foreground tracking-tight">Direct Token Push Verification</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Verify FCM notifications end-to-end by fetching your device token and calling the backend test router.
              </p>
            </div>
            <button 
              onClick={handleSendDirectFCMTest}
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-5 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm z-10 border border-primary/25"
            >
              <span>Send Test Notification</span>
            </button>
          </div>
        )}

        {!tourState.dismissed && tourState.progress < 100 && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden text-left">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm inline-block mb-2">
                HustiQ Onboarding
              </span>
              <h4 className="text-lg font-black text-foreground">Complete Your Setup</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Complete all items on the setup checklist to earn a +100 XP boost and unlock premium local gig matching!
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
        
        {/* 1. URGENT HIRING (Horizontal Sweep) */}
        {urgentJobs.length > 0 && (
          <section>
            <SectionHeader title="Urgent Hiring 🔥" subtitle="High payout gigs starting today." />
            <HorizontalFeed>
              {urgentJobs.map(job => (
                <JobCard key={job.id} job={job} variant="urgent" />
              ))}
              {urgentJobs.map(job => (
                <JobCard key={job.id + 'dup'} job={job} variant="urgent" />
              ))}
            </HorizontalFeed>
          </section>
        )}

        {/* 2. NEARBY RIGHT NOW (Horizontal Sweep) */}
        {nearbyJobs.length > 0 && (
          <section className="relative">
            {/* Subtle Map-inspired ambient background for this section */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent -mx-4 sm:-mx-8 pointer-events-none rounded-3xl" />
            <SectionHeader title="Nearby Right Now 📍" subtitle="Gigs happening within 3km of you." />
            <HorizontalFeed>
              {nearbyJobs.map(job => (
                <JobCard key={job.id} job={job} variant="default" className="w-[280px] min-[360px]:w-[340px] sm:w-[460px] shrink-0 snap-center sm:snap-align-none" />
              ))}
              {nearbyJobs.map(job => (
                <JobCard key={job.id + 'dup'} job={job} variant="default" className="w-[280px] min-[360px]:w-[340px] sm:w-[460px] shrink-0 snap-center sm:snap-align-none" />
              ))}
            </HorizontalFeed>
            
            <div id="nearby-map-container" className="mt-8 relative z-10">
              <NearbyMap jobs={nearbyJobs} />
            </div>
          </section>
        )}

        {/* 3. THE HERO SPLIT (Featured + Compact List) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col h-full">
            <SectionHeader title="Featured Opportunity" />
            <div className="mt-2 flex-1">
              <JobCard job={featuredJob} variant="featured" />
            </div>
          </div>
          
          <div className="flex flex-col h-full mt-8 lg:mt-0">
            <SectionHeader title="Quick Picks" subtitle="Based on your profile" />
            <div id="quick-picks-container" className="mt-2 flex flex-col gap-2 bg-muted/10 p-4 rounded-[2rem] border border-border/40 h-full">
              {quickPicks.map(job => (
                <JobCard key={job.id} job={job} variant="compact" />
              ))}
            </div>
          </div>
        </section>

        {/* 3. CATEGORY PREVIEW: CAFE & HOSPITALITY */}
        {cafeJobs.length > 0 && (
          <section>
            <SectionHeader title="Cafe & Hospitality ☕" subtitle="Local spots looking for fresh energy." />
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <JobCard job={cafeJobs[0]} variant="default" />
              </div>
              <div className="flex flex-col gap-2 bg-muted/10 p-4 rounded-[2rem] border border-border/40">
                {MOCK_JOBS.filter(j => j.id !== cafeJobs[0].id).slice(0, 3).map(job => (
                  <JobCard key={job.id + 'compact'} job={job} variant="compact" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. GENERAL DISCOVERY (Masonry) */}
        <section>
          <SectionHeader title="More For You 🎯" subtitle="Explore organic opportunities." />
          <MasonryFeed>
            {discoveryJobs.map(job => (
              <JobCard key={job.id} job={job} variant="default" />
            ))}
            {urgentJobs.map(job => (
              <JobCard key={job.id + 'mixed'} job={job} variant="default" />
            ))}
            {discoveryJobs.map(job => (
              <JobCard key={job.id + 'dup'} job={job} variant="default" />
            ))}
            {/* Inject a featured card into the masonry for extreme organic rhythm! */}
            <div className="break-inside-avoid mb-6 hidden xl:block">
              <JobCard job={featuredJob} variant="featured" />
            </div>
          </MasonryFeed>
        </section>

      </div>

      <FirstTimeGuidance />
    </div>
  )
}
