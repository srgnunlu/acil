'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Patient {
  id: string
  full_name: string
  age?: number
  gender?: string
  workflow_state?: string
  admission_date?: string
  discharge_date?: string
  category_id?: string
  assigned_to?: string
  created_at: string
  category?: {
    id: string
    name: string
    color: string
    icon?: string
  }
  assigned_user?: {
    id: string
    full_name: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon?: string
  patient_count?: number
}

interface EnhancedPatientListProps {
  workspaceId: string
}

const WORKFLOW_STATES = [
  { value: 'admission', label: 'Admission', color: 'blue', icon: '📝' },
  { value: 'assessment', label: 'Assessment', color: 'yellow', icon: '🔍' },
  { value: 'diagnosis', label: 'Diagnosis', color: 'purple', icon: '💡' },
  { value: 'treatment', label: 'Treatment', color: 'green', icon: '💊' },
  { value: 'observation', label: 'Observation', color: 'cyan', icon: '👁️' },
  { value: 'discharge_planning', label: 'Discharge Planning', color: 'orange', icon: '📋' },
  { value: 'discharged', label: 'Discharged', color: 'gray', icon: '✅' }
]

export default function EnhancedPatientList({ workspaceId }: EnhancedPatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedWorkflowState, setSelectedWorkflowState] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    fetchData()
  }, [workspaceId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch patients
      const patientsResponse = await fetch(`/api/patients?workspace_id=${workspaceId}`)
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        setPatients(patientsData.patients || [])
      }

      // Fetch categories
      const categoriesResponse = await fetch(`/api/categories?workspace_id=${workspaceId}`)
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search patients
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // Category filter
      if (selectedCategoryId !== 'all' && patient.category_id !== selectedCategoryId) {
        return false
      }

      // Workflow state filter
      if (selectedWorkflowState !== 'all' && patient.workflow_state !== selectedWorkflowState) {
        return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = patient.full_name?.toLowerCase().includes(query)
        const categoryMatch = patient.category?.name?.toLowerCase().includes(query)
        return nameMatch || categoryMatch
      }

      return true
    })
  }, [patients, selectedCategoryId, selectedWorkflowState, searchQuery])

  // Calculate category counts
  const categoriesWithCounts = useMemo(() => {
    const counts = new Map<string, number>()
    patients.forEach(patient => {
      if (patient.category_id) {
        counts.set(patient.category_id, (counts.get(patient.category_id) || 0) + 1)
      }
    })

    return categories.map(cat => ({
      ...cat,
      patient_count: counts.get(cat.id) || 0
    }))
  }, [categories, patients])

  const getWorkflowConfig = (state?: string) => {
    return WORKFLOW_STATES.find(s => s.value === state) || WORKFLOW_STATES[0]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search patients by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Workflow Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedWorkflowState('all')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              selectedWorkflowState === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All States ({patients.length})
          </button>
          {WORKFLOW_STATES.map((state) => {
            const count = patients.filter(p => p.workflow_state === state.value).length
            return (
              <button
                key={state.value}
                onClick={() => setSelectedWorkflowState(state.value)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  selectedWorkflowState === state.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {state.icon} {state.label} ({count})
              </button>
            )
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔲 Grid
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories ({patients.length})
          </button>
          {categoriesWithCounts.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategoryId === category.id
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: selectedCategoryId === category.id ? category.color : category.color + '20',
                color: selectedCategoryId === category.id ? 'white' : category.color
              }}
            >
              {category.icon} {category.name} ({category.patient_count})
            </button>
          ))}
        </div>
      </div>

      {/* Patients Display */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredPatients.map((patient) => {
            const workflowConfig = getWorkflowConfig(patient.workflow_state)
            return (
              <Link
                key={patient.id}
                href={`/dashboard/patients/${patient.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Category Indicator */}
                    {patient.category && (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{
                          backgroundColor: patient.category.color + '20',
                          color: patient.category.color
                        }}
                      >
                        {patient.category.icon || '📋'}
                      </div>
                    )}

                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{patient.full_name}</h3>
                        {patient.age && (
                          <span className="text-sm text-gray-500">({patient.age}y, {patient.gender})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        {/* Category */}
                        {patient.category && (
                          <span
                            className="px-2 py-0.5 text-xs rounded"
                            style={{
                              backgroundColor: patient.category.color + '20',
                              color: patient.category.color
                            }}
                          >
                            {patient.category.name}
                          </span>
                        )}

                        {/* Workflow State */}
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                          {workflowConfig.icon} {workflowConfig.label}
                        </span>

                        {/* Assigned Doctor */}
                        {patient.assigned_user && (
                          <span className="text-xs text-gray-500">
                            👨‍⚕️ {patient.assigned_user.full_name}
                          </span>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {patient.admission_date && (
                          <span>Admitted: {new Date(patient.admission_date).toLocaleDateString()}</span>
                        )}
                        {patient.discharge_date && (
                          <span>Discharged: {new Date(patient.discharge_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400">
                    →
                  </div>
                </div>
              </Link>
            )
          })}

          {filteredPatients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No patients found matching your filters.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const workflowConfig = getWorkflowConfig(patient.workflow_state)
            return (
              <Link
                key={patient.id}
                href={`/dashboard/patients/${patient.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Category Header */}
                {patient.category && (
                  <div
                    className="flex items-center gap-2 mb-3 pb-3 border-b"
                    style={{ borderColor: patient.category.color + '40' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: patient.category.color + '20',
                        color: patient.category.color
                      }}
                    >
                      {patient.category.icon || '📋'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{patient.full_name}</div>
                      <div className="text-xs text-gray-500">
                        {patient.age}y, {patient.gender}
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span
                      className="px-2 py-0.5 text-xs rounded"
                      style={{
                        backgroundColor: patient.category?.color + '20' || '#e5e7eb',
                        color: patient.category?.color || '#6b7280'
                      }}
                    >
                      {patient.category?.name || 'None'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">State:</span>
                    <span className="text-xs">
                      {workflowConfig.icon} {workflowConfig.label}
                    </span>
                  </div>

                  {patient.assigned_user && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Doctor:</span>
                      <span className="text-xs">{patient.assigned_user.full_name}</span>
                    </div>
                  )}

                  {patient.admission_date && (
                    <div className="text-xs text-gray-500">
                      Admitted: {new Date(patient.admission_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}

          {filteredPatients.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No patients found matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
