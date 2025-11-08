'use client'

import { useState, useMemo } from 'react'
import { PatientTest } from '@/types'
import { AddTestForm } from '../forms/AddTestForm'
import { AddLesionImageForm } from '../forms/AddLesionImageForm'
import { AddEKGForm } from '../forms/AddEKGForm'
import { EditTestForm } from '../forms/EditTestForm'
import { LesionImageCard } from '../display/LesionImageCard'
import { EKGCard } from '../display/EKGCard'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TestsTabProps {
  patientId: string
  tests: PatientTest[]
}

type SortOption = 'newest' | 'oldest' | 'type'

export function TestsTab({ patientId, tests }: TestsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTestType, setSelectedTestType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const [editingTest, setEditingTest] = useState<PatientTest | null>(null)
  const [deletingTest, setDeletingTest] = useState<string | null>(null)
  const router = useRouter()

  const testTypes: Array<{
    id: string
    label: string
    icon: string
    description: string
    color: string
    special?: boolean
  }> = [
    {
      id: 'lesion_image',
      label: 'Lezyon Görseli',
      icon: '🔍',
      description: 'Deri lezyonu analizi',
      color:
        'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 hover:border-purple-500',
      special: true,
    },
    {
      id: 'laboratory',
      label: 'Laboratuvar',
      icon: '🧪',
      description: 'Kan, idrar, biyokimya',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-500',
    },
    {
      id: 'ekg',
      label: 'EKG',
      icon: '❤️',
      description: 'Elektrokardiyografi',
      color: 'bg-red-50 border-red-200 hover:border-red-500',
    },
    {
      id: 'xray',
      label: 'Radyoloji',
      icon: '🔬',
      description: 'Grafi, BT, MR, USG',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-500',
    },
    {
      id: 'consultation',
      label: 'Konsültasyon',
      icon: '👨‍⚕️',
      description: 'Branş konsültasyonu',
      color: 'bg-green-50 border-green-200 hover:border-green-500',
    },
    {
      id: 'other',
      label: 'Diğer',
      icon: '📄',
      description: 'Diğer tetkikler',
      color: 'bg-gray-50 border-gray-200 hover:border-gray-500',
    },
  ]

  // Laboratuvar referans aralıkları
  const labReferenceRanges: Record<string, { min: number; max: number; unit: string }> = {
    hemoglobin: { min: 12, max: 16, unit: 'g/dL' },
    wbc: { min: 4, max: 10, unit: '10³/µL' },
    platelet: { min: 150, max: 400, unit: '10³/µL' },
    glucose: { min: 70, max: 100, unit: 'mg/dL' },
    creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL' },
    sodium: { min: 135, max: 145, unit: 'mEq/L' },
    potassium: { min: 3.5, max: 5, unit: 'mEq/L' },
    alt: { min: 0, max: 40, unit: 'U/L' },
    ast: { min: 0, max: 40, unit: 'U/L' },
    d_dimer: { min: 0, max: 0.5, unit: 'ng/mL' },
    crp: { min: 0, max: 5, unit: 'mg/L' },
  }

  const getValueStatus = (key: string, value: unknown) => {
    if (typeof value !== 'number' && typeof value !== 'string') return 'normal'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return 'normal'

    const range = labReferenceRanges[key]
    if (!range) return 'normal'

    if (numValue < range.min) return 'low'
    if (numValue > range.max) return 'high'
    return 'normal'
  }

  // Other alanındaki yazı formatını ayrıştır (Key: Value format)
  const parseOtherField = (otherText: string): Record<string, string> => {
    const parsed: Record<string, string> = {}
    if (!otherText) return parsed

    const lines = otherText.split('\n').filter((line) => line.trim())
    lines.forEach((line) => {
      const [key, value] = line.split(':').map((s) => s.trim())
      if (key && value) {
        parsed[key] = value
      }
    })

    return parsed
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-green-700 bg-green-50 border-green-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low':
        return '↓'
      case 'high':
        return '↑'
      default:
        return '✓'
    }
  }

  const filteredAndSortedTests = useMemo(() => {
    let filtered = [...tests]

    // Filtre: Tip
    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.test_type === filterType)
    }

    // Filtre: Arama
    if (searchQuery.trim()) {
      filtered = filtered.filter((test) => {
        const searchLower = searchQuery.toLowerCase()
        const typeLabel = testTypes.find((t) => t.id === test.test_type)?.label || ''
        const resultsString = JSON.stringify(test.results).toLowerCase()
        return typeLabel.toLowerCase().includes(searchLower) || resultsString.includes(searchLower)
      })
    }

    // Sıralama
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'type':
          return a.test_type.localeCompare(b.test_type)
        default:
          return 0
      }
    })

    return filtered
  }, [tests, filterType, searchQuery, sortBy])

  const toggleExpand = (testId: string) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  const handleDelete = async (testId: string) => {
    if (!confirm('Bu tetkik sonucunu silmek istediğinizden emin misiniz?')) {
      return
    }

    setDeletingTest(testId)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('patient_tests').delete().eq('id', testId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Tetkik silinirken hata:', error)
      alert('Tetkik silinirken bir hata oluştu')
    } finally {
      setDeletingTest(null)
    }
  }

  const handleExport = () => {
    const exportData = filteredAndSortedTests.map((test) => ({
      Tip: testTypes.find((t) => t.id === test.test_type)?.label,
      Tarih: format(new Date(test.created_at), 'dd.MM.yyyy HH:mm', { locale: tr }),
      Sonuçlar: JSON.stringify(test.results, null, 2),
    }))

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tetkikler-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
  }

  return (
    <div className="space-y-4">
      {/* Compact Test Type Cards - Single Row */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">📋</span>
          Tetkik Ekle
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {testTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedTestType(type.id)
                setShowAddForm(true)
              }}
              className={`${type.color} border-2 rounded-lg p-2.5 hover:shadow-md transition-all text-center group relative`}
              title={type.description}
            >
              <div className="text-xl mb-1">{type.icon}</div>
              <h3 className="font-semibold text-gray-900 text-xs leading-tight">{type.label}</h3>
              {type.special && (
                <span className="absolute -top-1 -right-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                  AI
                </span>
              )}
              <div className="text-xs font-medium text-blue-600 group-hover:text-blue-700 mt-1">
                + Ekle
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Tetkik ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div className="min-w-[180px]">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Tümü ({tests.length})</option>
              {testTypes.map((type) => {
                const count = tests.filter((t) => t.test_type === type.id).length
                return (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          {/* Sort */}
          <div className="min-w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="type">Tetkik Tipine Göre</option>
            </select>
          </div>

          {/* Export Button */}
          {filteredAndSortedTests.length > 0 && (
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition shadow-sm flex items-center gap-1"
              title="Tetkikleri dışa aktar"
            >
              📥 Dışa Aktar
            </button>
          )}
        </div>
      </div>

      {/* Existing Tests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📊</span>
            Tetkik Sonuçları
            <span className="ml-3 text-sm font-normal text-gray-500">
              ({filteredAndSortedTests.length})
            </span>
          </h2>
        </div>

        {filteredAndSortedTests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tests.length === 0
                ? 'Henüz tetkik eklenmedi'
                : 'Arama kriterine uygun tetkik bulunamadı'}
            </h3>
            <p className="text-gray-600">
              {tests.length === 0
                ? 'Yukarıdaki kartlardan tetkik sonucu eklemeye başlayın'
                : 'Farklı bir arama terimi veya filtre deneyin'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTests.map((test) => {
              const typeInfo = testTypes.find((t) => t.id === test.test_type)
              const isExpanded = expandedTests.has(test.id)
              const isDeleting = deletingTest === test.id

              // Special display for lesion images
              if (test.test_type === 'lesion_image') {
                return <LesionImageCard key={test.id} test={test} />
              }

              // Special display for EKG
              if (test.test_type === 'ekg') {
                return <EKGCard key={test.id} test={test} />
              }

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Test Header */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl">{typeInfo?.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            {typeInfo?.label}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {format(new Date(test.created_at), 'dd MMM yyyy, HH:mm', {
                                locale: tr,
                              })}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(test.created_at), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingTest(test)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Düzenle"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(test.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Sil"
                        >
                          {isDeleting ? '⏳' : '🗑️'}
                        </button>
                        <button
                          onClick={() => toggleExpand(test.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                          title={isExpanded ? 'Daralt' : 'Genişlet'}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Test Results - Collapsible */}
                  {isExpanded && (
                    <div className="p-4">
                      {typeof test.results === 'object' ? (
                        <div className="space-y-3">
                          {/* Normal lab sonuçlarını önce göster */}
                          {Object.entries(test.results as Record<string, unknown>)
                            .filter(([key]) => key !== 'other')
                            .map(([key, value]) => {
                              const status =
                                test.test_type === 'laboratory'
                                  ? getValueStatus(key, value)
                                  : 'normal'
                              const statusColor = getStatusColor(status)
                              const statusIcon = getStatusIcon(status)
                              const range = labReferenceRanges[key]

                              return (
                                <div
                                  key={key}
                                  className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                                >
                                  <div className="flex-1">
                                    <dt className="font-medium text-gray-700 text-sm">
                                      {key
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </dt>
                                    {range && (
                                      <dd className="text-xs text-gray-500 mt-1">
                                        Normal: {range.min} - {range.max} {range.unit}
                                      </dd>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <dd className="text-gray-900 font-semibold">
                                      {typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </dd>
                                    {test.test_type === 'laboratory' && status !== 'normal' && (
                                      <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium border ${statusColor}`}
                                        title={status === 'low' ? 'Düşük' : 'Yüksek'}
                                      >
                                        {statusIcon}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}

                          {/* "Other" alanını en sonda göster */}
                          {(() => {
                            const otherValue = (test.results as Record<string, unknown>)['other']
                            if (
                              otherValue &&
                              typeof otherValue === 'string' &&
                              test.test_type === 'laboratory'
                            ) {
                              const otherFields = parseOtherField(otherValue)

                              // Eğer "other" alanında ayrıştırılmış veriler varsa, bunları göster
                              if (Object.keys(otherFields).length > 0) {
                                return (
                                  <div className="border-t border-gray-200 pt-4 mt-4">
                                    <div className="mb-3">
                                      <h4 className="font-semibold text-gray-800 text-sm flex items-center">
                                        <span className="mr-2">📋</span>
                                        Diğer Test Sonuçları
                                      </h4>
                                    </div>
                                    <div className="space-y-2">
                                      {Object.entries(otherFields).map(([otherKey, otherVal]) => (
                                        <div
                                          key={otherKey}
                                          className="flex justify-between items-center py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                                        >
                                          <div className="flex-1">
                                            <dt className="font-medium text-gray-700 text-sm">
                                              {otherKey}
                                            </dt>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <dd className="text-gray-900 font-semibold text-sm">
                                              {otherVal}
                                            </dd>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              }

                              // Ayrıştırılmayan raw metin varsa düz göster
                              if (String(otherValue).trim()) {
                                return (
                                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 border-t-2 mt-4">
                                    <dt className="font-medium text-gray-700 text-sm mb-2">
                                      Diğer Sonuçlar
                                    </dt>
                                    <dd className="text-gray-600 text-sm whitespace-pre-wrap">
                                      {otherValue}
                                    </dd>
                                  </div>
                                )
                              }
                            }

                            return null
                          })()}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {String(test.results)}
                          </p>
                        </div>
                      )}

                      {/* Images */}
                      {test.images && test.images.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Görüntüler ({test.images.length})
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {test.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="aspect-square bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-200 transition cursor-pointer"
                                title={`Görüntü ${idx + 1}`}
                              >
                                🖼️
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compact Preview when collapsed */}
                  {!isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {typeof test.results === 'object'
                          ? `${Object.keys(test.results as Record<string, unknown>).length} sonuç parametresi`
                          : String(test.results).substring(0, 100)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Test Form Modal */}
      {showAddForm && (
        <>
          {selectedTestType === 'lesion_image' ? (
            <AddLesionImageForm
              patientId={patientId}
              onClose={() => {
                setShowAddForm(false)
                setSelectedTestType('')
              }}
            />
          ) : selectedTestType === 'ekg' ? (
            <AddEKGForm
              patientId={patientId}
              onClose={() => {
                setShowAddForm(false)
                setSelectedTestType('')
              }}
            />
          ) : (
            <AddTestForm
              patientId={patientId}
              testType={selectedTestType}
              onClose={() => {
                setShowAddForm(false)
                setSelectedTestType('')
              }}
            />
          )}
        </>
      )}

      {/* Edit Test Form Modal */}
      {editingTest && <EditTestForm test={editingTest} onClose={() => setEditingTest(null)} />}
    </div>
  )
}
