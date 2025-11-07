import type { Meta, StoryObj } from '@storybook/react'
import { AddPatientButton } from './AddPatientButton'

const meta: Meta<typeof AddPatientButton> = {
  title: 'Components/Patients/AddPatientButton',
  component: AddPatientButton,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: {
        push: (url: string) => console.log('Navigating to:', url),
        refresh: () => console.log('Refreshing...'),
      },
    },
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
type Story = StoryObj<typeof AddPatientButton>

export const CanAddPatient: Story = {
  args: {
    canAddPatient: true,
    currentCount: 2,
    limit: 3,
    tier: 'free',
  },
}

export const NearLimit: Story = {
  args: {
    canAddPatient: true,
    currentCount: 2,
    limit: 3,
    tier: 'free',
  },
  parameters: {
    docs: {
      description: {
        story: 'User is close to their patient limit (2/3).',
      },
    },
  },
}

export const AtLimit: Story = {
  args: {
    canAddPatient: false,
    currentCount: 3,
    limit: 3,
    tier: 'free',
  },
  parameters: {
    docs: {
      description: {
        story:
          'User has reached their patient limit. Button is disabled and shows an alert when clicked.',
      },
    },
  },
}

export const ProUserCanAdd: Story = {
  args: {
    canAddPatient: true,
    currentCount: 50,
    limit: 1000,
    tier: 'pro',
  },
  parameters: {
    docs: {
      description: {
        story: 'Pro tier user with much higher limits.',
      },
    },
  },
}

export const FreeUserAtLimit: Story = {
  args: {
    canAddPatient: false,
    currentCount: 3,
    limit: 3,
    tier: 'free',
  },
  parameters: {
    docs: {
      description: {
        story: 'Free tier user at limit. Alert message includes upgrade suggestion.',
      },
    },
  },
}

export const ProUserAtLimit: Story = {
  args: {
    canAddPatient: false,
    currentCount: 1000,
    limit: 1000,
    tier: 'pro',
  },
  parameters: {
    docs: {
      description: {
        story: 'Pro tier user at their limit (1000 patients).',
      },
    },
  },
}

export const SinglePatientRemaining: Story = {
  args: {
    canAddPatient: true,
    currentCount: 2,
    limit: 3,
    tier: 'free',
  },
  parameters: {
    docs: {
      description: {
        story: 'Only 1 patient slot remaining.',
      },
    },
  },
}
