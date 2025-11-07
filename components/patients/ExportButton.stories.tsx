import type { Meta, StoryObj } from '@storybook/react'
import { ExportButton } from './ExportButton'

const meta: Meta<typeof ExportButton> = {
  title: 'Components/Patients/ExportButton',
  component: ExportButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-50 rounded-lg">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExportButton>

// Mock fetch for Storybook
const mockFetch = (type: 'json' | 'pdf', shouldFail = false) => {
  global.fetch = (async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (shouldFail) {
      return {
        ok: false,
        json: async () => ({ error: 'Export başarısız oldu' }),
      }
    }

    if (type === 'json') {
      return {
        ok: true,
        json: async () => ({
          report: {
            patient: {
              name: 'Ahmet Yılmaz',
              age: 45,
              gender: 'Erkek',
            },
            data: 'Patient data...',
          },
        }),
      }
    } else {
      return {
        ok: true,
        blob: async () => new Blob(['PDF content'], { type: 'application/pdf' }),
      }
    }
  }) as typeof fetch
}

export const Default: Story = {
  args: {
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    patientName: 'Ahmet Yılmaz',
  },
  beforeEach: () => {
    mockFetch('json')
  },
}

export const LongPatientName: Story = {
  args: {
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    patientName: 'Prof. Dr. Ahmet Mehmet Ali Osman Yılmaz',
  },
  beforeEach: () => {
    mockFetch('json')
  },
}

export const WithSpecialCharacters: Story = {
  args: {
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    patientName: 'Şerif Öztürk Ğ Ü Ç İ',
  },
  beforeEach: () => {
    mockFetch('json')
  },
}
