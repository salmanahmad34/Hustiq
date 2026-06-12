import { motion } from 'framer-motion'
import { Clock, Target, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  {
    title: 'Absolute Flexibility',
    description: 'Pick up gigs exclusively when you have free time. No minimum hours, no rigid shifts.',
    icon: Clock
  },
  {
    title: 'Hyper-Local Reach',
    description: 'Find verified opportunities within walking distance of your campus or apartment.',
    icon: Target
  },
  {
    title: 'Financial Independence',
    description: 'Get paid instantly upon completion. Build a sustainable income stream while studying.',
    icon: Wallet
  },
  {
    title: 'Professional Growth',
    description: 'Every completed gig builds your reliability score, unlocking higher-tier pay rates.',
    icon: TrendingUp
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
} as const

export const StudentHustleSection = () => {
  return (
    <section id="hustle" className="w-full py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="container max-w-screen-xl mx-auto px-4 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Content Area */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-col space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm">The Student Advantage</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Your schedule. <br />
                Your ambition. <br />
                <span className="text-muted-foreground">Your earnings.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mt-6 leading-relaxed max-w-lg">
                We believe student life shouldn't be restricted by rigid part-time shifts. HustiQ empowers you to monetize your free time on your exact terms, fueling your independence.
              </p>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {FEATURES.map((feature, idx) => (
                <motion.div key={idx} variants={itemVariants} className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-foreground">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground tracking-tight">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Visual Area (Abstract Motion Graphics UI) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] transform -translate-x-10 -translate-y-10 pointer-events-none" />
            <div className="absolute inset-0 bg-accent/5 rounded-full blur-[100px] transform translate-x-20 translate-y-20 pointer-events-none" />

            {/* Central Dark Luxury Card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative z-20 w-full max-w-sm bg-foreground text-background p-8 rounded-[2.5rem] shadow-2xl border border-background/10"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-background" />
                </div>
                <span className="text-sm font-semibold bg-background/10 px-3 py-1 rounded-full text-background">
                  Top Earner
                </span>
              </div>
              
              <div className="space-y-2 mb-8">
                <p className="text-background/60 text-sm font-medium">Earnings This Month</p>
                <h4 className="text-5xl font-bold tracking-tight text-background">₹12,450</h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground opacity-80" />
                  <span className="text-sm font-medium text-background/90">Event Staffing - Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground opacity-80" />
                  <span className="text-sm font-medium text-background/90">Tech Support - Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground opacity-80" />
                  <span className="text-sm font-medium text-background/90">Cafe Assist - Completed</span>
                </div>
              </div>
            </motion.div>

            {/* Floating Accessory Card 1 */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute z-30 bottom-10 -left-4 md:left-4 glass-card p-4 rounded-2xl border border-border shadow-soft-lg flex items-center gap-4 bg-background/90 backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground tracking-tight">New Gig Match!</p>
                <p className="text-xs text-muted-foreground">0.5 km away</p>
              </div>
            </motion.div>

            {/* Floating Accessory Card 2 */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
              className="absolute z-10 top-16 -right-4 md:right-4 glass-card p-4 rounded-2xl border border-border shadow-soft-lg flex items-center gap-4 bg-background/90 backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground tracking-tight">Schedule Flexible</p>
                <p className="text-xs text-muted-foreground">Work on your terms</p>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  )
}
