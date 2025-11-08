/**
 * Loading state for patients list page
 */
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="mb-6 flex gap-4">
        <div className="h-10 flex-1 bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>

      {/* Patient Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 dark:bg-slate-600 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-100 dark:bg-slate-600 rounded"></div>
              <div className="h-4 w-1/2 bg-gray-100 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
