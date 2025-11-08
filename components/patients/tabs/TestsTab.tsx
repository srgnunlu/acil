'use client'

import { useState } from 'react'
import { PatientTest } from '@/types'
import { AddTestForm } from '../forms/AddTestForm'
import { AddLesionImageForm } from '../forms/AddLesionImageForm'
import { LesionImageCard } from '../display/LesionImageCard'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TestsTabProps {
  patientId: string
  tests: PatientTest[]
}

export function TestsTab({ patientId, tests }: TestsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTestType, setSelectedTestType] = useState('')

  const testTypes = [
    { id: 'lesion_image', label: 'Lezyon Görseli', icon: '🔍', description: 'Deri lezyonu analizi', special: true },
    { id: 'laboratory', label: 'Laboratuvar', icon: '🧪', description: 'Kan, idrar, biyokimya' },
    { id: 'ekg', label: 'EKG', icon: '❤️', description: 'Elektrokardiyografi' },
    { id: 'xray', label: 'Radyoloji', icon: '🔬', description: 'Grafi, BT, MR, USG' },
    { id: 'consultation', label: 'Konsültasyon', icon: '👨‍⚕️', description: 'Branş konsültasyonu' },
    { id: 'other', label: 'Diğer', icon: '📄', description: 'Diğer tetkikler' },
  ]

  const getTestsByType = (type: string) => {
    return tests.filter((t) => t.test_type === type)
  }

  return (
    <div className="space-y-6">
      {/* Add Test Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tetkik Ekle
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedTestType(type.id)
                setShowAddForm(true)
              }}
              className={`border-2 rounded-xl p-6 hover:shadow-lg transition-all text-left ${
                type.special
                  ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300 hover:border-purple-500'
                  : 'bg-white border-gray-200 hover:border-blue-500'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {type.label}
                {type.special && (
                  <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    AI
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">{type.description}</p>
              <div className={`mt-3 text-sm font-medium ${type.special ? 'text-purple-600' : 'text-blue-600'}`}>
                + Ekle
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Tests */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tetkik Sonuçları
        </h2>

        {tests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz tetkik eklenmedi
            </h3>
            <p className="text-gray-600">
              Yukarıdaki kartlardan tetkik sonucu eklemeye başlayın
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {testTypes.map((type) => {
              const typeTests = getTestsByType(type.id)
              if (typeTests.length === 0) return null

              // Special display for lesion images
              if (type.id === 'lesion_image') {
                return (
                  <div key={type.id} className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-xl flex items-center">
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                      <span className="ml-2 text-sm text-gray-500">
                        ({typeTests.length})
                      </span>
                    </h3>
                    {typeTests.map((test) => (
                      <LesionImageCard key={test.id} test={test} />
                    ))}
                  </div>
                )
              }

              // Regular display for other test types
              return (
                <div
                  key={type.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                    <span className="ml-2 text-sm text-gray-500">
                      ({typeTests.length})
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {typeTests.map((test) => (
                      <div
                        key={test.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(test.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>

                        {/* Test Results */}
                        <div className="space-y-2">
                          {typeof test.results === 'object' ? (
                            <dl className="space-y-2">
                              {Object.entries(test.results as Record<string, any>).map(
                                ([key, value]) => (
                                  <div key={key} className="flex justify-between border-b border-gray-100 pb-1">
                                    <dt className="font-medium text-gray-700">
                                      {key}:
                                    </dt>
                                    <dd className="text-gray-900">
                                      {typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </dd>
                                  </div>
                                )
                              )}
                            </dl>
                          ) : (
                            <p className="text-gray-900">{String(test.results)}</p>
                          )}
                        </div>

                        {/* Images */}
                        {test.images && test.images.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Görüntüler ({test.images.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {test.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="w-20 h-20 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-500"
                                >
                                  🖼️ {idx + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
    </div>
  )
}
