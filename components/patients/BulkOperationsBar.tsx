'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface WorkspaceMember {
  user_id: string
  profiles: {
    full_name: string
    specialty?: string
  }
}

interface BulkOperationsBarProps {
  selectedPatientIds: string[]
  workspaceId: string
  onClearSelection: () => void
}

const WORKFLOW_STATES = [
  { value: 'admission', label: 'Admission', icon: '📝' },
  { value: 'assessment', label: 'Assessment', icon: '🔍' },
  { value: 'diagnosis', label: 'Diagnosis', icon: '💡' },
  { value: 'treatment', label: 'Treatment', icon: '💊' },
  { value: 'observation', label: 'Observation', icon: '👁️' },
  { value: 'discharge_planning', label: 'Discharge Planning', icon: '📋' },
  { value: 'discharged', label: 'Discharged', icon: '✅' }
]

const ASSIGNMENT_TYPES = [
  { value: 'primary', label: 'Primary Doctor', icon: '👨‍⚕️' },
  { value: 'secondary', label: 'Secondary Doctor', icon: '🩺' },
  { value: 'consultant', label: 'Consultant', icon: '💼' },
  { value: 'nurse', label: 'Nurse', icon: '👩‍⚕️' }
]

export default function BulkOperationsBar({
  selectedPatientIds,
  workspaceId,
  onClearSelection
}: BulkOperationsBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [showOperations, setShowOperations] = useState(false)

  useEffect(() => {
    if (selectedPatientIds.length > 0) {
      fetchCategories()
      fetchMembers()
    }
  }, [selectedPatientIds.length > 0])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?workspace_id=${workspaceId}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/workspace/members?workspace_id=${workspaceId}`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }

  const handleBulkOperation = async (operation: string, data: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/patients/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_ids: selectedPatientIds,
          operation,
          data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Bulk operation failed')
      }

      const result = await response.json()
      setSuccess(result.message)
      setTimeout(() => {
        router.refresh()
        onClearSelection()
        setShowOperations(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk operation')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    if (confirm(`Change category for ${selectedPatientIds.length} patient(s)?`)) {
      handleBulkOperation('update_category', { category_id: categoryId })
    }
  }

  const handleWorkflowChange = (workflowState: string) => {
    if (confirm(`Change workflow state for ${selectedPatientIds.length} patient(s)?`)) {
      handleBulkOperation('update_workflow', { workflow_state: workflowState })
    }
  }

  const handleAssignDoctor = (doctorId: string, assignmentType: string) => {
    if (confirm(`Assign doctor to ${selectedPatientIds.length} patient(s)?`)) {
      handleBulkOperation('assign_doctor', {
        doctor_id: doctorId,
        assignment_type: assignmentType
      })
    }
  }

  if (selectedPatientIds.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
              {selectedPatientIds.length} Patient{selectedPatientIds.length > 1 ? 's' : ''} Selected
            </div>
            <button
              onClick={() => setShowOperations(!showOperations)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showOperations ? '▼ Hide Operations' : '▶ Show Operations'}
            </button>
          </div>

          <button
            onClick={onClearSelection}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕ Clear Selection
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm">
            {success}
          </div>
        )}

        {/* Operations Panel */}
        {showOperations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Change Category */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Category
              </label>
              <select
                onChange={(e) => e.target.value && handleCategoryChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Change Workflow State */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Workflow State
              </label>
              <select
                onChange={(e) => e.target.value && handleWorkflowChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select state...</option>
                {WORKFLOW_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.icon} {state.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign Doctor */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Doctor
              </label>
              <div className="space-y-2">
                <select
                  id="bulk-doctor"
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Select doctor...</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profiles?.full_name || 'Unknown'} {member.profiles?.specialty ? `(${member.profiles.specialty})` : ''}
                    </option>
                  ))}
                </select>
                <select
                  id="bulk-assignment-type"
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {ASSIGNMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const doctorSelect = document.getElementById('bulk-doctor') as HTMLSelectElement
                    const typeSelect = document.getElementById('bulk-assignment-type') as HTMLSelectElement
                    if (doctorSelect.value && typeSelect.value) {
                      handleAssignDoctor(doctorSelect.value, typeSelect.value)
                    }
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
