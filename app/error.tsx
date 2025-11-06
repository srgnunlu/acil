'use client'

import { useEffect } from 'react'

/**
 * Global Error Handler for Next.js App Router
 * This handles errors that occur in the root layout or page
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error('Global error:', error)

    // You can also log to an error reporting service here
    // e.g., Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">💥</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bir Şeyler Yanlış Gitti
        </h1>
        <p className="text-gray-600 mb-6">
          Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
            <p className="font-mono text-xs text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">
                Error Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => (window.location.href = '/dashboard/patients')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  )
}
