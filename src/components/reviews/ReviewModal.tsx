import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useReviews,
  PROVIDER_REVIEW_TAGS,
  STUDENT_REVIEW_TAGS,
  type ReviewerRole,
  type ReviewTag,
} from '@/store/useReviews'
import { useAuth } from '@/store/useAuth'
import { useUiStore } from '@/store/uiStore'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  /** Subject being reviewed */
  subjectId: string
  subjectName: string
  subjectAvatar?: string
  /** Which role is the reviewer (determines available tags) */
  reviewerRole?: ReviewerRole
  /** Optional job context */
  jobTitle?: string
}

const springTransition = { type: 'spring' as const, stiffness: 380, damping: 28 }

// ─── Star Rating Component ─────────────────────────────────
const StarRating = ({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) => {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'w-8 h-8 transition-colors',
              n <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        </motion.button>
      ))}
    </div>
  )
}

// ─── Tag Chip ──────────────────────────────────────────────
const TagChip = ({
  tag,
  selected,
  onToggle,
}: {
  tag: ReviewTag
  selected: boolean
  onToggle: () => void
}) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onToggle}
    className={cn(
      'px-3 py-1.5 rounded-full text-sm font-bold border transition-all select-none',
      selected
        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
        : 'bg-muted/40 text-foreground border-border hover:border-primary/40 hover:bg-muted/70'
    )}
  >
    {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
    {tag}
  </motion.button>
)

// ─── Main Modal ────────────────────────────────────────────
export const ReviewModal = ({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  subjectAvatar = '?',
  reviewerRole,
  jobTitle = 'Completed Job',
}: ReviewModalProps) => {
  const { user } = useAuth()
  const { submitReview } = useReviews()
  const isSelf = user?.id === subjectId

  const activeRole: ReviewerRole = reviewerRole ?? (user?.role === 'admin' ? 'student' : user?.role) ?? 'student'
  const availableTags =
    activeRole === 'student' ? PROVIDER_REVIEW_TAGS : STUDENT_REVIEW_TAGS

  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([])
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Reset state when re-opened
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setSelectedTags([])
      setNote('')
      setSubmitted(false)
    }
  }, [isOpen])

  // Block scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const toggleTag = (tag: ReviewTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    if (rating === 0) return
    if (isSelf) {
      useUiStore.getState().addToast('Self-reviewing is not allowed.', 'error')
      return
    }
    submitReview({
      reviewerRole: activeRole,
      reviewerName: user?.name ?? 'Anonymous',
      reviewerAvatar: user?.avatarPlaceholder ?? '?',
      subjectId,
      subjectName,
      rating,
      tags: selectedTags,
      note: note.trim() || undefined,
      jobTitle,
    })
    setSubmitted(true)
    setTimeout(onClose, 2200)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full sm:max-w-md bg-card border border-border/50 shadow-2xl flex flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={springTransition}
          >
            {/* Glow header */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8 flex flex-col gap-6 relative z-10">
              <AnimatePresence mode="wait">
                {isSelf ? (
                  /* ─── Self-Review Error State ─── */
                  <motion.div
                    key="self-review-error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={springTransition}
                    className="flex flex-col items-center gap-4 py-6 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-foreground">Self-Review Blocked</h2>
                    <p className="text-sm text-muted-foreground">
                      You cannot write a review for yourself.
                    </p>
                  </motion.div>
                ) : submitted ? (
                  /* ─── Success State ─── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={springTransition}
                    className="flex flex-col items-center gap-4 py-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...springTransition, delay: 0.1 }}
                      className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h2 className="text-xl font-black text-foreground">Review Submitted!</h2>
                    <p className="text-sm text-muted-foreground">
                      Thank you for helping build a trustworthy marketplace.
                    </p>
                  </motion.div>
                ) : (
                  /* ─── Form State ─── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-xl font-bold shrink-0">
                        {subjectAvatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                          {activeRole === 'student' ? 'Reviewing employer' : 'Reviewing worker'}
                        </p>
                        <h2 className="text-lg font-black text-foreground leading-tight">
                          {subjectName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{jobTitle}</p>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground">
                        Overall Experience
                      </p>
                      <StarRating value={rating} onChange={setRating} />
                      {rating > 0 && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-muted-foreground"
                        >
                          {['', 'Poor experience', 'Below expectations', 'Decent experience', 'Great experience', 'Outstanding! ⭐'][rating]}
                        </motion.p>
                      )}
                    </div>

                    {/* Tag selection */}
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-foreground">
                        What stood out? <span className="text-muted-foreground font-normal">(pick any)</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <TagChip
                            key={tag}
                            tag={tag}
                            selected={selectedTags.includes(tag)}
                            onToggle={() => toggleTag(tag)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Optional note */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground">
                        Add a note <span className="text-muted-foreground font-normal">(optional)</span>
                      </p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={240}
                        rows={2}
                        placeholder="Share a brief experience to help others..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      whileHover={rating > 0 ? { scale: 1.01, y: -1 } : {}}
                      whileTap={rating > 0 ? { scale: 0.98 } : {}}
                      onClick={handleSubmit}
                      disabled={rating === 0}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 font-black py-3.5 rounded-xl transition-all',
                        rating > 0
                          ? 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground shadow-lg'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      Submit Review <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
