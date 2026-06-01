import { useMemo } from 'react'
import { Search, Bell } from 'lucide-react'
import { JobCard, type Job } from '@/components/dashboard/JobCard'
import { HorizontalFeed } from '@/components/dashboard/HorizontalFeed'
import { MasonryFeed } from '@/components/dashboard/MasonryFeed'
import { SectionHeader } from '@/components/dashboard/SectionHeader'
import { NearbyMap } from '@/components/dashboard/NearbyMap'
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown'
import { useNotifications } from '@/store/useNotifications'
import { useAppliedJobs } from '@/store/useAppliedJobs'
import { FirstTimeGuidance } from '@/components/shared/FirstTimeGuidance'

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
  const { toggleOpen, notifications } = useNotifications()
  const hasUnread = notifications.some(n => n.isUnread)
  const isApplied = useAppliedJobs((state) => state.isApplied)

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

    const featured = MOCK_JOBS.find(j => j.id === '2') || MOCK_JOBS[0]

    return {
      urgentJobs: sortByApplied(MOCK_JOBS.filter(j => j.isUrgent)).slice(0, 6),
      nearbyJobs: sortByApplied(MOCK_JOBS.filter(j => j.isNearby)).slice(0, 6),
      cafeJobs: sortByApplied(MOCK_JOBS.filter(j => j.tags.includes('Cafe'))),
      featuredJob: featured,
      quickPicks: sortByApplied(MOCK_JOBS.filter(j => j.id !== featured.id).slice(0, 4)),
      discoveryJobs: sortByApplied(MOCK_JOBS.filter(j => !j.isUrgent && j.id !== featured.id)).slice(0, 6)
    }
  }, [isApplied])

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
            <SectionHeader title="Featured Opportunity ✨" />
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
