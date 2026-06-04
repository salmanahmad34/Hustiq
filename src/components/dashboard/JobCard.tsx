import { memo } from 'react'
import { motion } from 'framer-motion'
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
  provider_id?: string
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
          ? "rounded-[2.5rem] p-5 min-[360px]:p-6 sm:p-8 gap-4 w-[280px] min-[360px]:w-[340px] sm:w-[460px] shrink-0 snap-center sm:snap-align-none" 
          : "rounded-[2rem] p-5 sm:p-6 gap-4 w-full mb-6",
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

      {/* TOP: Logo & Company Name */}
      <div className="relative z-10 flex items-center gap-3 pr-10">
        <div className="w-12 h-12 rounded-xl bg-muted/30 border border-border flex items-center justify-center text-xl shrink-0 group-hover:border-primary/30 transition-colors">
          {job.logoPlaceholder}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground truncate">{job.businessName}</h3>
            {job.isPremium && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
          </div>
          <span className="text-[10px] text-muted-foreground/70 font-medium">{job.postedTime}</span>
        </div>
      </div>

      {/* Bookmark Button (Absolute top-right for clean mobile stacking) */}
      <div className="absolute top-5 right-5 z-20">
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleSaveToggle}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors border",
            saved 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
          )}
        >
          <Bookmark className={cn("w-4 h-4", saved && "fill-primary")} />
        </motion.button>
      </div>

      {/* Badges row */}
      {(job.isNearby || job.isUrgent || job.isVerified) && (
        <div className="relative z-10 flex flex-wrap gap-2 mt-1">
          {job.isNearby && (
            <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Navigation className="w-3 h-3" /> Nearby
            </span>
          )}
          {job.isUrgent && (
            <span className="flex items-center gap-1 bg-destructive/10 text-destructive text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Urgent
            </span>
          )}
          {job.isVerified && <VerifiedEmployerBadge compact />}
        </div>
      )}

      {/* CENTER: Title & Description */}
      <div className="relative z-10 space-y-1.5 text-left">
        <h2 className={cn(
          "font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors",
          isUrgentVariant ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
        )}>
          {job.title}
        </h2>
        {job.description && (
          <p className="text-muted-foreground/80 leading-relaxed text-xs sm:text-sm line-clamp-3">
            {job.description}
          </p>
        )}
      </div>

      {/* METADATA: Location and Timing */}
      <div className="relative z-10 flex flex-col gap-2 pt-3 border-t border-border/30 mt-auto text-left">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <MapPin className={cn("w-3.5 h-3.5 shrink-0", job.isNearby && "text-emerald-500")} />
          <span className="truncate">{job.location}</span> 
          <span className={cn(
            "font-normal shrink-0",
            job.isNearby ? "text-emerald-500 font-semibold" : "text-muted-foreground/60"
          )}>({job.distance})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.timing}</span>
        </div>
      </div>

      {/* BOTTOM: Payout & Apply Button */}
      <div className="relative z-10 mt-2 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Guaranteed</span>
            <div className="flex items-baseline gap-0.5">
              <IndianRupee className="w-4 h-4 -mr-1 text-primary shrink-0" />
              <span className="font-black text-2xl sm:text-3xl text-foreground tracking-tighter">{job.payout}</span>
              <span className="text-xs font-semibold text-muted-foreground ml-0.5">/ {job.payoutType}</span>
            </div>
          </div>
          {job.isVerified && <SafePayoutIndicator className="shrink-0" />}
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!isApplied) openQuickApply(job); 
          }}
          disabled={isApplied}
          className={cn(
            "font-bold rounded-xl transition-all text-sm py-2.5 sm:py-3 px-6 w-full sm:w-auto text-center shrink-0",
            isApplied 
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed" 
              : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground hover:shadow-lg active:scale-95"
          )}
        >
          {isApplied ? "✓ Applied" : "Apply"}
        </button>
      </div>

    </motion.div>
  )
})

JobCard.displayName = 'JobCard'
