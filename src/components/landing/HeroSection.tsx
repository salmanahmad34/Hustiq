import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Clock, IndianRupee } from 'lucide-react'
import { useLiveStats } from '@/hooks/useLiveStats'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

const JOB_CARDS = [
  {
    id: 1,
    title: 'Event Staff Needed',
    distance: '2 km away',
    time: '4 hours',
    rate: '₹300/hr',
    delay: 0,
    style: { top: '10%', left: '0%' }
  },
  {
    erid: 2,
    title: 'Moving Help',
    distance: '0.5 km away',
    time: '2 hours',
    rate: '₹400/hr',
    delay: 0.2,
    style: { top: '45%', right: '0%' }
  },
  {
    id: 3,
    title: 'Tech Support',
    distance: '1 km away',
    time: '3 hours',
    rate: '₹600/hr',
    delay: 0.4,
    style: { bottom: '10%', left: '15%' }
  },
]

export const HeroSection = () => {
  const { stats, isLoading } = useLiveStats()

  return (
    <section className="relative w-full min-h-[90vh] flex items-center py-24 md:py-32 overflow-hidden bg-background">
      {/* Abstract Animated Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[60%] rounded-full bg-accent/20 blur-[120px] opacity-60" />
      </div>

      <div className="container max-w-screen-xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        {/* Left Content Area */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/20 bg-primary/5"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">New gigs added hourly</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
          >
            Hustle on Your Terms. <br className="hidden md:block" />
            <span className="gradient-text">Work Anywhere, Anytime.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Join thousands of students turning free time into cash. HustiQ connects you with flexible, nearby gigs that fit perfectly around your class schedule.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4"
          >
            <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:opacity-90 transition-opacity shadow-soft-lg flex items-center justify-center gap-2 group shadow-primary/20">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-foreground hover:bg-muted/50 rounded-full font-medium text-lg transition-colors flex items-center justify-center gap-2 border border-transparent">
              Explore Nearby Gigs
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center lg:justify-start gap-4 pt-6 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-primary/40 to-accent/40" />
                </div>
              ))}
            </div>
            {isLoading ? (
              <div className="h-5 w-40 bg-muted/50 rounded animate-pulse" />
            ) : (
              <p>Joined by <strong className="text-foreground">{stats?.activeStudents.toLocaleString()}+</strong> students</p>
            )}
          </motion.div>
        </div>

        {/* Right Abstract Cards Area */}
        <div className="flex-1 w-full relative h-[500px] lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0">
          <div className="relative w-full h-full max-w-md">
            {JOB_CARDS.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 50, x: 20 }}
                animate={{ opacity: 1, y: [0, -15, 0], x: 0 }}
                transition={{
                  opacity: { duration: 0.8, delay: card.delay },
                  x: { duration: 0.8, delay: card.delay, ease: "easeOut" },
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: card.delay,
                  }
                }}
                className={`absolute w-64 sm:w-72 glass-card rounded-2xl p-5 hover:border-primary/30 transition-colors cursor-pointer shadow-soft-lg`}
                style={{ ...card.style, zIndex: 10 + card.id }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {card.rate}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-3">{card.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{card.distance}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{card.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Center decorative element */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-dashed border-primary/20 pointer-events-none"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[450px] sm:h-[450px] rounded-full border border-dashed border-muted-foreground/10 pointer-events-none hidden sm:block"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
