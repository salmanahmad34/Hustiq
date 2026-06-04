import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  Plus, 
  Check, 
  Calendar, 
  Filter, 
  ShieldCheck, 
  AlertCircle,
  Coffee,
  ShoppingBag,
  Building,
  Briefcase,
  Gift
} from 'lucide-react'
import { useAuth } from '@/store/useAuth'
import { useWallet } from '@/store/useWallet'
import type { Transaction } from '@/store/useWallet'
import { cn } from '@/lib/utils'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'

export const WalletPage = () => {
  const { user } = useAuth()
  const isProvider = user?.role === 'provider'
  
  const { 
    studentWallet, 
    providerWallet, 
    requestStudentPayout, 
    simulateStudentEarning,
    fundProviderWallet, 
    payWorker 
  } = useWallet()

  // State for tabs & filters
  const [activeFilter, setActiveFilter] = useState<'All' | 'Shifts' | 'Payouts' | 'Rewards'>('All')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  
  // State for Student Payout Request
  const [isPayoutOpen, setIsPayoutOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [bankDetails, setBankDetails] = useState('')
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [payoutError, setPayoutError] = useState('')

  // State for Provider releasing fund simulator
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [workerName, setWorkerName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payCategory, setPayCategory] = useState('Hospitality')
  const [paySuccess, setPaySuccess] = useState(false)

  // Current scope wallet variables
  const studentAvailable = studentWallet.totalEarnings - studentWallet.completedPayouts - studentWallet.pendingPayouts
  const providerAvailable = 100000 - providerWallet.totalSpending // Pre-funded budget pool

  const transactions = isProvider ? providerWallet.transactions : studentWallet.transactions

  // Filters transactions
  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Shifts') {
      return isProvider ? tx.category !== 'Payout' : (tx.type === 'credit')
    }
    if (activeFilter === 'Payouts') return tx.type === 'payout' || tx.category === 'Payout'
    if (activeFilter === 'Rewards') return tx.type === 'milestone' || tx.category === 'Rewards'
    return true
  })

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Handle Student Payout
  const handleStudentPayout = (e: FormEvent) => {
    e.preventDefault()
    setPayoutError('')
    const amt = parseFloat(payoutAmount)
    
    if (isNaN(amt) || amt <= 0) {
      setPayoutError('Please enter a valid payout amount.')
      return
    }
    if (amt > studentAvailable) {
      setPayoutError('Requested amount exceeds available balance.')
      return
    }
    if (!bankDetails.trim()) {
      setPayoutError('Please provide HDFC Bank details or IFSC code.')
      return
    }

    const success = requestStudentPayout(amt, bankDetails)
    if (success) {
      setPayoutSuccess(true)
      setTimeout(() => {
        setIsPayoutOpen(false)
        setPayoutSuccess(false)
        setPayoutAmount('')
        setBankDetails('')
      }, 2000)
    } else {
      setPayoutError('Payout request failed. Please try again.')
    }
  }

  // Handle Provider Paying Worker
  const handlePayWorker = (e: FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(payAmount)
    if (!workerName || !jobTitle || isNaN(amt) || amt <= 0) return

    payWorker(workerName, jobTitle, amt, payCategory)
    setPaySuccess(true)
    setTimeout(() => {
      setIsPayOpen(false)
      setPaySuccess(false)
      setWorkerName('')
      setJobTitle('')
      setPayAmount('')
    }, 2000)
  }

  // Quick simulation triggers
  const handleEarnSimulate = () => {
    simulateStudentEarning('Event Promoter for Starbucks', 1200, 'Hospitality')
  }

  const handleFundSimulate = () => {
    fundProviderWallet(10000)
  }

  // Framer Motion presets
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
  } as const

  // Custom Category Icon helpers
  const getCategoryIcon = (category: string) => {
    const name = category.toLowerCase()
    if (name.includes('hospitality') || name.includes('barista')) return <Coffee className="w-5 h-5 text-amber-500" />
    if (name.includes('delivery') || name.includes('zepto')) return <ShoppingBag className="w-5 h-5 text-blue-500" />
    if (name.includes('event')) return <Building className="w-5 h-5 text-purple-500" />
    if (name.includes('reward') || name.includes('milestone')) return <Gift className="w-5 h-5 text-rose-500" />
    return <Briefcase className="w-5 h-5 text-primary" />
  }

  return (
    <div className="flex flex-col h-full w-full gap-6 pb-12 md:pb-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <ZivaroBrandIcon size="xs" />
            <span>HustiQ Offline Payment Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            {isProvider ? 'Offline Spending Tracker' : 'Offline Earnings Ledger'}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {isProvider 
              ? 'Track offline settlements, record payments, and manage direct contractor wages.' 
              : 'Track direct offline earnings from completed shifts, record payouts, and plan savings.'
            }
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          {isProvider ? (
            <>
              <button 
                onClick={handleFundSimulate}
                className="flex items-center gap-2 bg-muted/40 hover:bg-muted text-foreground border border-border/60 py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200"
              >
                Simulate Funding
              </button>
              <button 
                onClick={() => setIsPayOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background hover:bg-primary hover:text-primary-foreground py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Record Offline Payment
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleEarnSimulate}
                className="flex items-center gap-2 bg-muted/40 hover:bg-muted text-foreground border border-border/60 py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200"
              >
                Simulate Shift Earning (Offline)
              </button>
              <button 
                onClick={() => setIsPayoutOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background hover:bg-primary hover:text-primary-foreground py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <ArrowUpRight className="w-4 h-4" />
                Record Offline Payout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"
      >
        
        {/* Left 2 Columns: Financial Metrics & Analytical SVG Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric 1 */}
            <motion.div 
              variants={cardVariants}
              className="glass-card p-6 rounded-2xl relative overflow-hidden border border-border/50 shadow-soft-lg flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isProvider ? 'Total Expense (Offline)' : 'Total Offline Earnings'}
                </span>
                <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-black text-foreground tracking-tight font-sans">
                  {formatCurrency(isProvider ? providerWallet.totalSpending : studentWallet.totalEarnings)}
                </h2>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                  <span>+18.4% growth</span>
                  <span>from last month</span>
                </p>
              </div>
            </motion.div>

            {/* Metric 2 */}
            <motion.div 
              variants={cardVariants}
              className="glass-card p-6 rounded-2xl relative overflow-hidden border border-border/50 shadow-soft-lg flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isProvider ? 'Direct / Offline Payments' : 'Direct Offline Payouts'}
                </span>
                <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Clock className="w-4 h-4 animate-pulse" />
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-black text-foreground tracking-tight font-sans">
                  {formatCurrency(isProvider ? providerWallet.activePayouts : studentWallet.pendingPayouts)}
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Settled directly offline</span>
                </p>
              </div>
            </motion.div>

            {/* Metric 3 */}
            <motion.div 
              variants={cardVariants}
              className="glass-card p-6 rounded-2xl relative overflow-hidden border border-border/60 bg-muted/20 shadow-soft-lg flex flex-col justify-between min-h-[140px] glow-primary/5"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isProvider ? 'Fund Pool Balance' : 'Unsettled Offline Earnings'}
                </span>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-black text-foreground tracking-tight font-sans">
                  {formatCurrency(isProvider ? providerAvailable : studentAvailable)}
                </h2>
                <p className="text-[10px] font-bold text-primary mt-1 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 inline mr-0.5" />
                  <span>Settled directly by providers offline</span>
                </p>
              </div>
            </motion.div>

          </div>

          {/* Fintech Premium SVG Visual Analytics Chart */}
          <motion.div 
            variants={cardVariants}
            className="glass-card p-6 rounded-2xl border border-border/50 shadow-soft-lg flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground tracking-tight">
                  {isProvider ? 'Hiring Expense Insights' : 'Earning Trajectory'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isProvider 
                    ? 'Visual allocation of contractor funding across primary marketplace categories.' 
                    : 'Historical weekly growth curve based on completed marketplace tasks.'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-full border border-border/50 text-[10px] font-bold">
                <span className="bg-card text-foreground px-2.5 py-1 rounded-full shadow-sm">Monthly</span>
                <span className="text-muted-foreground px-2.5 py-1">Weekly</span>
              </div>
            </div>

            {/* Custom Premium SVG Render */}
            {!isProvider ? (
              // Student Earning trajectory SVG (Sparkline / Area Curve Chart)
              <div className="w-full flex flex-col gap-4 mt-2">
                <div className="h-[200px] w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Gradient under the curve */}
                    <path
                      d="M 10 180 C 100 130, 160 80, 250 100 C 340 120, 400 50, 490 30 L 490 200 L 10 200 Z"
                      fill="url(#chartGradient)"
                    />

                    {/* Curved line pathway */}
                    <path
                      d="M 10 180 C 100 130, 160 80, 250 100 C 340 120, 400 50, 490 30"
                      fill="none"
                      stroke="currentColor"
                      className="text-primary"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Glowing Points */}
                    <circle cx="10" cy="180" r="5" className="fill-background stroke-primary" strokeWidth="2.5" />
                    <circle cx="120" cy="142" r="5" className="fill-background stroke-primary" strokeWidth="2.5" />
                    <circle cx="250" cy="100" r="5" className="fill-background stroke-primary" strokeWidth="2.5" />
                    <circle cx="370" cy="78" r="5" className="fill-background stroke-primary" strokeWidth="2.5" />
                    <circle cx="490" cy="30" r="6" className="fill-primary stroke-background" strokeWidth="3" />
                  </svg>

                  {/* High fidelity absolute labels */}
                  <div className="absolute top-[20px] left-[15%] pointer-events-none px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded shadow-lg">
                    ₹3,200
                  </div>
                  <div className="absolute top-[88px] left-[45%] pointer-events-none px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded shadow-lg">
                    ₹4,800
                  </div>
                  <div className="absolute top-[18px] right-[4%] pointer-events-none px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-extrabold rounded shadow-lg animate-bounce">
                    ₹5,950
                  </div>
                </div>
                
                {/* Horizontal time stamps */}
                <div className="flex justify-between px-2 text-[10px] font-bold text-muted-foreground border-t border-border/20 pt-2.5">
                  <span>Week 1 (May 1-7)</span>
                  <span>Week 2 (May 8-14)</span>
                  <span>Week 3 (May 15-21)</span>
                  <span>Week 4 (Active)</span>
                </div>
              </div>
            ) : (
              // Provider spending by category Visual layout (Horizontal detailed bar distributions)
              <div className="flex flex-col gap-5 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {providerWallet.spendingByCategory.map((category, index) => {
                    const pct = Math.round((category.value / providerWallet.totalSpending) * 100)
                    const colors = [
                      'bg-primary border-primary/20 text-primary',
                      'bg-amber-500 border-amber-500/20 text-amber-500',
                      'bg-blue-500 border-blue-500/20 text-blue-500',
                      'bg-purple-500 border-purple-500/20 text-purple-500'
                    ]
                    const currentStyle = colors[index % colors.length]
                    
                    return (
                      <div key={index} className="bg-muted/20 border border-border/40 p-4 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                            {category.label}
                          </span>
                          <span className="text-xs font-black text-foreground">{pct}%</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(category.value)}
                        </div>
                        {/* Custom visual mini-bar */}
                        <div className="w-full bg-muted/60 h-2 rounded-full mt-3 overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-500", currentStyle.split(' ')[0])} 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[11px] text-primary font-medium leading-relaxed">
                    All payments are settled directly between providers and workers offline via Cash, UPI, or direct bank transfer.
                  </p>
                </div>
              </div>
            )}

          </motion.div>

        </div>

        {/* Right Column: Earnings Activity Feed & Filters */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <motion.div 
            variants={cardVariants}
            className="glass-card p-5 rounded-2xl border border-border/50 shadow-soft-lg flex flex-col gap-4 h-full min-h-[500px]"
          >
            
            {/* Header / Filter dropdown */}
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Activity Timeline
              </h3>
              
              <div className="relative group">
                <button className="flex items-center gap-1.5 p-1.5 rounded-lg border border-border/50 text-[10px] font-bold bg-muted/20 text-muted-foreground hover:text-foreground">
                  <Filter className="w-3.5 h-3.5" />
                  <span>{activeFilter}</span>
                </button>
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block w-36 bg-card border border-border/60 rounded-xl shadow-xl z-30 p-1">
                  {(['All', 'Shifts', 'Payouts', 'Rewards'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className="w-full text-left p-2 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Feed */}
            <div className="flex-1 overflow-y-auto max-h-[460px] flex flex-col gap-3.5 pr-1.5 scrollbar-thin">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">No transactions match your filter.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isDebit = tx.type === 'payout' || tx.type === 'expense'
                  const statusColors = {
                    Paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                    Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                    Processing: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                  }
                  
                  return (
                    <div 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="group p-3 border border-border/40 hover:border-border rounded-xl transition-all duration-200 cursor-pointer hover:bg-muted/20 flex items-center justify-between gap-3 relative overflow-hidden"
                    >
                      {/* Left icon wrapper */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                          {getCategoryIcon(tx.category)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                            {tx.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-muted-foreground font-semibold">{tx.date}</span>
                            <span className="w-1 h-1 bg-border/80 rounded-full" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{tx.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right amount / status wrapper */}
                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className={cn(
                          "text-xs font-extrabold tracking-tight",
                          isDebit ? "text-muted-foreground" : "text-emerald-500"
                        )}>
                          {isDebit ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                        
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-extrabold border leading-none",
                          statusColors[tx.status]
                        )}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Platform Escrow protection highlight */}
            <div className="mt-auto border-t border-border/20 pt-4 flex items-center gap-2 bg-muted/10 p-3 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[9px] text-muted-foreground font-semibold leading-relaxed">
                Notice: HustiQ does not process online payments. All shifts are paid offline directly by the provider. Use this ledger to keep track of settlements.
              </span>
            </div>

          </motion.div>

        </div>

      </motion.div>

      {/* ─── MODALS & DIALOGS ─────────────────────────────────── */}

      {/* 1. Student Payout Request Modal */}
      <AnimatePresence>
        {isPayoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayoutOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl max-w-md w-full p-6 shadow-xl relative z-10 flex flex-col overflow-hidden"
            >
              <h3 className="text-xl font-black text-foreground tracking-tight mb-2 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Record Offline Payout
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Log a direct offline payment received from your provider (UPI, Cash, or Direct Transfer) to balance your ledger.
              </p>

              {payoutSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">Offline Settlement Recorded!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Your direct payout settlement has been recorded to update your ledger balance.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleStudentPayout} className="space-y-4">
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">Available to Withdraw:</span>
                    <span className="font-extrabold text-foreground">{formatCurrency(studentAvailable)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Payout Amount (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-muted-foreground">₹</span>
                      <input 
                        type="number" 
                        required
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 pl-8 pr-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      HDFC Bank Account Info & IFSC
                    </label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      placeholder="Account No: XXXXXXXXXX, IFSC: HDFCX"
                      className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent text-foreground placeholder:text-muted-foreground/45"
                    />
                  </div>

                  {payoutError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{payoutError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsPayoutOpen(false)}
                      className="flex-1 bg-muted/40 hover:bg-muted border border-border/60 rounded-xl py-3 text-xs font-bold transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-xl py-3 text-xs font-bold transition-all text-center"
                    >
                      Confirm Settlement
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Provider Release Payment Modal */}
      <AnimatePresence>
        {isPayOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl max-w-md w-full p-6 shadow-xl relative z-10 flex flex-col overflow-hidden"
            >
              <h3 className="text-xl font-black text-foreground tracking-tight mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Record Offline Payment
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Log cash, UPI, or direct offline payments made to students for their completed shifts.
              </p>

              {paySuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">Offline Payment Logged!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    ₹{payAmount} payment has been recorded as paid offline to {workerName}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePayWorker} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Worker Name
                      </label>
                      <input 
                        type="text" 
                        required
                        value={workerName}
                        onChange={(e) => setWorkerName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Job Title
                      </label>
                      <input 
                        type="text" 
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Weekend Barista"
                        className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Payout Amount (INR)
                      </label>
                      <input 
                        type="number" 
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="₹ Amount"
                        className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Category
                      </label>
                      <select 
                        value={payCategory}
                        onChange={(e) => setPayCategory(e.target.value)}
                        className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent"
                      >
                        <option value="Hospitality">Hospitality</option>
                        <option value="Servers & Staff">Servers & Staff</option>
                        <option value="Deliveries">Deliveries</option>
                        <option value="Events & Promos">Events & Promos</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsPayOpen(false)}
                      className="flex-1 bg-muted/40 hover:bg-muted border border-border/60 rounded-xl py-3 text-xs font-bold transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-xl py-3 text-xs font-bold transition-all text-center"
                    >
                      Confirm Offline Payment
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Transaction Detail Backdrop Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl max-w-sm w-full p-6 shadow-xl relative z-10"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center shadow-sm">
                  {getCategoryIcon(selectedTx.category)}
                </div>
                
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">{selectedTx.title}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    Reference: {selectedTx.reference || 'ZVR-PAY-XXXXXXXX'}
                  </p>
                </div>

                <div className="w-full border-t border-b border-border/30 py-3.5 my-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">Status</span>
                    <span className="font-extrabold text-primary">{selectedTx.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">Transaction Amount</span>
                    <span className="font-black text-foreground">{formatCurrency(selectedTx.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">Completed Date</span>
                    <span className="font-bold text-foreground">{selectedTx.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">Payment Mode</span>
                    <span className="font-bold text-foreground">Direct Offline (Cash/UPI)</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedTx(null)}
                  className="w-full bg-foreground hover:bg-primary hover:text-primary-foreground text-background rounded-xl py-2.5 text-xs font-bold transition-all"
                >
                  Dismiss Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
