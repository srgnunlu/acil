import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary'
import { useState } from 'react'

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ErrorBoundary>

// Component that throws an error
function ErrorThrowingComponent() {
  throw new Error('Test error from component')
  return null
}

// Component with controlled error
function ControlledErrorComponent() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('Controlled error triggered')
  }

  return (
    <div className="p-4">
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Trigger Error
      </button>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-8 bg-blue-100 rounded">
        <h2 className="text-xl font-bold mb-2">Normal Content</h2>
        <p>This content renders successfully without errors.</p>
      </div>
    </ErrorBoundary>
  ),
}

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ErrorThrowingComponent />
    </ErrorBoundary>
  ),
}

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-8 bg-yellow-100 border-2 border-yellow-400 rounded">
          <h2 className="text-xl font-bold text-yellow-800">Custom Error UI</h2>
          <p className="text-yellow-700">Something went wrong. Please try again later.</p>
        </div>
      }
    >
      <ErrorThrowingComponent />
    </ErrorBoundary>
  ),
}

export const ControlledError: Story = {
  render: () => (
    <ErrorBoundary>
      <ControlledErrorComponent />
    </ErrorBoundary>
  ),
}

export const ErrorFallbackComponent: StoryObj<typeof ErrorFallback> = {
  render: (args) => <ErrorFallback {...args} />,
  args: {
    error: new Error('This is a sample error message'),
  },
}

export const ErrorFallbackWithReset: StoryObj<typeof ErrorFallback> = {
  render: (args) => <ErrorFallback {...args} />,
  args: {
    error: new Error('Error with reset button'),
    resetError: () => alert('Reset button clicked!'),
  },
}

export const ErrorFallbackLongMessage: StoryObj<typeof ErrorFallback> = {
  render: (args) => <ErrorFallback {...args} />,
  args: {
    error: new Error(
      'This is a very long error message that demonstrates how the error fallback component handles lengthy error descriptions. It should wrap text properly and remain readable.'
    ),
    resetError: () => alert('Reset clicked'),
  },
}
