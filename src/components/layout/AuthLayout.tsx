import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'
import { ArrowLeft } from 'lucide-react'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background subtle gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md z-10 glass-card rounded-[2rem] p-5 sm:p-8 border border-border/50 flex flex-col pt-6">
        {/* Centered HustiQ Logo & Brand Name */}
        <div className="flex justify-center w-full">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-2xl gradient-text">
            <ZivaroBrandIcon size="md" className="text-primary" />
            HustiQ
          </Link>
        </div>

        {/* Back Button (aligned left, 20px below logo) */}
        <div className="flex justify-start w-full mt-5 mb-6">
          <Link 
            to={ROUTES.HOME} 
            className="w-11 h-11 rounded-full bg-card hover:bg-muted border border-border/50 flex items-center justify-center text-foreground hover:text-primary transition-colors shadow-sm"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  )
}
