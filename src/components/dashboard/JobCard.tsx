import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, IndianRupee, Zap, ShieldCheck, ArrowUpRight, Navigation, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useJobDetails } from '@/store/useJobDetails'
import { useQuickApply } from '@/store/useQuickApply'
import { useAppliedJobs } from '@/store/useAppliedJobs'
import { useSavedJobs } from '@/store/useSavedJobs'
import { VerifiedEmployerBadge, SafePayoutIndicator } from '@/components/trust/TrustSystem'

export interface Job {
  id: string
  title: string
  businessName: string
  description: string
  payout: number
  payoutType: 'hr' | 'shift' | 'task' | 'month'
  isUrgent: boolean
  isPremium: boolean
  isNearby?: boolean
  isVerified?: boolean
  location: string
  distance: string
  timing: string
  postedTime: string
  tags: string[]
  logoPlaceholder: string
}

interface JobCardProps {
  job: Job
  variant?: 'default' | 'urgent' | 'featured' | 'compact'
  className?: string
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
} as const

export const JobCard = memo(({ job, variant = 'default', className }: JobCardProps) => {
  const { open: openDetails } = useJobDetails()
  const { open: openQuickApply } = useQuickApply()
  const isApplied = useAppliedJobs((state) => state.isApplied(job.id))
  const { isSaved, saveJob, unsaveJob } = useSavedJobs()
  const saved = isSaved(job.id)

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    saved ? unsaveJob(job.id) : saveJob(job)
  }
  
  // --------------------------------------------------------
  // VARIANT: COMPACT (Dense List Item)
  // --------------------------------------------------------
  if (variant === 'compact') {
    return (
      <motion.div 
        variants={itemVariants}
        whileHover={!isApplied ? { x: 4 } : {}}
        onClick={() => openDetails(job)}
        className={cn(
          "group relative flex items-center justify-between p-4 bg-background/50 hover:bg-card rounded-2xl transition-all duration-200 border border-transparent hover:border-border/50 hover:shadow-sm cursor-pointer",
          isApplied && "opacity-60 grayscale-[10%]"
        )}
      >
        <div className="flex gap-4 items-center overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-xl shrink-0 group-hover:bg-primary/10 transition-colors">
            {job.logoPlaceholder}
          </div>
          <div className="flex flex-col truncate">
            <h3 className="font-semibold text-foreground text-sm truncate">{job.title}</h3>
            <span className="text-xs text-muted-foreground truncate">{job.businessName} • {job.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center text-foreground font-bold">
              <IndianRupee className="w-3 h-3 text-primary" />
              <span>{job.payout}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">/{job.payoutType}</span>
            {job.isVerified && <SafePayoutIndicator className="mt-0.5" />}
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSaveToggle}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
              saved ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-primary")} />
          </motion.button>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    )
  }

  // --------------------------------------------------------
  // VARIANT: FEATURED (Massive Hero Card)
  // --------------------------------------------------------
  if (variant === 'featured') {
    return (
      <motion.div 
        variants={itemVariants}
        whileHover={!isApplied ? { y: -4, scale: 1.01 } : {}}
        onClick={() => openDetails(job)}
        className={cn(
          "group relative bg-card border border-border/40 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col rounded-[2.5rem] p-8 sm:p-10 h-full min-h-[400px] cursor-pointer",
          isApplied && "opacity-75 grayscale-[15%]"
        )}
      >
        {/* Deep Featured Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5 opacity-50 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-background border border-border flex items-center justify-center text-3xl shadow-sm shrink-0">
              {job.logoPlaceholder}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
            {job.isNearby && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/20">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Nearby Match</span>
              </div>
            )}
            {job.isVerified && <VerifiedEmployerBadge compact />}
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Featured Opportunity</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleSaveToggle}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-md shrink-0",
                saved ? "bg-primary/20 text-primary border border-primary/30" : "bg-background/80 text-muted-foreground border border-border/50 hover:text-foreground"
              )}
            >
              <Bookmark className={cn("w-4 h-4", saved && "fill-primary")} />
            </motion.button>
          </div>
          </div>

          <div className="mt-auto space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground/80">{job.businessName}</h3>
              {job.isPremium && <ShieldCheck className="w-5 h-5 text-blue-500" />}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground leading-[1.1] tracking-tight group-hover:text-primary transition-colors">
              {job.title}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              {job.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-6 border-t border-border/40">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 -mr-1.5 text-primary" />
                <span className="text-5xl font-black text-foreground tracking-tighter">{job.payout}</span>
                <span className="text-base font-semibold text-muted-foreground ml-1 shrink-0">/ {job.payoutType}</span>
              </div>
              {job.isVerified && <SafePayoutIndicator className="mt-2" />}
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isApplied) openQuickApply(job); 
              }}
              disabled={isApplied}
              className={cn(
                "w-full sm:w-auto font-bold px-10 py-4 rounded-xl transition-all text-base",
                isApplied 
                  ? "bg-muted/50 text-muted-foreground cursor-not-allowed" 
                  : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/20 active:scale-95"
              )}
            >
              {isApplied ? "✓ Applied" : "Apply Now"}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // --------------------------------------------------------
  // VARIANT: DEFAULT & URGENT (Masonry & Horizontal Flex)
  // --------------------------------------------------------
  const isUrgentVariant = variant === 'urgent'
  
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={!isApplied ? { y: -4, scale: 1.01 } : {}}
      onClick={() => openDetails(job)}
      className={cn(
        "group relative bg-card border border-border/40 transition-all duration-200 overflow-hidden flex flex-col break-inside-avoid cursor-pointer",
        isApplied ? "opacity-75 grayscale-[15%] shadow-none hover:shadow-sm" : "shadow-sm hover:shadow-xl",
        isUrgentVariant 
          ? "rounded-[2.5rem] p-5 min-[360px]:p-6 sm:p-8 gap-4 sm:gap-6 w-[280px] min-[360px]:w-[340px] sm:w-[460px] shrink-0 snap-center sm:snap-align-none" 
          : "rounded-[2rem] p-5 sm:p-6 gap-5 w-full mb-6",
        className
      )}
    >
      {/* Background Glow (Hardware Accelerated Opacity) */}
      <div className={cn(
        "absolute top-0 right-0 rounded-full pointer-events-none blur-[80px] transition-opacity duration-300 opacity-50 group-hover:opacity-100",
        isUrgentVariant ? "w-72 h-72 bg-destructive/10" : 
        job.isNearby ? "w-72 h-72 bg-emerald-500/10" :
        "w-64 h-64 bg-primary/10"
      )} />

      {/* TOP: Badges & Logo */}
      <div className="relative z-10 flex justify-between items-start gap-4">
        <div className="flex gap-4 items-center">
          <div className={cn(
            "rounded-2xl bg-muted/30 border border-border flex items-center justify-center font-bold text-muted-foreground shadow-sm group-hover:border-primary/30 transition-colors shrink-0",
            isUrgentVariant ? "w-14 h-14 text-2xl" : "w-12 h-12 text-xl"
          )}>
            {job.logoPlaceholder}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[140px]">{job.businessName}</h3>
              {job.isPremium && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-medium">{job.postedTime}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {job.isNearby && (
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
              <Navigation className="w-3 h-3" /> Nearby
            </div>
          )}
          {job.isUrgent && (
            <div className="flex items-center gap-1 bg-destructive/10 text-destructive text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
              <Zap className="w-3 h-3" /> Urgent
            </div>
          )}
          {job.isVerified && <VerifiedEmployerBadge compact />}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleSaveToggle}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
              saved ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={saved ? 'saved' : 'unsaved'}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Bookmark className={cn("w-4 h-4", saved && "fill-primary")} />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* CENTER: Title & Description */}
      <div className="relative z-10 space-y-2 sm:space-y-3">
        <h2 className={cn(
          "font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors",
          isUrgentVariant ? "text-2xl sm:text-3xl" : "text-xl"
        )}>
          {job.title}
        </h2>
        {job.description && (
          <p className={cn(
            "text-muted-foreground/80 leading-relaxed",
            isUrgentVariant ? "text-sm sm:text-base line-clamp-2" : "text-sm line-clamp-4"
          )}>
            {job.description}
          </p>
        )}
      </div>

      {/* METADATA: Tiny details */}
      <div className="relative z-10 flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-border/30 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <MapPin className={cn("w-3.5 h-3.5 shrink-0", job.isNearby && "text-emerald-500")} />
          <span className="truncate max-w-[120px]">{job.location}</span> 
          <span className={cn(
            "font-normal shrink-0",
            job.isNearby ? "text-emerald-500 font-semibold" : "text-muted-foreground/60"
          )}>({job.distance})</span>
          {job.isNearby && (
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[140px]">{job.timing}</span>
        </div>
      </div>

      {/* BOTTOM: Payout & Action */}
      <div className={cn(
        "relative z-10 flex justify-between items-center bg-muted/20 border-t border-border/40",
        isUrgentVariant 
          ? "mt-2 pt-4 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-5 sm:py-6 rounded-b-[2.5rem] flex-col sm:flex-row gap-4" 
          : "mt-2 pt-4 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 sm:py-5 rounded-b-[2rem] gap-2"
      )}>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">Guaranteed</span>
          <div className="flex items-baseline gap-1">
            <IndianRupee className={cn("text-primary", isUrgentVariant ? "w-4 h-4 sm:w-5 sm:h-5 -mr-1.5" : "w-4 h-4 -mr-1.5")} />
            <span className={cn(
              "font-black text-foreground tracking-tighter",
              isUrgentVariant ? "text-4xl" : "text-3xl"
            )}>{job.payout}</span>
            <span className="text-sm font-semibold text-muted-foreground ml-1 shrink-0">/ {job.payoutType}</span>
          </div>
          {job.isVerified && <SafePayoutIndicator className="mt-1" />}
        </div>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!isApplied) openQuickApply(job); 
          }}
          disabled={isApplied}
          className={cn(
            "font-bold rounded-xl transition-all text-sm shrink-0",
            isUrgentVariant ? "w-full sm:w-auto px-8 py-3.5 text-base" : "px-6 py-2.5",
            isApplied 
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed" 
              : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
          )}
        >
          {isApplied ? "✓ Applied" : "Apply"}
        </button>
      </div>

    </motion.div>
  )
})

JobCard.displayName = 'JobCard'
