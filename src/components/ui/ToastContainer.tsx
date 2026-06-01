import { useUiStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export const ToastContainer = () => {
  const { toasts, removeToast } = useUiStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[280px] ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
              toast.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
              'bg-primary/10 border-primary/20 text-primary'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-bold flex-1 text-foreground">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="hover:opacity-70 transition-opacity">
              <X className="w-4 h-4 text-foreground/50" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
