import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { ZivaroBrandIcon } from '@/components/brand/ZivaroBrandIcon'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background subtle gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Link to={ROUTES.HOME} className="absolute top-8 left-8 hidden md:flex items-center gap-2 font-bold text-2xl gradient-text">
        <ZivaroBrandIcon size="md" className="text-primary" />
        HustiQ
      </Link>

      <main className="w-full max-w-md z-10 glass-card rounded-2xl p-5 sm:p-8 border border-border/50">
        <div className="flex justify-center mb-8 md:hidden">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-2xl gradient-text">
            <ZivaroBrandIcon size="md" className="text-primary" />
            HustiQ
          </Link>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
