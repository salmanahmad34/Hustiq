import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'
import { Link } from 'react-router-dom'

export const CTASection = () => {
  return (
    <section className="w-full py-24 md:py-32 relative overflow-hidden bg-foreground text-background">
      {/* Subtle abstract background motion graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1000px] h-[600px] md:h-[1000px] rounded-full bg-primary/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/20 blur-[100px] translate-x-1/3 -translate-y-1/3"
        />
        <motion.div 
          animate={{ rotate: [360, 0] }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] -translate-x-1/3 translate-y-1/3"
        />
      </div>

      <div className="container max-w-screen-xl mx-auto px-4 flex flex-col items-center justify-center text-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl flex flex-col items-center"
        >
          {/* Subtle Accent Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 border border-background/20 mb-8 backdrop-blur-md">
            <ZivaroBrandIcon size="xs" color="white" />
            <span className="text-sm font-bold tracking-wide text-background">Ready to take control?</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Start earning on your <br className="hidden sm:block" /> own terms today.
          </h2>
          
          <p className="text-lg md:text-xl text-background/70 mb-12 max-w-2xl leading-relaxed">
            Join the trusted local platform that empowers students to work whenever they want, wherever they are. Discover hyper-local gigs and unlock your financial independence.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to="/signup" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-background text-foreground px-8 py-4 rounded-xl font-bold text-lg transition-colors hover:bg-background/90 shadow-2xl"
              >
                Sign Up
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            
            <Link to="/jobs" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-transparent text-background px-8 py-4 rounded-xl font-bold text-lg transition-colors border border-background/30 hover:bg-background/10 hover:border-background/50"
              >
                Browse Local Gigs
              </motion.button>
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
