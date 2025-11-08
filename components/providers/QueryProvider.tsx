'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache 5 dakika boyunca fresh kabul edilir
            staleTime: 5 * 60 * 1000, // 5 minutes
            
            // Cache 30 dakika boyunca memory'de tutulur
            gcTime: 30 * 60 * 1000, // 30 minutes
            
            // Window focus'ta otomatik yenileme yapma (performans için)
            refetchOnWindowFocus: false,
            
            // Network reconnect'te yeniden dene
            refetchOnReconnect: true,
            
            // Retry stratejisi - 404 hariç 3 kez dene
            retry: (failureCount, error: any) => {
              if (error?.status === 404) return false
              if (error?.status === 401) return false
              return failureCount < 3
            },
            
            // Retry delay - exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Background refetch'i kapat (sadece stale data'de)
            refetchInterval: false,
            
            // Prefetching'i optimize et - sadece stale data'de yeniden yükle
            refetchOnMount: true,
          },
          mutations: {
            // Mutation'lar için retry
            retry: 1,
            
            // Mutation error'ları logla
            onError: (error) => {
              console.error('Mutation error:', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
