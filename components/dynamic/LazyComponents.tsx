/**
 * Lazy-loaded Components for Performance Optimization
 *
 * These components are code-split and loaded only when needed
 * Reduces initial bundle size and improves Time to Interactive (TTI)
 */

import dynamic from 'next/dynamic'

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

// Dashboard Components (lazy-loaded)
export const LazyAIInsightsHero = dynamic(
  () => import('@/components/dashboard/AIInsightsHero').then((mod) => mod.AIInsightsHero),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Client-side only for interactive components
  }
)

export const LazyCriticalAlertsPanel = dynamic(
  () => import('@/components/dashboard/CriticalAlertsPanel').then((mod) => mod.CriticalAlertsPanel),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyPatientQuickGrid = dynamic(
  () => import('@/components/dashboard/PatientQuickGrid').then((mod) => mod.PatientQuickGrid),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyActivityStreamPanel = dynamic(
  () => import('@/components/dashboard/ActivityStreamPanel').then((mod) => mod.ActivityStreamPanel),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AnalyticsDashboard').then((mod) => mod.AnalyticsDashboard),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

// Chart Components (heavy, load on-demand)
export const LazyPatientStatusChart = dynamic(
  () => import('@/components/charts/PatientStatusChart').then((mod) => mod.PatientStatusChart),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyActivityTrendChart = dynamic(
  () => import('@/components/charts/ActivityTrendChart').then((mod) => mod.ActivityTrendChart),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

// Mobile Components
export const LazyBottomSheet = dynamic(
  () => import('@/components/mobile/BottomSheet').then((mod) => mod.BottomSheet),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyPullToRefreshIndicator = dynamic(
  () =>
    import('@/components/mobile/PullToRefreshIndicator').then(
      (mod) => mod.PullToRefreshIndicator
    ),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

// Sticky Notes (heavy component)
export const LazyWorkspaceNotesPanel = dynamic(
  () => import('@/components/dashboard/WorkspaceNotesPanel').then((mod) => mod.WorkspaceNotesPanel),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

/**
 * Intersection Observer-based lazy loader
 * Loads component when it enters viewport
 */
export function IntersectionLazy({
  children,
  threshold = 0.1,
}: {
  children: React.ReactNode
  threshold?: number
}) {
  return <div className="min-h-[100px]">{children}</div>
}
