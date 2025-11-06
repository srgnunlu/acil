/**
 * Loading state for patient detail page
 * Provides a skeleton UI while data is being fetched
 */
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>

        <div className="flex justify-between items-start">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="flex space-x-4">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-3/4"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
