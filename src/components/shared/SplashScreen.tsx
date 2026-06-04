import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SplashScreenProps {
  onComplete: () => void
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const shouldReduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<'draw' | 'slide' | 'fadeout'>('draw')

  useEffect(() => {
    console.log('Splash mounted')
  }, [])

  useEffect(() => {
    // 1. Draw logo initially, then transition to sliding logo + showing text
    const slideTimer = setTimeout(() => {
      setPhase('slide')
    }, 1400)

    // 2. Stay unified for a moment, then trigger full screen fade out
    const fadeTimer = setTimeout(() => {
      setPhase('fadeout')
    }, 2600)

    // 3. Complete and unmount, triggering dashboard navigation
    const completeTimer = setTimeout(() => {
      console.log('Splash finished')
      onComplete()
    }, 3000)

    return () => {
      clearTimeout(slideTimer)
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  // Accessibility: clean simple fades if motion is disabled
  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'fadeout' ? 0 : 1 }}
          transition={{ duration: phase === 'fadeout' ? 0.4 : 0.6 }}
          className="flex items-center gap-4"
        >
          {/* Static minimal logo */}
          <svg
            viewBox="0 0 32 32"
            className="w-16 h-16 stroke-foreground shrink-0"
            fill="none"
            strokeWidth={3}
          >
            <rect x="13" y="5" width="14" height="14" rx="3" strokeOpacity={0.4} />
            <rect x="5" y="13" width="14" height="14" rx="3" />
          </svg>
          <span className="text-4xl font-black tracking-tight">HustiQ</span>
        </motion.div>
      </div>
    )
  }

  // 12 tiny random floating particles for shimmer background
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const size = Math.random() * 4 + 3 // 3px to 7px
    const initialX = Math.random() * 100 // percentage
    const initialY = Math.random() * 100 // percentage
    const moveY = -(Math.random() * 80 + 40) // up offset
    const duration = Math.random() * 2.5 + 2 // seconds
    const delay = Math.random() * 0.5

    return (
      <motion.div
        key={i}
        className="absolute rounded-full bg-primary/20 pointer-events-none blur-[0.5px]"
        style={{
          width: size,
          height: size,
          left: `${initialX}%`,
          top: `${initialY}%`,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: [0, 0.7, 0.7, 0],
          y: [0, moveY],
          scale: [0.5, 1.2, 1, 0.5],
        }}
        transition={{
          duration,
          delay,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    )
  })

  return (
    <AnimatePresence>
      {phase !== 'fadeout' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden",
            "bg-gradient-to-br from-background via-background to-muted/20"
          )}
        >
          {/* Ambient Particles Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            {particles}
          </div>

          {/* Logo & Wordmark Container */}
          <div className="relative flex items-center justify-center gap-0">
            {/* Logo Shape */}
            <motion.div
              layout
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
                mass: 1,
              }}
              animate={{
                x: phase === 'slide' ? -65 : 0,
                scale: phase === 'slide' ? 1.05 : 1,
              }}
              className="relative flex items-center justify-center z-10"
            >
              {/* Outer pulsing glow */}
              <motion.div
                animate={{
                  scale: [0.95, 1.08, 0.95],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full blur-2xl bg-primary/25 pointer-events-none w-32 h-32 -m-8"
              />

              {/* Overlapping Squares SVG */}
              <svg
                viewBox="0 0 32 32"
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 stroke-foreground select-none pointer-events-none transition-colors duration-500",
                  "drop-shadow-[0_0_15px_rgba(var(--primary),0.15)]"
                )}
                fill="none"
                strokeWidth={2.8}
              >
                {/* Offset square - Background layer */}
                <motion.rect
                  x="13"
                  y="5"
                  width="14"
                  height="14"
                  rx="3.5"
                  strokeOpacity={0.4}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.3,
                    ease: 'easeOut',
                    delay: 0.1,
                  }}
                />

                {/* Base square - Foreground layer */}
                <motion.rect
                  x="5"
                  y="13"
                  width="14"
                  height="14"
                  rx="3.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.3,
                    ease: 'easeOut',
                    delay: 0.3,
                  }}
                />
              </svg>
            </motion.div>

            {/* Wordmark Text */}
            <div className="absolute overflow-hidden pointer-events-none flex items-center">
              <AnimatePresence>
                {phase === 'slide' && (
                  <motion.h1
                    initial={{ opacity: 0, x: 80, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 55, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                    transition={{
                      type: 'spring',
                      stiffness: 140,
                      damping: 18,
                    }}
                    className={cn(
                      "text-4xl sm:text-5xl font-black tracking-tighter text-foreground whitespace-nowrap",
                      "bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary/80"
                    )}
                  >
                    HustiQ
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
