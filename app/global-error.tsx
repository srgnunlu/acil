'use client'

/**
 * Global Error Handler for critical errors
 * This catches errors in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white shadow-2xl rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Kritik Hata
            </h1>
            <p className="text-gray-600 mb-6">
              Uygulama kritik bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
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
                {error.stack && (
                  <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
