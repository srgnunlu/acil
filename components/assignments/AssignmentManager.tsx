'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Assignment {
  id: string
  assignment_type: 'primary' | 'secondary' | 'consultant' | 'nurse' | 'observer'
  user_id: string
  assigned_at: string
  notes?: string
  assigned_user?: {
    id: string
    full_name: string
    specialty?: string
  }
  assigned_by_user?: {
    id: string
    full_name: string
  }
}

interface WorkspaceMember {
  id: string
  user_id: string
  role: string
  profiles: {
    id: string
    full_name: string
    specialty?: string
  }
}

interface AssignmentManagerProps {
  patientId: string
  workspaceId: string
}

const ASSIGNMENT_TYPES = [
  { value: 'primary', label: 'Primary Doctor', color: 'blue', icon: '👨‍⚕️' },
  { value: 'secondary', label: 'Secondary Doctor', color: 'green', icon: '🩺' },
  { value: 'consultant', label: 'Consultant', color: 'purple', icon: '💼' },
  { value: 'nurse', label: 'Nurse', color: 'pink', icon: '👩‍⚕️' },
  { value: 'observer', label: 'Observer', color: 'gray', icon: '👁️' },
]

export default function AssignmentManager({ patientId, workspaceId }: AssignmentManagerProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    assignment_type: 'secondary' as Assignment['assignment_type'],
    notes: '',
  })

  useEffect(() => {
    fetchAssignments()
    fetchWorkspaceMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?patient_id=${patientId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }

      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`)

      if (response.ok) {
        const data = await response.json()
        // API returns { success: true, members: [...] }
        const members = data.members || []
        // Map to expected format with profiles
        setWorkspaceMembers(
          members.map(
            (m: {
              id: string
              user_id: string
              role: string
              profile?: { id: string; full_name: string; specialty?: string | null }
            }) => ({
              id: m.id,
              user_id: m.user_id,
              role: m.role,
              profiles: m.profile || { id: m.user_id, full_name: 'Unknown', specialty: null },
            })
          )
        )
      }
    } catch (err) {
      console.error('Failed to fetch workspace members:', err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assignment')
      }

      // Reset form and refresh list
      setFormData({
        user_id: '',
        assignment_type: 'secondary',
        notes: '',
      })
      setIsAdding(false)
      await fetchAssignments()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove assignment')
      }

      await fetchAssignments()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment')
    }
  }

  const getTypeConfig = (type: string) => {
    return ASSIGNMENT_TYPES.find((t) => t.value === type) || ASSIGNMENT_TYPES[0]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Patient Assignments</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Assign'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Assignment Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
              <select
                required
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select a user...</option>
                {workspaceMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.profiles?.full_name || 'Unknown'}{' '}
                    {member.profiles?.specialty ? `(${member.profiles.specialty})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Type *
              </label>
              <select
                required
                value={formData.assignment_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assignment_type: e.target.value as Assignment['assignment_type'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {ASSIGNMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
              placeholder="Optional notes about this assignment"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign
            </button>
          </div>
        </form>
      )}

      {/* Assignments List */}
      <div className="space-y-2">
        {assignments.map((assignment) => {
          const typeConfig = getTypeConfig(assignment.assignment_type)
          const colorClasses =
            {
              blue: 'bg-blue-50 text-blue-700 border-blue-200',
              green: 'bg-green-50 text-green-700 border-green-200',
              purple: 'bg-purple-50 text-purple-700 border-purple-200',
              pink: 'bg-pink-50 text-pink-700 border-pink-200',
              gray: 'bg-gray-50 text-gray-700 border-gray-200',
            }[typeConfig.color] || 'bg-gray-50 text-gray-700 border-gray-200'

          return (
            <div key={assignment.id} className={`border rounded-lg p-3 ${colorClasses}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeConfig.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">
                        {assignment.assigned_user?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-xs opacity-75">
                        {typeConfig.label}
                        {assignment.assigned_user?.specialty &&
                          ` • ${assignment.assigned_user.specialty}`}
                      </div>
                    </div>
                  </div>
                  {assignment.notes && (
                    <p className="text-xs mt-2 opacity-75">{assignment.notes}</p>
                  )}
                  <div className="text-xs opacity-60 mt-1">
                    Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                    {assignment.assigned_by_user && ` by ${assignment.assigned_by_user.full_name}`}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(assignment.id)}
                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}

        {assignments.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No assignments yet. Click &quot;Assign&quot; to add team members to this patient.
          </div>
        )}
      </div>
    </div>
  )
}
