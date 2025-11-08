'use client'

export function PatientCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        {/* Checkbox skeleton */}
        <div className="w-5 h-5 bg-gray-200 rounded mt-1" />

        <div className="flex-1">
          {/* Name skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />

          {/* Info skeleton */}
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>

        {/* Status badge skeleton */}
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  )
}

export function PatientListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PatientCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
        <div className="h-12 bg-gray-200 rounded w-40" />
      </div>

      {/* Search skeleton */}
      <div className="mb-6">
        <div className="h-12 bg-gray-200 rounded-lg w-full mb-3" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-full w-20" />
          <div className="h-10 bg-gray-200 rounded-full w-20" />
          <div className="h-10 bg-gray-200 rounded-full w-28" />
        </div>
      </div>

      {/* Patient list skeleton */}
      <PatientListSkeleton />
    </div>
  )
}
