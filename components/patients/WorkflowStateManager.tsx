'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WorkflowStateManagerProps {
  patientId: string
  currentState: string
}

const WORKFLOW_STATES = [
  {
    value: 'admission',
    label: 'Admission',
    description: 'Patient admitted to facility',
    color: '#3b82f6',
    icon: '📝'
  },
  {
    value: 'assessment',
    label: 'Assessment',
    description: 'Initial assessment in progress',
    color: '#eab308',
    icon: '🔍'
  },
  {
    value: 'diagnosis',
    label: 'Diagnosis',
    description: 'Diagnostic phase',
    color: '#a855f7',
    icon: '💡'
  },
  {
    value: 'treatment',
    label: 'Treatment',
    description: 'Active treatment phase',
    color: '#22c55e',
    icon: '💊'
  },
  {
    value: 'observation',
    label: 'Observation',
    description: 'Under observation',
    color: '#06b6d4',
    icon: '👁️'
  },
  {
    value: 'discharge_planning',
    label: 'Discharge Planning',
    description: 'Preparing for discharge',
    color: '#f97316',
    icon: '📋'
  },
  {
    value: 'discharged',
    label: 'Discharged',
    description: 'Patient discharged',
    color: '#6b7280',
    icon: '✅'
  }
]

export default function WorkflowStateManager({ patientId, currentState }: WorkflowStateManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState(currentState)

  const handleStateChange = async (newState: string) => {
    if (newState === currentState) return

    if (!confirm(`Are you sure you want to change the workflow state to "${WORKFLOW_STATES.find(s => s.value === newState)?.label}"?`)) {
      setSelectedState(currentState)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/patients/${patientId}/workflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_state: newState })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update workflow state')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow state')
      setSelectedState(currentState) // Revert selection
    } finally {
      setLoading(false)
    }
  }

  const currentStateIndex = WORKFLOW_STATES.findIndex(s => s.value === currentState)
  const currentStateConfig = WORKFLOW_STATES[currentStateIndex]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Workflow State</h3>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Current State Display */}
      <div
        className="border-2 rounded-lg p-4"
        style={{ borderColor: currentStateConfig?.color || '#6b7280' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{
              backgroundColor: currentStateConfig?.color + '20' || '#e5e7eb',
              color: currentStateConfig?.color || '#6b7280'
            }}
          >
            {currentStateConfig?.icon || '📋'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {currentStateConfig?.label || 'Unknown State'}
            </div>
            <div className="text-sm text-gray-600">
              {currentStateConfig?.description || 'No description'}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center gap-2 min-w-max">
            {WORKFLOW_STATES.map((state, index) => {
              const isActive = state.value === currentState
              const isPassed = index < currentStateIndex
              const isAvailable = true // All states are available for manual selection

              return (
                <div key={state.value} className="flex items-center">
                  <button
                    onClick={() => {
                      setSelectedState(state.value)
                      handleStateChange(state.value)
                    }}
                    disabled={loading}
                    className={`relative flex flex-col items-center p-3 rounded-lg transition-all ${
                      isActive
                        ? 'ring-2 ring-offset-2'
                        : isPassed
                        ? 'opacity-60'
                        : 'hover:bg-gray-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      backgroundColor: isActive ? state.color + '20' : 'transparent',
                      ringColor: isActive ? state.color : 'transparent'
                    }}
                  >
                    {/* State Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1 ${
                        isPassed || isActive ? 'text-white' : ''
                      }`}
                      style={{
                        backgroundColor: isPassed || isActive ? state.color : state.color + '40',
                        color: isPassed || isActive ? 'white' : state.color
                      }}
                    >
                      {state.icon}
                    </div>

                    {/* State Label */}
                    <div className="text-xs font-medium text-center whitespace-nowrap">
                      {state.label}
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </button>

                  {/* Connector */}
                  {index < WORKFLOW_STATES.length - 1 && (
                    <div
                      className="w-8 h-0.5 mx-1"
                      style={{
                        backgroundColor: index < currentStateIndex ? state.color : '#e5e7eb'
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* State Selector (Dropdown) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick State Change
        </label>
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value)
            handleStateChange(e.target.value)
          }}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {WORKFLOW_STATES.map((state) => (
            <option key={state.value} value={state.value}>
              {state.icon} {state.label} - {state.description}
            </option>
          ))}
        </select>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <div className="font-medium mb-1">💡 Workflow Guide</div>
        <ul className="space-y-1 text-xs">
          <li>• Click on any state in the timeline to jump directly to it</li>
          <li>• States can be changed in any order based on clinical needs</li>
          <li>• Changing to &quot;Discharged&quot; will automatically set the discharge date</li>
        </ul>
      </div>
    </div>
  )
}
