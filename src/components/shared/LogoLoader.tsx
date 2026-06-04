import { motion } from 'framer-motion'

interface LogoLoaderProps {
  text?: string
}

export const LogoLoader = ({ text = 'Loading Workspace...' }: LogoLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient background glow */}
        <motion.div
          animate={{
            scale: [0.92, 1.08, 0.92],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-xl bg-primary/20 pointer-events-none w-20 h-20 -m-5"
        />

        {/* HustiQ Logo SVG with smooth pulse */}
        <motion.svg
          viewBox="0 0 32 32"
          className="w-10 h-10 stroke-foreground select-none pointer-events-none drop-shadow-[0_0_8px_rgba(var(--primary),0.1)]"
          fill="none"
          strokeWidth={3}
          animate={{
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Offset square - Background layer */}
          <rect x="13" y="5" width="14" height="14" rx="3.5" strokeOpacity={0.4} />
          {/* Base square - Foreground layer */}
          <rect x="5" y="13" width="14" height="14" rx="3.5" />
        </motion.svg>
      </div>

      {text && (
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse mt-2">
          {text}
        </span>
      )}
    </div>
  )
}
