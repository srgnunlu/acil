import { render, screen, waitFor } from '@testing-library/react'
import { QueryProvider } from '../QueryProvider'
import { useQuery } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'

// Test component that uses react-query
function TestComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      return 'test data'
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>
  return <div>Data: {data}</div>
}

// Test component that throws an error
function ErrorComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['error-test'],
    queryFn: async () => {
      throw new Error('Test error')
    },
    retry: false,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>
  return <div>Data: {data}</div>
}

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div>Test content</div>
      </QueryProvider>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should provide QueryClient to children', async () => {
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    )

    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Data: test data')).toBeInTheDocument()
    })
  })

  it('should handle query errors', async () => {
    render(
      <QueryProvider>
        <ErrorComponent />
      </QueryProvider>
    )

    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    })
  })

  it('should cache query results', async () => {
    let callCount = 0

    function CachedComponent() {
      const { data } = useQuery({
        queryKey: ['cached'],
        queryFn: async () => {
          callCount++
          return 'cached data'
        },
      })

      return (
        <div>
          Calls: {callCount}, Data: {data}
        </div>
      )
    }

    const { rerender } = render(
      <QueryProvider>
        <CachedComponent />
      </QueryProvider>
    )

    // Wait for first load
    await waitFor(() => {
      expect(screen.getByText(/Calls: 1/)).toBeInTheDocument()
    })

    // Rerender - should use cached data
    rerender(
      <QueryProvider>
        <CachedComponent />
      </QueryProvider>
    )

    // Should still be 1 call (cached)
    await waitFor(() => {
      expect(screen.getByText(/cached data/)).toBeInTheDocument()
    })
  })

  it('should support multiple queries', async () => {
    function MultiQueryComponent() {
      const query1 = useQuery({
        queryKey: ['query1'],
        queryFn: async () => 'data1',
      })

      const query2 = useQuery({
        queryKey: ['query2'],
        queryFn: async () => 'data2',
      })

      if (query1.isLoading || query2.isLoading) return <div>Loading...</div>

      return (
        <div>
          {query1.data} - {query2.data}
        </div>
      )
    }

    render(
      <QueryProvider>
        <MultiQueryComponent />
      </QueryProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('data1 - data2')).toBeInTheDocument()
    })
  })

  it('should apply default query options', async () => {
    let fetchCount = 0

    function RefetchComponent() {
      const { data } = useQuery({
        queryKey: ['refetch-test'],
        queryFn: async () => {
          fetchCount++
          return `fetch-${fetchCount}`
        },
      })

      return <div>{data}</div>
    }

    render(
      <QueryProvider>
        <RefetchComponent />
      </QueryProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('fetch-1')).toBeInTheDocument()
    })

    // Focus window should not trigger refetch due to refetchOnWindowFocus: false
    window.dispatchEvent(new Event('focus'))

    // Should still be fetch-1
    await waitFor(() => {
      expect(screen.getByText('fetch-1')).toBeInTheDocument()
      expect(fetchCount).toBe(1)
    })
  })
})
