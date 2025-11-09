'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, UserCheck } from 'lucide-react'
import { PatientSearch, FilterOptions } from './PatientSearch'
import { useToast } from '@/components/ui/Toast'

interface Patient {
  id: string
  name: string
  age: number | null
  gender: string | null
  status?: string
  created_at: string
}

interface PatientListWithBulkProps {
  patients: Patient[]
}

export function PatientListWithBulk({ patients }: PatientListWithBulkProps) {
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: [],
    gender: [],
    ageRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const { showToast } = useToast()

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

  // Filtrelenmiş ve sıralanmış hastalar
  const filteredPatients = useMemo(() => {
    let result = [...patients]

    // Arama filtresi
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.age?.toString().includes(searchLower) ||
          p.gender?.toLowerCase().includes(searchLower)
      )
    }

    // Durum filtresi
    if (filters.status.length > 0) {
      result = result.filter((p) => p.status && filters.status.includes(p.status))
    }

    // Cinsiyet filtresi
    if (filters.gender.length > 0) {
      result = result.filter((p) => p.gender && filters.gender.includes(p.gender))
    }

    // Yaş aralığı filtresi
    if (filters.ageRange !== 'all' && filters.ageRange) {
      result = result.filter((p) => {
        if (!p.age) return false
        if (filters.ageRange === '0-18') return p.age <= 18
        if (filters.ageRange === '19-40') return p.age >= 19 && p.age <= 40
        if (filters.ageRange === '41-65') return p.age >= 41 && p.age <= 65
        if (filters.ageRange === '65+') return p.age > 65
        return true
      })
    }

    // Sıralama
    result.sort((a, b) => {
      let comparison = 0
      if (filters.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (filters.sortBy === 'age') {
        comparison = (a.age || 0) - (b.age || 0)
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [patients, filters])

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedPatients.size === 0) return

    setLoading(true)

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
      showToast(data.message, 'success')
      setSelectedPatients(new Set())

      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'İşlem başarısız'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    const badges = {
      active: 'bg-green-500 text-white',
      discharged: 'bg-gray-500 text-white',
      consultation: 'bg-yellow-500 text-white',
      default: 'bg-gray-400 text-white',
    }
    const labels = {
      active: 'Aktif',
      discharged: 'Taburcu',
      consultation: 'Konsültasyon',
      default: 'Bilinmiyor',
    }
    const icons = {
      active: <CheckCircle2 className="w-3 h-3" />,
      discharged: <UserCheck className="w-3 h-3" />,
      consultation: <Clock className="w-3 h-3" />,
      default: null,
    }
    const key = (status || 'default') as keyof typeof badges
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
          badges[key]
        }`}
      >
        {icons[key]}
        {labels[key]}
      </span>
    )
  }

  return (
    <div>
      {/* Arama ve Filtreleme */}
      <PatientSearch onFilterChange={setFilters} />

      {/* Bulk Actions Bar */}
      {selectedPatients.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in slide-in-from-top-5 fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedPatients.size} hasta seçildi
              </span>
              <button
                onClick={() => setSelectedPatients(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Seçimi Temizle
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Seçili hastaları aktif et"
              >
                Aktif Et
              </button>
              <button
                onClick={() => handleBulkAction('set_consultation')}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Seçili hastaları konsültasyona gönder"
              >
                Konsültasyona Gönder
              </button>
              <button
                onClick={() => handleBulkAction('discharge')}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Seçili hastaları taburcu et"
              >
                Taburcu Et
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-2 text-sm text-blue-700 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
              İşlem yapılıyor...
            </div>
          )}
        </div>
      )}

      {/* Select All Checkbox */}
      {filteredPatients.length > 0 && (
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="select-all"
            checked={
              selectedPatients.size === filteredPatients.length && filteredPatients.length > 0
            }
            onChange={toggleAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
            aria-label="Tümünü seç"
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            Tümünü Seç ({filteredPatients.length} hasta)
          </label>
        </div>
      )}

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Hasta bulunamadı</h3>
          <p className="text-gray-600 mb-6">
            Arama kriterlerinize uygun hasta bulunamadı. Farklı filtreler deneyin.
          </p>
          <button
            onClick={() =>
              setFilters({
                search: '',
                status: [],
                gender: [],
                ageRange: 'all',
                sortBy: 'created_at',
                sortOrder: 'desc',
              })
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}

      {/* Patient List */}
      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              selectedPatients.has(patient.id)
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedPatients.has(patient.id)}
                onChange={() => togglePatient(patient.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition-transform hover:scale-110"
                aria-label={`${patient.name} seç`}
              />

              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="flex-1 flex flex-col sm:flex-row justify-between items-start gap-4 group"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {patient.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    {patient.age && (
                      <span className="flex items-center gap-1">{patient.age} yaş</span>
                    )}
                    {patient.gender && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">•</span> {patient.gender}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">•</span>
                      {new Date(patient.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">{getStatusBadge(patient.status)}</div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
