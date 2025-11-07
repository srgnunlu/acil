import type { Meta, StoryObj } from '@storybook/react'
import { QueryProvider } from './QueryProvider'
import { useQuery } from '@tanstack/react-query'

const meta: Meta<typeof QueryProvider> = {
  title: 'Components/Providers/QueryProvider',
  component: QueryProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof QueryProvider>

// Sample component that uses React Query
function SampleQueryComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sample-data'],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { message: 'Data loaded successfully!' }
    },
  })

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-100 rounded">
        <p className="text-blue-800">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 rounded">
        <p className="text-red-800">Error: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-100 rounded">
      <p className="text-green-800 font-semibold">{data?.message}</p>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <QueryProvider>
      <div className="p-8 space-y-4">
        <h2 className="text-xl font-bold">React Query Provider Demo</h2>
        <SampleQueryComponent />
      </div>
    </QueryProvider>
  ),
}

export const WithMultipleQueries: Story = {
  render: () => (
    <QueryProvider>
      <div className="p-8 space-y-4">
        <h2 className="text-xl font-bold">Multiple Queries</h2>
        <SampleQueryComponent />
        <SampleQueryComponent />
      </div>
    </QueryProvider>
  ),
}
