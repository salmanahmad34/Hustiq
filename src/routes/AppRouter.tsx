import { lazy, Suspense, useEffect } from 'react'
import { createHashRouter, RouterProvider, Navigate, useLocation, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// Layouts
import { LandingLayout } from '@/components/layout/LandingLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Route Wrappers
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicRoute } from '@/routes/PublicRoute'

// Production-safe chunk load error handler
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    )

    try {
      const component = await componentImport()
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false')
      return component
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume the chunk is stale due to a new deployment, force a reload to get new chunks
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true')
        window.location.reload()
      }
      throw error
    }
  })

// Pages (Lazy Loaded)
const LandingPage = lazyWithRetry(() => import('@/pages/public/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazyWithRetry(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazyWithRetry(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const DashboardIndex = lazyWithRetry(() => import('@/pages/dashboard/DashboardIndex').then(m => ({ default: m.DashboardIndex })))
const NotificationsPage = lazyWithRetry(() => import('@/pages/dashboard/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const MessagesPage = lazyWithRetry(() => import('@/pages/dashboard/MessagesPage').then(m => ({ default: m.MessagesPage })))
const ProfilePage = lazyWithRetry(() => import('@/pages/dashboard/ProfilePage').then(m => ({ default: m.ProfilePage })))
const JobsPage = lazyWithRetry(() => import('@/pages/dashboard/JobsPage').then(m => ({ default: m.JobsPage })))
const SavedJobsPage = lazyWithRetry(() => import('@/pages/dashboard/SavedJobsPage').then(m => ({ default: m.SavedJobsPage })))
const PremiumPage = lazyWithRetry(() => import('@/pages/dashboard/PremiumPage').then(m => ({ default: m.PremiumPage })))
const WalletPage = lazyWithRetry(() => import('@/pages/dashboard/WalletPage').then(m => ({ default: m.WalletPage })))
const RecommendationsPage = lazyWithRetry(() => import('@/pages/dashboard/RecommendationsPage').then(m => ({ default: m.RecommendationsPage })))
const GrowthPage = lazyWithRetry(() => import('@/pages/dashboard/GrowthPage').then(m => ({ default: m.GrowthPage })))
const SplashPage = lazyWithRetry(() => import('@/pages/auth/SplashPage').then(m => ({ default: m.SplashPage })))

const PageLoader = () => (
  <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center gap-4">
    <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading Workspace...</span>
  </div>
)

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

const NotFoundDiagnostic = () => {
  const { pathname, search, hash } = window.location
  console.log('[Router Diagnostic] 404 Route hit.', {
    pathname, search, hash,
    basename: import.meta.env.BASE_URL
  })
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <h1 className="text-4xl font-bold mb-2">404 - Route Not Found</h1>
      <p className="text-muted-foreground mb-4">React Router could not match this path.</p>
      <code className="bg-muted p-2 rounded text-sm text-left block w-full max-w-md overflow-auto">
        Path: {pathname}<br/>
        Basename: {import.meta.env.BASE_URL}
      </code>
      <a href="/" className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Return Home</a>
    </div>
  )
}

const RouteDiagnostic = () => {
  const location = useLocation()

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Router Diagnostic] Current Path:', location.pathname)
    }
  }, [location])

  return <Outlet />
}

const router = createHashRouter([
  {
    path: '/',
    element: <RouteDiagnostic />,
    // We removed errorElement here so chunk load errors propagate to ErrorBoundary instead of showing 404
    children: [
      {
        path: ROUTES.HOME,
        element: <LandingLayout />,
        children: [
          {
            index: true,
            element: withSuspense(LandingPage),
          },
        ],
      },
      {
        element: <PublicRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: ROUTES.LOGIN,
                element: withSuspense(LoginPage),
              },
              {
                path: ROUTES.SIGNUP,
                element: withSuspense(SignupPage),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.SPLASH,
            element: withSuspense(SplashPage),
          },
          {
            element: <DashboardLayout />,
            children: [
              {
                path: ROUTES.DASHBOARD,
                element: withSuspense(DashboardIndex),
              },
              {
                path: ROUTES.NOTIFICATIONS,
                element: withSuspense(NotificationsPage),
              },
              {
                path: ROUTES.MESSAGES,
                element: withSuspense(MessagesPage),
              },
              {
                path: ROUTES.PROFILE,
                element: withSuspense(ProfilePage),
              },
              {
                path: ROUTES.JOBS,
                element: withSuspense(JobsPage),
              },
              {
                path: ROUTES.SAVED,
                element: withSuspense(SavedJobsPage),
              },
              {
                path: ROUTES.PREMIUM,
                element: withSuspense(PremiumPage),
              },
              {
                path: ROUTES.WALLET,
                element: withSuspense(WalletPage),
              },
              {
                path: ROUTES.RECOMMENDATIONS,
                element: withSuspense(RecommendationsPage),
              },
              {
                path: ROUTES.GROWTH,
                element: withSuspense(GrowthPage),
              },
            ],
          },
        ],
      },
      {
        path: '/auth/callback',
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: '*',
        element: <NotFoundDiagnostic />,
      }
    ]
  }
], {
  basename: import.meta.env.BASE_URL
})

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
