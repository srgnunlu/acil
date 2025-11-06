'use client'

import { useState } from 'react'
import { PatientData } from '@/types'
import { AddDataForm } from '../forms/AddDataForm'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface DataTabProps {
  patientId: string
  patientData: PatientData[]
}

export function DataTab({ patientId, patientData }: DataTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('')

  const dataTypes = [
    { id: 'anamnesis', label: 'Anamnez', icon: '📋', description: 'Şikayet, hastalık öyküsü' },
    { id: 'vital_signs', label: 'Vital Bulgular', icon: '❤️', description: 'TA, nabız, ateş, SpO2' },
    { id: 'medications', label: 'İlaçlar', icon: '💊', description: 'Kullandığı ilaçlar' },
    { id: 'history', label: 'Özgeçmiş', icon: '📖', description: 'Geçmiş hastalıklar, ameliyatlar' },
    { id: 'demographics', label: 'Demografik', icon: '👤', description: 'Ek demografik bilgiler' },
  ]

  const getDataByType = (type: string) => {
    return patientData.filter((d) => d.data_type === type)
  }

  return (
    <div className="space-y-6">
      {/* Add Data Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Veri Ekle
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id)
                setShowAddForm(true)
              }}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {type.label}
              </h3>
              <p className="text-sm text-gray-600">{type.description}</p>
              <div className="mt-3 text-sm text-blue-600 font-medium">
                + Ekle
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Data */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Kayıtlı Veriler
        </h2>

        {patientData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz veri eklenmedi
            </h3>
            <p className="text-gray-600">
              Yukarıdaki kartlardan veri eklemeye başlayın
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dataTypes.map((type) => {
              const typeData = getDataByType(type.id)
              if (typeData.length === 0) return null

              return (
                <div
                  key={type.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                    <span className="ml-2 text-sm text-gray-500">
                      ({typeData.length})
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {typeData.map((data) => (
                      <div
                        key={data.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(data.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          {typeof data.content === 'object' ? (
                            <dl className="space-y-2">
                              {Object.entries(data.content as Record<string, any>).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <dt className="font-medium text-gray-700">
                                      {key}:
                                    </dt>
                                    <dd className="text-gray-900 ml-4">
                                      {typeof value === 'object'
                                        ? JSON.stringify(value, null, 2)
                                        : String(value)}
                                    </dd>
                                  </div>
                                )
                              )}
                            </dl>
                          ) : (
                            <p>{String(data.content)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Data Form Modal */}
      {showAddForm && (
        <AddDataForm
          patientId={patientId}
          dataType={selectedType}
          onClose={() => {
            setShowAddForm(false)
            setSelectedType('')
          }}
        />
      )}
    </div>
  )
}
