import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// Layouts
import { LandingLayout } from '@/components/layout/LandingLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Route Wrappers
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicRoute } from '@/routes/PublicRoute'

// Pages (Lazy Loaded)
const LandingPage = lazy(() => import('@/pages/public/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const OAuthCallback = lazy(() => import('@/pages/auth/OAuthCallback').then(m => ({ default: m.OAuthCallback })))
const DashboardIndex = lazy(() => import('@/pages/dashboard/DashboardIndex').then(m => ({ default: m.DashboardIndex })))
const NotificationsPage = lazy(() => import('@/pages/dashboard/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const MessagesPage = lazy(() => import('@/pages/dashboard/MessagesPage').then(m => ({ default: m.MessagesPage })))
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage').then(m => ({ default: m.ProfilePage })))
const JobsPage = lazy(() => import('@/pages/dashboard/JobsPage').then(m => ({ default: m.JobsPage })))
const SavedJobsPage = lazy(() => import('@/pages/dashboard/SavedJobsPage').then(m => ({ default: m.SavedJobsPage })))
const PremiumPage = lazy(() => import('@/pages/dashboard/PremiumPage').then(m => ({ default: m.PremiumPage })))
const WalletPage = lazy(() => import('@/pages/dashboard/WalletPage').then(m => ({ default: m.WalletPage })))
const RecommendationsPage = lazy(() => import('@/pages/dashboard/RecommendationsPage').then(m => ({ default: m.RecommendationsPage })))
const GrowthPage = lazy(() => import('@/pages/dashboard/GrowthPage').then(m => ({ default: m.GrowthPage })))

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

const router = createBrowserRouter([
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
          {
            path: '/auth/callback',
            element: withSuspense(OAuthCallback),
          },
        ],
      },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: withSuspense(DashboardIndex),
          },
          {
            path: 'notifications',
            element: withSuspense(NotificationsPage),
          },
          {
            path: 'messages',
            element: withSuspense(MessagesPage),
          },
          {
            path: 'profile',
            element: withSuspense(ProfilePage),
          },
          {
            path: 'jobs',
            element: withSuspense(JobsPage),
          },
          {
            path: 'saved',
            element: withSuspense(SavedJobsPage),
          },
          {
            path: 'premium',
            element: withSuspense(PremiumPage),
          },
          {
            path: 'wallet',
            element: withSuspense(WalletPage),
          },
          {
            path: 'recommendations',
            element: withSuspense(RecommendationsPage),
          },
          {
            path: 'growth',
            element: withSuspense(GrowthPage),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundDiagnostic />,
  }
], {
  // YEH BASENAME ADD KARNA ZAROORI THA! Iske bina GitHub pages blank dikhayega
  basename: import.meta.env.BASE_URL
})

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
