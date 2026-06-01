import { useState, type MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Flame, 

  Lock, 
  CheckCircle2, 
  Zap, 
  ChevronRight, 
  RotateCcw,
  Briefcase,
  Star,
  Users
} from 'lucide-react'
import { useAuth } from '@/store/useAuth'
import { useGrowth } from '@/store/useGrowth'
import { cn } from '@/lib/utils'

export const GrowthPage = () => {
  const { user } = useAuth()
  const activeRole = user?.role || 'student'
  const isProvider = activeRole === 'provider'

  const {
    studentProgression,
    providerProgression,
    addStudentXp,
    incrementStudentMilestone,
    checkInStudentDaily,
    addProviderXp,
    incrementProviderMilestone,
    checkInProviderDaily,
    resetProgression
  } = useGrowth()

  // Select progression data based on active role
  const progression = isProvider ? providerProgression : studentProgression
  const { xp, nextLevelXp, level, currentStreak, longestStreak, achievements } = progression

  // State to simulate actions and show XP gains floating feedback
  const [floatingXpGains, setFloatingXpGains] = useState<{ id: number; text: string; x: number; y: number }[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all')

  const triggerXpFloatingText = (e: MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newGain = {
      id: Date.now() + Math.random(),
      text,
      x,
      y
    }
    setFloatingXpGains(prev => [...prev, newGain])
    setTimeout(() => {
      setFloatingXpGains(prev => prev.filter(g => g.id !== newGain.id))
    }, 1000)
  }

  // Simulator actions
  const handleDailyCheckIn = (e: MouseEvent) => {
    triggerXpFloatingText(e, isProvider ? '+150 XP' : '+100 XP')
    if (isProvider) {
      checkInProviderDaily()
    } else {
      checkInStudentDaily()
    }
  }

  const handleCompleteGig = (e: MouseEvent) => {
    triggerXpFloatingText(e, '+450 XP')
    if (isProvider) {
      // Increments provider matching
      incrementProviderMilestone('pr-2', 1)
      addProviderXp(200)
    } else {
      // Century club increment
      incrementStudentMilestone('st-2', 1)
      // Attendance increment
      incrementStudentMilestone('st-6', 1)
      addStudentXp(150)
    }
  }

  const handleHighRating = (e: MouseEvent) => {
    triggerXpFloatingText(e, '+650 XP')
    if (isProvider) {
      addProviderXp(150)
    } else {
      incrementStudentMilestone('st-4', 1)
      addStudentXp(150)
    }
  }

  const handleSpendPayout = (e: MouseEvent) => {
    triggerXpFloatingText(e, '+800 XP')
    if (isProvider) {
      incrementProviderMilestone('pr-4', 1200)
      addProviderXp(200)
    } else {
      incrementStudentMilestone('st-3', 950)
      addStudentXp(150)
    }
  }

  const handleFulfillment = (e: MouseEvent) => {
    triggerXpFloatingText(e, '+500 XP')
    if (isProvider) {
      incrementProviderMilestone('pr-5', 1)
      addProviderXp(150)
    } else {
      addStudentXp(100)
    }
  }

  // Filtered achievements
  const filteredAchievements = achievements.filter(ach => {
    if (activeTab === 'unlocked') return ach.isUnlocked
    if (activeTab === 'locked') return !ach.isUnlocked
    return true
  })

  // Calculation for progression circle SVG
  const circleRadius = 70
  const circumference = 2 * Math.PI * circleRadius
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100)
  const strokeDashoffset = circumference - (xpPercentage / 100) * circumference

  // Recommended Next Achievements (Closest to unlocking)
  const nextUpAchievements = achievements
    .filter(a => !a.isUnlocked)
    .sort((a, b) => (b.progress / b.maxProgress) - (a.progress / a.maxProgress))
    .slice(0, 2)

  // Animation variants
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
      
      {/* Dynamic Floating XP Feedbacks */}
      <AnimatePresence>
        {floatingXpGains.map(gain => (
          <motion.span
            key={gain.id}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1.1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full z-50 shadow-md backdrop-blur-sm"
            style={{ left: gain.x, top: gain.y }}
          >
            {gain.text}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Gamification Core Header Banner */}
      <div className="relative rounded-[2.5rem] p-6 sm:p-10 border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-purple-500/[0.02] to-transparent overflow-hidden shadow-soft-lg flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Glow Neural Underlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[90px] bg-purple-500/10 pointer-events-none animate-pulse" />

        {/* Circular Level Progress Ring (optimized SVG) */}
        <div className="relative shrink-0 flex items-center justify-center w-48 h-48 select-none">
          <svg className="w-44 h-44 transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r={circleRadius}
              className="stroke-muted/40 fill-none"
              strokeWidth="10"
            />
            <motion.circle
              cx="88"
              cy="88"
              r={circleRadius}
              className="stroke-primary fill-none drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]"
              strokeWidth="10"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ type: 'spring' as const, stiffness: 80, damping: 15 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">Level</span>
            <span className="text-5xl font-black text-foreground tracking-tighter mt-1">{level}</span>
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider mt-1">
              {Math.round(xpPercentage)}% Progress
            </span>
          </div>
        </div>

        {/* Level Metrics Info */}
        <div className="flex-1 space-y-4 text-center lg:text-left min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center lg:justify-start gap-2 bg-primary/10 border border-primary/25 text-primary font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-max mx-auto lg:mx-0">
                <Trophy className="w-3.5 h-3.5" />
                <span>Progression Track Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">
                {isProvider ? 'Partner Career Growth' : 'Student Hustle Progression'}
              </h1>
              <p className="text-muted-foreground text-sm font-semibold leading-relaxed max-w-xl">
                Every shift you secure, every top rating you receive, and every check-in expands your score to unlock premier tiers.
              </p>
            </div>
            
            {/* Streak metrics */}
            <div className="shrink-0 flex items-center justify-center gap-4 bg-card border border-border/40 p-4 rounded-2.5xl shadow-sm w-max mx-auto lg:mx-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">Active Streak</div>
                  <div className="text-base font-black text-foreground flex items-center gap-1.5">
                    {currentStreak} Days <span className="text-xs text-muted-foreground font-semibold">(Best: {longestStreak})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold pl-1">
              <span className="text-muted-foreground uppercase tracking-wider">Level Experience</span>
              <span className="text-foreground">{xp} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-3 bg-muted/60 border border-border/40 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ type: 'spring' as const, stiffness: 80, damping: 15 }}
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Progression content & side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
        
        {/* LEFT & CENTER: Achievements list */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-xl font-bold text-foreground">Growth Milestones</h2>
            </div>
            
            {/* Filter segments */}
            <div className="flex bg-muted/40 border border-border/50 rounded-xl p-1 shrink-0">
              {(['all', 'unlocked', 'locked'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "text-xs font-extrabold capitalize px-3 py-1.5 rounded-lg transition-all",
                    activeTab === tab 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
          >
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement) => {
                const percent = Math.min((achievement.progress / achievement.maxProgress) * 100, 100)
                
                return (
                  <motion.div
                    key={achievement.id}
                    variants={cardVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className={cn(
                      "group relative bg-card border border-border/40 rounded-2.5xl p-5 shadow-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between min-h-[190px]",
                      achievement.isUnlocked ? "hover:border-primary/20" : "opacity-90 hover:border-border"
                    )}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-3xl select-none w-12 h-12 bg-muted/50 border border-border/50 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          {achievement.icon}
                        </span>
                        
                        {achievement.isUnlocked ? (
                          <span className="bg-emerald-500/10 border border-emerald-500/15 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                          </span>
                        ) : (
                          <span className="bg-muted border border-border/50 text-muted-foreground text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4 pt-3.5 border-t border-border/25">
                      <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5 }}
                          className={cn(
                            "h-full rounded-full",
                            achievement.isUnlocked ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-primary"
                          )}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground pt-0.5">
                        <span>Awarded Reward</span>
                        <span className="text-primary font-black">+{achievement.xpAwarded} XP</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR: AI Insights & Simulators */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* AI Insights panel */}
          <div className="bg-card border border-primary/20 rounded-[2rem] p-6 relative overflow-hidden group shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-lg font-black text-foreground leading-tight">Growth Insights</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed text-left">
                Our projection analysis has outlined the most optimized path to expand your level standing:
              </p>

              <div className="space-y-3">
                {nextUpAchievements.length > 0 ? (
                  nextUpAchievements.map(ach => {
                    const diff = ach.maxProgress - ach.progress
                    return (
                      <div key={ach.id} className="bg-muted/30 border border-border/50 rounded-xl p-3.5 text-left flex gap-3 items-start hover:border-primary/20 transition-all duration-300">
                        <span className="text-2xl shrink-0 mt-0.5">{ach.icon}</span>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate">{ach.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-normal">
                            You are only <strong className="text-primary font-extrabold">{diff} {isProvider && ach.id === 'pr-4' ? 'credits' : 'tasks'}</strong> away from unlocking this milestone and securing <span className="font-extrabold text-primary">+{ach.xpAwarded} XP</span>.
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-xs font-black text-emerald-500">Milestones Complete</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">All current progression tracks have been successfully unlocked!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gamification simulation cockpit */}
          <div className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-lg font-black text-foreground mb-4 text-left">Growth Simulator</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5 text-left">
              Simulate realtime platform events to verify progression states, active day streaks, XP accrual, and Level-up scaling directly.
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={handleDailyCheckIn}
                className="flex items-center justify-between w-full bg-background border border-border/50 hover:border-amber-500/30 text-foreground hover:bg-amber-500/5 hover:text-amber-500 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] group/btn text-left"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber-500 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs">Daily Streak Check-in</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={handleCompleteGig}
                className="flex items-center justify-between w-full bg-background border border-border/50 hover:border-primary/30 text-foreground hover:bg-primary/5 hover:text-primary font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="text-xs">{isProvider ? 'Simulate Candidate Hire' : 'Complete Matched Shift'}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={handleHighRating}
                className="flex items-center justify-between w-full bg-background border border-border/50 hover:border-primary/30 text-foreground hover:bg-primary/5 hover:text-primary font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-blue-500" />
                  <span className="text-xs">{isProvider ? 'Receive Premium Review' : 'Accrue 5-Star Rating'}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={handleSpendPayout}
                className="flex items-center justify-between w-full bg-background border border-border/50 hover:border-primary/30 text-foreground hover:bg-primary/5 hover:text-primary font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <span className="text-xs">{isProvider ? 'Disburse Wage Payout' : 'Accrue Earning Rewards'}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {isProvider && (
                <button
                  onClick={handleFulfillment}
                  className="flex items-center justify-between w-full bg-background border border-border/50 hover:border-primary/30 text-foreground hover:bg-primary/5 hover:text-primary font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-left"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs">Fulfill Posted Shifts</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              )}

              <button
                onClick={resetProgression}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mt-4 px-4 py-2 bg-muted/40 hover:bg-muted/80 rounded-xl transition-all border border-border/50 w-max mx-auto shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-initialize Seed Defaults
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
