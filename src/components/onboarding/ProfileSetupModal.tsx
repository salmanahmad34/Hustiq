// @ts-nocheck
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Camera, Building2, User } from 'lucide-react'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'
import { useProfileSetupModal } from '@/store/useProfileSetupModal'
import { useOnboardingModal } from '@/store/useOnboardingModal'
import { useAuth } from '@/store/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { trackSignupCompleted } from '@/services/analytics'

const TOTAL_STEPS = 3

export const ProfileSetupModal = () => {
  const { isOpen, step, formData, updateData, closeModal, nextStep, prevStep, reset } = useProfileSetupModal()
  const selectedRole = useOnboardingModal(state => state.selectedRole)
  const navigate = useNavigate()

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleFinish = async () => {
    const activeUser = useAuth.getState().user
    const isRealSession = activeUser && !activeUser.id.startsWith('00000000-')

    const role = selectedRole === 'provider' ? 'provider' : 'student'
    const name = selectedRole === 'provider' 
      ? (formData.businessName || 'HustiQ Business')
      : (formData.fullName || 'HustiQ Student')

    const metadata = {
      city: formData.city || '',
      bio: formData.bio || '',
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      availability: formData.availability || '',
      hiringNeeds: formData.hiringNeeds || ''
    }

    if (isRealSession && activeUser) {
      try {
        await useAuth.getState().updateUserProfile({
          name,
          onboarding_completed: true,
          metadata
        })
        trackSignupCompleted(activeUser.id, role, name)
      } catch (err) {
        console.error('Failed to complete onboarding in Supabase:', err)
      }
    } else {
      // Mock session fallback
      const userId = role === 'provider' 
        ? '00000000-0000-0000-0000-000000000002' 
        : '00000000-0000-0000-0000-000000000001'
        
      useAuth.setState({
        isAuthenticated: true,
        user: {
          id: userId,
          email: `${name.toLowerCase().replace(/\s/g, '')}@hustiq.com`,
          name,
          role,
          avatarPlaceholder: name.charAt(0).toUpperCase(),
          onboarding_completed: true,
          metadata
        } as any,
        error: null
      })
      trackSignupCompleted(userId, role, name)
    }

    // 3. Close modal and securely route
    closeModal()
    reset()
    navigate(ROUTES.DASHBOARD)
  }

  // Common variants for sliding steps
  const variants = {
    initial: { opacity: 0, x: 20, filter: 'blur(4px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -20, filter: 'blur(4px)' }
  }

  const renderStudentStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="student-1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Let's get to know you</h2>
              <p className="text-muted-foreground">Basic details to help providers find you.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/70" />
                  <input 
                    type="text" 
                    value={formData.fullName || ''}
                    onChange={e => updateData({ fullName: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                    placeholder="John Doe" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City / Location</label>
                <input 
                  type="text" 
                  value={formData.city || ''}
                  onChange={e => updateData({ city: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  placeholder="Mumbai, Maharashtra" 
                />
              </div>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div key="student-2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Build your identity</h2>
              <p className="text-muted-foreground">Add a face and a bio to stand out.</p>
            </div>
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer transition-colors relative group">
                <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">Upload</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Short Bio</label>
              <textarea 
                value={formData.bio || ''}
                onChange={e => updateData({ bio: e.target.value })}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-32" 
                placeholder="I'm a computer science student looking for part-time tech gigs..." 
              />
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div key="student-3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Your super powers</h2>
              <p className="text-muted-foreground">What are you good at? When can you work?</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Skills / Interests</label>
                <input 
                  type="text" 
                  value={formData.skills || ''}
                  onChange={e => updateData({ skills: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  placeholder="e.g. Data Entry, Design, Event Staffing" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Work Availability</label>
                <select 
                  value={formData.availability || ''}
                  onChange={e => updateData({ availability: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                >
                  <option value="" disabled>Select availability...</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="evenings">Weekday Evenings</option>
                  <option value="flexible">Completely Flexible</option>
                </select>
              </div>
            </div>
          </motion.div>
        )
      default: return null
    }
  }

  const renderProviderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="provider-1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Set up your business</h2>
              <p className="text-muted-foreground">Tell us about your organization or shop.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Business / Shop Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/70" />
                  <input 
                    type="text" 
                    value={formData.businessName || ''}
                    onChange={e => updateData({ businessName: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                    placeholder="Zivaro Cafe" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Business Category</label>
                <select 
                  value={formData.category || ''}
                  onChange={e => updateData({ category: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                >
                  <option value="" disabled>Select category...</option>
                  <option value="retail">Retail & Shop</option>
                  <option value="hospitality">Hospitality & Food</option>
                  <option value="tech">Tech & Digital</option>
                  <option value="events">Events & Management</option>
                </select>
              </div>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div key="provider-2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Where are you located?</h2>
              <p className="text-muted-foreground">Students nearby will see your gigs first.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <input 
                  type="text" 
                  value={formData.city || ''}
                  onChange={e => updateData({ city: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  placeholder="Navi Mumbai" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Short Description</label>
                <textarea 
                  value={formData.bio || ''}
                  onChange={e => updateData({ bio: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24" 
                  placeholder="We are a fast-paced local cafe looking for energetic help..." 
                />
              </div>
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div key="provider-3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">What do you need?</h2>
              <p className="text-muted-foreground">Define your typical hiring needs.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hiring Needs</label>
                <input 
                  type="text" 
                  value={formData.hiringNeeds || ''}
                  onChange={e => updateData({ hiringNeeds: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  placeholder="e.g. Baristas, Inventory checkers, Weekend staff" 
                />
              </div>
            </div>
          </motion.div>
        )
      default: return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-background border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col min-h-[500px]"
          >
            {/* Abstract Header Glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress Bar Track */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>

            {/* Content Area */}
            <div className="p-8 sm:p-10 flex flex-col flex-1 relative z-10 overflow-hidden">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {selectedRole === 'student' ? renderStudentStep() : renderProviderStep()}
                </AnimatePresence>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                {step > 1 ? (
                  <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div /> /* Empty div for flex spacing */
                )}

                {step < TOTAL_STEPS ? (
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleFinish}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-primary/25"
                  >
                    <ZivaroBrandIcon size="xs" /> Finish Setup
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
