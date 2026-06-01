import { useState, type MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target,
  MapPin, 
  Clock, 
  X, 
  GraduationCap, 
  Calendar, 
  Flame, 
  Bookmark,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '@/store/useAuth'
import { useRecommendations } from '@/store/useRecommendations'
import { useJobDetails } from '@/store/useJobDetails'
import { useQuickApply } from '@/store/useQuickApply'
import { useSavedJobs } from '@/store/useSavedJobs'
import { cn } from '@/lib/utils'

export const RecommendationsPage = () => {
  const { user } = useAuth()
  const activeRole = user?.role || 'student'
  const isProvider = activeRole === 'provider'

  const { 
    recommendedForYouJobs,
    nearCollegeJobs,
    basedOnActivityJobs,
    trendingJobs,
    recommendedCandidates,
    reliableNearbyCandidates,
    fastResponderCandidates,
    matchingAvailabilityCandidates,
    dismissJob,
    dismissCandidate,
    inviteCandidate
  } = useRecommendations()

  const { open: openDetails } = useJobDetails()
  const { open: openQuickApply } = useQuickApply()
  const { saveJob, isSaved, unsaveJob } = useSavedJobs()

  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({})

  // Apply Simulation
  const handleQuickApply = (e: MouseEvent, job: any) => {
    e.stopPropagation()
    openQuickApply(job)
    setAppliedJobs(prev => ({ ...prev, [job.id]: true }))
  }

  // Save Simulation
  const handleSaveToggle = (e: MouseEvent, job: any) => {
    e.stopPropagation()
    if (isSaved(job.id)) {
      unsaveJob(job.id)
    } else {
      saveJob(job)
    }
  }

  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 28 } }
  } as const

  return (
    <div className="flex flex-col h-full w-full gap-8 pb-16 md:pb-6 text-left">
      
      {/* AI Discovery Header Banner */}
      <div className="relative rounded-[2rem] p-6 sm:p-8 border border-primary/25 bg-gradient-to-r from-primary/[0.08] to-purple-500/[0.04] overflow-hidden shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Glowing Neural Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[80px] bg-purple-500/10 pointer-events-none animate-pulse" />

        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-max">
            <Target className="w-3.5 h-3.5" />
            <span>Smart Recommendations Active</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">
            {isProvider ? 'Intelligent Talent Sourcing' : 'AI-Powered Shift Discovery'}
          </h1>
          <p className="text-muted-foreground text-sm font-semibold leading-relaxed">
            {isProvider 
              ? 'Our semantic model parses student credentials, proximity metrics, and scheduling to recommend premier candidates.' 
              : 'Our matching algorithm analyzes your skills, college proximity, and shift preferences to curate high-fit gigs.'
            }
          </p>
        </div>

        <div className="shrink-0 relative z-10 p-4 bg-card border border-border/40 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <Target className="w-5.5 h-5.5 animate-spin duration-3000" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Match Engine</div>
            <div className="text-sm font-black text-foreground">Semantic Core v3.2</div>
          </div>
        </div>
      </div>

      {/* Primary Discovery Lists */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10 w-full"
      >
        
        {/* STUDENT RECOMMENDATIONS SPACE */}
        {!isProvider ? (
          <>
            {/* Section 1: Recommended For You */}
            {recommendedForYouJobs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Target className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Recommended For You</h2>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {recommendedForYouJobs.map(({ job, whyRecommended, confidenceScore, badgeText }) => (
                      <motion.div 
                        key={job.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        onClick={() => openDetails(job)}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-pointer transition-all duration-300 relative flex flex-col justify-between min-h-[340px]"
                      >
                        {/* Header confidence */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-primary/8 border border-primary/15 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {badgeText || `${confidenceScore}% Match`}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); dismissJob(job.id, 'foryou') }}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Job basic metadata */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2.5xl select-none">{job.logoPlaceholder || '☕'}</span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {job.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate font-medium">{job.businessName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold flex-wrap">
                            <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {job.location}</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {job.timing}</span>
                          </div>
                        </div>

                        {/* AI why heuristic bubble */}
                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-primary/5 blur-sm pointer-events-none" />
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Why recommended</div>
                          <span>{whyRecommended}</span>
                        </div>

                        {/* Payout & buttons */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/25 mt-2">
                          <div className="flex items-baseline gap-0.5 shrink-0">
                            <span className="text-xs text-primary font-extrabold">₹</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">{job.payout}</span>
                            <span className="text-[10px] text-muted-foreground">/{job.payoutType}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={(e) => handleSaveToggle(e, job)}
                              className="w-9 h-9 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                            >
                              <Bookmark className={cn("w-4 h-4", isSaved(job.id) && "fill-primary text-primary stroke-primary")} />
                            </button>
                            
                            <button 
                              onClick={(e) => handleQuickApply(e, job)}
                              className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                            >
                              {appliedJobs[job.id] ? '✓ Applied' : 'Quick Apply'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Section 2: Near Your College */}
            {nearCollegeJobs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <GraduationCap className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Near Your College</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {nearCollegeJobs.map(({ job, whyRecommended, confidenceScore, badgeText }) => (
                      <motion.div 
                        key={job.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        onClick={() => openDetails(job)}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-pointer transition-all duration-300 relative flex flex-col justify-between min-h-[340px]"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-emerald-500/8 border border-emerald-500/15 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            {badgeText || `${confidenceScore}% Match`}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); dismissJob(job.id, 'college') }}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2.5xl select-none">{job.logoPlaceholder || '🛵'}</span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {job.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate font-medium">{job.businessName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold flex-wrap">
                            <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {job.location}</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {job.timing}</span>
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">College alignment</div>
                          <span>{whyRecommended}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border/25 mt-2">
                          <div className="flex items-baseline gap-0.5 shrink-0">
                            <span className="text-xs text-primary font-extrabold">₹</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">{job.payout}</span>
                            <span className="text-[10px] text-muted-foreground">/{job.payoutType}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={(e) => handleSaveToggle(e, job)}
                              className="w-9 h-9 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                            >
                              <Bookmark className={cn("w-4 h-4", isSaved(job.id) && "fill-primary text-primary stroke-primary")} />
                            </button>
                            
                            <button 
                              onClick={(e) => handleQuickApply(e, job)}
                              className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                            >
                              {appliedJobs[job.id] ? '✓ Applied' : 'Quick Apply'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Section 3: Based On Your Activity */}
            {basedOnActivityJobs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Based On Your Activity</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {basedOnActivityJobs.map(({ job, whyRecommended, confidenceScore, badgeText }) => (
                      <motion.div 
                        key={job.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        onClick={() => openDetails(job)}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-pointer transition-all duration-300 relative flex flex-col justify-between min-h-[340px]"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-purple-500/8 border border-purple-500/15 text-purple-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            {badgeText || `${confidenceScore}% Match`}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); dismissJob(job.id, 'activity') }}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2.5xl select-none">{job.logoPlaceholder || '💼'}</span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {job.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate font-medium">{job.businessName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold flex-wrap">
                            <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {job.location}</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {job.timing}</span>
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Behavioral heuristic</div>
                          <span>{whyRecommended}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border/25 mt-2">
                          <div className="flex items-baseline gap-0.5 shrink-0">
                            <span className="text-xs text-primary font-extrabold">₹</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">{job.payout}</span>
                            <span className="text-[10px] text-muted-foreground">/{job.payoutType}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={(e) => handleSaveToggle(e, job)}
                              className="w-9 h-9 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                            >
                              <Bookmark className={cn("w-4 h-4", isSaved(job.id) && "fill-primary text-primary stroke-primary")} />
                            </button>
                            
                            <button 
                              onClick={(e) => handleQuickApply(e, job)}
                              className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                            >
                              {appliedJobs[job.id] ? '✓ Applied' : 'Quick Apply'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Section 4: Trending Nearby */}
            {trendingJobs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Flame className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Trending Nearby</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {trendingJobs.map(({ job, whyRecommended, confidenceScore, badgeText }) => (
                      <motion.div 
                        key={job.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        onClick={() => openDetails(job)}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-pointer transition-all duration-300 relative flex flex-col justify-between min-h-[340px]"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-amber-500/8 border border-amber-500/15 text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {badgeText || `${confidenceScore}% Match`}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); dismissJob(job.id, 'trending') }}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2.5xl select-none">{job.logoPlaceholder || '🛒'}</span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {job.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate font-medium">{job.businessName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold flex-wrap">
                            <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {job.location}</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {job.timing}</span>
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Market demand</div>
                          <span>{whyRecommended}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border/25 mt-2">
                          <div className="flex items-baseline gap-0.5 shrink-0">
                            <span className="text-xs text-primary font-extrabold">₹</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">{job.payout}</span>
                            <span className="text-[10px] text-muted-foreground">/{job.payoutType}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={(e) => handleSaveToggle(e, job)}
                              className="w-9 h-9 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                            >
                              <Bookmark className={cn("w-4 h-4", isSaved(job.id) && "fill-primary text-primary stroke-primary")} />
                            </button>
                            
                            <button 
                              onClick={(e) => handleQuickApply(e, job)}
                              className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                            >
                              {appliedJobs[job.id] ? '✓ Applied' : 'Quick Apply'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {/* PROVIDER HIRING DISCOVERY SPACE */}
            
            {/* Section 1: Recommended Candidates */}
            {recommendedCandidates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Target className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Recommended Candidates</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {recommendedCandidates.map((candidate) => (
                      <motion.div 
                        key={candidate.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-default transition-all duration-300 relative flex flex-col justify-between min-h-[350px] text-left"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-primary/8 border border-primary/15 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {candidate.badgeText || `${candidate.matchScore}% Match`}
                          </span>
                          <button 
                            onClick={() => dismissCandidate(candidate.id, 'candidates')}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl select-none w-12 h-12 bg-muted/60 border border-border/50 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                              {candidate.avatar}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {candidate.name}
                              </h3>
                              <p className="text-[10px] text-muted-foreground truncate font-extrabold uppercase tracking-wider mt-0.5">{candidate.availability}</p>
                            </div>
                          </div>

                          {/* Skill Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="bg-muted/50 border border-border/40 text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* AI why heuristic bubble */}
                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Semantic reasoning</div>
                          <span>{candidate.whyRecommended}</span>
                        </div>

                        {/* Candidate specs & Actions */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-border/25 mt-2">
                          <div className="flex flex-col text-left gap-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Attendance</span>
                            <span className="text-xs font-black text-emerald-500 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 inline text-emerald-500 shrink-0" />
                              {candidate.attendanceRate}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => inviteCandidate(candidate.id)}
                              className={cn(
                                "text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1",
                                candidate.isInvited 
                                  ? "bg-primary/10 text-primary border border-primary/20" 
                                  : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {candidate.isInvited ? '✓ Invited' : 'Invite'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Section 2: Reliable Nearby Students */}
            {reliableNearbyCandidates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Reliable Nearby Students</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {reliableNearbyCandidates.map((candidate) => (
                      <motion.div 
                        key={candidate.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-default transition-all duration-300 relative flex flex-col justify-between min-h-[350px] text-left"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-emerald-500/8 border border-emerald-500/15 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            {candidate.badgeText}
                          </span>
                          <button 
                            onClick={() => dismissCandidate(candidate.id, 'nearby')}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl select-none w-12 h-12 bg-muted/60 border border-border/50 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                              {candidate.avatar}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {candidate.name}
                              </h3>
                              <p className="text-[10px] text-muted-foreground truncate font-extrabold uppercase tracking-wider mt-0.5">{candidate.availability}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="bg-muted/50 border border-border/40 text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Reliability reasoning</div>
                          <span>{candidate.whyRecommended}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-border/25 mt-2">
                          <div className="flex flex-col text-left gap-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Proximity</span>
                            <span className="text-xs font-black text-emerald-500 flex items-center gap-0.5">
                              {candidate.distance}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => inviteCandidate(candidate.id)}
                              className={cn(
                                "text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1",
                                candidate.isInvited 
                                  ? "bg-primary/10 text-primary border border-primary/20" 
                                  : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {candidate.isInvited ? '✓ Invited' : 'Invite'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Section 3: Fast Responders */}
            {fastResponderCandidates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Clock className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Fast Responders</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {fastResponderCandidates.map((candidate) => (
                      <motion.div 
                        key={candidate.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-default transition-all duration-300 relative flex flex-col justify-between min-h-[350px] text-left"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-purple-500/8 border border-purple-500/15 text-purple-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            {candidate.badgeText}
                          </span>
                          <button 
                            onClick={() => dismissCandidate(candidate.id, 'responders')}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl select-none w-12 h-12 bg-muted/60 border border-border/50 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                              {candidate.avatar}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {candidate.name}
                              </h3>
                              <p className="text-[10px] text-muted-foreground truncate font-extrabold uppercase tracking-wider mt-0.5">{candidate.availability}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="bg-muted/50 border border-border/40 text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Communication speed</div>
                          <span>{candidate.whyRecommended}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-border/25 mt-2">
                          <div className="flex flex-col text-left gap-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Response Metric</span>
                            <span className="text-xs font-black text-emerald-500 flex items-center gap-0.5">
                              {candidate.responseSpeed}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => inviteCandidate(candidate.id)}
                              className={cn(
                                "text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1",
                                candidate.isInvited 
                                  ? "bg-primary/10 text-primary border border-primary/20" 
                                  : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {candidate.isInvited ? '✓ Invited' : 'Invite'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Section 4: Matching Availability */}
            {matchingAvailabilityCandidates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground">Matching Availability</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-smooth -mx-2 px-2">
                  <AnimatePresence mode="popLayout">
                    {matchingAvailabilityCandidates.map((candidate) => (
                      <motion.div 
                        key={candidate.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.9, x: -50, transition: { duration: 0.25 } }}
                        className="group w-[300px] sm:w-[360px] shrink-0 bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg hover:border-primary/20 cursor-default transition-all duration-300 relative flex flex-col justify-between min-h-[350px] text-left"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-amber-500/8 border border-amber-500/15 text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {candidate.badgeText}
                          </span>
                          <button 
                            onClick={() => dismissCandidate(candidate.id, 'availability')}
                            className="w-7 h-7 rounded-full border border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl select-none w-12 h-12 bg-muted/60 border border-border/50 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                              {candidate.avatar}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {candidate.name}
                              </h3>
                              <p className="text-[10px] text-muted-foreground truncate font-extrabold uppercase tracking-wider mt-0.5">{candidate.availability}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="bg-muted/50 border border-border/40 text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed my-3 relative overflow-hidden text-left">
                          <div className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-0.5">Schedule overlap</div>
                          <span>{candidate.whyRecommended}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-border/25 mt-2">
                          <div className="flex flex-col text-left gap-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Schedule Match</span>
                            <span className="text-xs font-black text-emerald-500 flex items-center gap-0.5">
                              Precise Overlap
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => inviteCandidate(candidate.id)}
                              className={cn(
                                "text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1",
                                candidate.isInvited 
                                  ? "bg-primary/10 text-primary border border-primary/20" 
                                  : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {candidate.isInvited ? '✓ Invited' : 'Invite'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </>
        )}

      </motion.div>

    </div>
  )
}
