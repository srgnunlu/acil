'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Patient {
  id: string
  name: string
  age: number | null
  gender: string | null
  status: string
  created_at: string
}

interface PatientListWithBulkProps {
  patients: Patient[]
}

export function PatientListWithBulk({ patients }: PatientListWithBulkProps) {
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const togglePatient = (patientId: string) => {
    const newSelected = new Set(selectedPatients)
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId)
    } else {
      newSelected.add(patientId)
    }
    setSelectedPatients(newSelected)
  }

  const toggleAll = () => {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set())
    } else {
      setSelectedPatients(new Set(patients.map((p) => p.id)))
    }
  }

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedPatients.size === 0) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/patients/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientIds: Array.from(selectedPatients),
          action,
          value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'İşlem başarısız')
      }

      const data = await response.json()
      setSuccess(data.message)
      setSelectedPatients(new Set())

      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      discharged: 'bg-gray-100 text-gray-800',
      consultation: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      active: 'Aktif',
      discharged: 'Taburcu',
      consultation: 'Konsültasyon',
    }
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selectedPatients.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedPatients.size} hasta seçildi
              </span>
              <button
                onClick={() => setSelectedPatients(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Seçimi Temizle
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Aktif Et
              </button>
              <button
                onClick={() => handleBulkAction('set_consultation')}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
              >
                Konsültasyona Gönder
              </button>
              <button
                onClick={() => handleBulkAction('discharge')}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                Taburcu Et
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-2 text-sm text-blue-700">İşlem yapılıyor...</div>
          )}

          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}

          {success && (
            <div className="mt-2 text-sm text-green-600">{success}</div>
          )}
        </div>
      )}

      {/* Select All Checkbox */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="checkbox"
          id="select-all"
          checked={selectedPatients.size === patients.length && patients.length > 0}
          onChange={toggleAll}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
          Tümünü Seç
        </label>
      </div>

      {/* Patient List */}
      <div className="grid gap-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedPatients.has(patient.id)}
                onChange={() => togglePatient(patient.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />

              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="flex-1 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {patient.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {patient.age && <span>{patient.age} yaş</span>}
                    {patient.gender && <span>• {patient.gender}</span>}
                    <span>
                      • {new Date(patient.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
                <div>{getStatusBadge(patient.status)}</div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
