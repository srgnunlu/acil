'use client'

import { useState } from 'react'
import { PatientData } from '@/types'
import { AddDataForm } from '../forms/AddDataForm'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DataTabProps {
  patientId: string
  patientData: PatientData[]
}

export function DataTab({ patientId, patientData }: DataTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingData, setEditingData] = useState<PatientData | null>(null)
  const router = useRouter()

  const dataTypes = [
    { id: 'anamnesis', label: 'Anamnez', icon: '📋', description: 'Şikayet, hastalık öyküsü', color: 'blue' },
    { id: 'vital_signs', label: 'Vital Bulgular', icon: '❤️', description: 'TA, nabız, ateş, SpO2', color: 'red' },
    { id: 'medications', label: 'İlaçlar', icon: '💊', description: 'Kullandığı ilaçlar', color: 'purple' },
    { id: 'history', label: 'Özgeçmiş', icon: '📖', description: 'Geçmiş hastalıklar, ameliyatlar', color: 'green' },
    { id: 'demographics', label: 'Demografik', icon: '👤', description: 'Ek demografik bilgiler', color: 'gray' },
  ]

  const handleDelete = async (dataId: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('patient_data').delete().eq('id', dataId)

      if (error) throw error

      router.refresh()
    } catch (err: any) {
      alert('Silme işlemi başarısız: ' + err.message)
    }
  }

  // Field label çevirileri
  const fieldLabels: Record<string, string> = {
    chief_complaint: 'Ana Şikayet',
    history_present_illness: 'Şikayet Öyküsü',
    duration: 'Süre',
    severity: 'Şiddet',
    associated_symptoms: 'Eşlik Eden Semptomlar',
    aggravating_factors: 'Kötüleştiren Faktörler',
    relieving_factors: 'Rahatlatıcı Faktörler',
    blood_pressure: 'Tansiyon',
    heart_rate: 'Nabız',
    respiratory_rate: 'Solunum',
    temperature: 'Ateş',
    spo2: 'SpO2',
    gcs: 'GCS',
    pain_score: 'Ağrı',
    medication_name: 'İlaç',
    dose: 'Doz',
    frequency: 'Sıklık',
    indication: 'Kullanım Amacı',
    compliance: 'Uyum',
    past_medical_history: 'Geçmiş Hastalıklar',
    past_surgical_history: 'Geçmiş Ameliyatlar',
    allergies: 'Alerjiler',
    family_history: 'Aile Öyküsü',
    social_history: 'Sosyal Öykü',
    immunization: 'Aşılama',
    occupation: 'Meslek',
    marital_status: 'Medeni Hal',
    education: 'Eğitim',
    insurance: 'Sigorta',
    blood_type: 'Kan Grubu',
    contact_number: 'Telefon',
    emergency_contact: 'Acil İletişim',
  }

  // Vital bulgular için özel render
  const renderVitalSigns = (content: Record<string, any>) => {
    const vitals = [
      { key: 'blood_pressure', icon: '💗', unit: '', color: 'text-red-600' },
      { key: 'heart_rate', icon: '❤️', unit: '/dk', color: 'text-pink-600' },
      { key: 'temperature', icon: '🌡️', unit: '°C', color: 'text-orange-600' },
      { key: 'respiratory_rate', icon: '💨', unit: '/dk', color: 'text-blue-600' },
      { key: 'spo2', icon: '💧', unit: '%', color: 'text-cyan-600' },
      { key: 'gcs', icon: '🧠', unit: '', color: 'text-purple-600' },
      { key: 'pain_score', icon: '😣', unit: '/10', color: 'text-yellow-600' },
    ]

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {vitals.map(({ key, icon, unit, color }) => {
          if (!content[key]) return null
          return (
            <div key={key} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-gray-500 font-medium">{fieldLabels[key]}</span>
              </div>
              <div className={`text-2xl font-bold ${color}`}>
                {content[key]}{unit}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // İlaçlar için tablo render
  const renderMedications = (content: Record<string, any>) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <div className="flex-1">
            <span className="font-bold text-gray-900 text-lg">💊 {content.medication_name}</span>
          </div>
          {content.compliance && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              content.compliance === 'İyi' ? 'bg-green-100 text-green-800' :
              content.compliance === 'Orta' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {content.compliance}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-4">
          {content.dose && (
            <div>
              <span className="text-xs text-gray-500">Doz</span>
              <p className="font-semibold text-gray-900">{content.dose}</p>
            </div>
          )}
          {content.frequency && (
            <div>
              <span className="text-xs text-gray-500">Sıklık</span>
              <p className="font-semibold text-gray-900">{content.frequency}</p>
            </div>
          )}
          {content.duration && (
            <div>
              <span className="text-xs text-gray-500">Süre</span>
              <p className="font-semibold text-gray-900">{content.duration}</p>
            </div>
          )}
          {content.indication && (
            <div>
              <span className="text-xs text-gray-500">Amaç</span>
              <p className="font-semibold text-gray-900">{content.indication}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Anamnez için detaylı render
  const renderAnamnesis = (content: Record<string, any>) => {
    return (
      <div className="space-y-4">
        {content.chief_complaint && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <span className="text-xs font-bold text-blue-700 uppercase">Ana Şikayet</span>
            <p className="text-gray-900 font-semibold mt-1">{content.chief_complaint}</p>
          </div>
        )}
        {content.history_present_illness && (
          <div>
            <span className="text-xs font-bold text-gray-600 uppercase">Şikayet Öyküsü</span>
            <p className="text-gray-900 mt-1 leading-relaxed">{content.history_present_illness}</p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {content.duration && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500">Süre</span>
              <p className="font-semibold text-gray-900">{content.duration}</p>
            </div>
          )}
          {content.severity && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500">Şiddet</span>
              <p className="font-semibold text-gray-900">{content.severity}/10</p>
            </div>
          )}
        </div>
        {content.associated_symptoms && (
          <div>
            <span className="text-xs font-bold text-gray-600 uppercase">Eşlik Eden Semptomlar</span>
            <p className="text-gray-900 mt-1">{content.associated_symptoms}</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          {content.aggravating_factors && (
            <div>
              <span className="text-xs font-bold text-red-600 uppercase">❌ Kötüleştiren</span>
              <p className="text-gray-900 mt-1">{content.aggravating_factors}</p>
            </div>
          )}
          {content.relieving_factors && (
            <div>
              <span className="text-xs font-bold text-green-600 uppercase">✅ Rahatlatıcı</span>
              <p className="text-gray-900 mt-1">{content.relieving_factors}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Özgeçmiş için render
  const renderHistory = (content: Record<string, any>) => {
    return (
      <div className="space-y-3">
        {Object.entries(content).map(([key, value]) => {
          if (!value) return null
          return (
            <div key={key} className="border-l-4 border-gray-300 pl-4 py-2">
              <span className="text-xs font-bold text-gray-600 uppercase">{fieldLabels[key]}</span>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{String(value)}</p>
            </div>
          )
        })}
      </div>
    )
  }

  // Demografik için grid render
  const renderDemographics = (content: Record<string, any>) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(content).map(([key, value]) => {
          if (!value) return null
          return (
            <div key={key} className="bg-gray-50 p-4 rounded-lg">
              <span className="text-xs text-gray-500 font-medium">{fieldLabels[key]}</span>
              <p className="font-semibold text-gray-900 mt-1">{String(value)}</p>
            </div>
          )
        })}
      </div>
    )
  }

  // Render fonksiyonunu seç
  const renderContent = (data: PatientData) => {
    const content = data.content as Record<string, any>

    switch (data.data_type) {
      case 'vital_signs':
        return renderVitalSigns(content)
      case 'medications':
        return renderMedications(content)
      case 'anamnesis':
        return renderAnamnesis(content)
      case 'history':
        return renderHistory(content)
      case 'demographics':
        return renderDemographics(content)
      default:
        return (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900">{JSON.stringify(content, null, 2)}</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Kompakt Dropdown Menü */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full md:w-auto flex items-center justify-between space-x-3 bg-white hover:bg-blue-50 border-2 border-blue-300 rounded-lg px-6 py-3 font-semibold text-gray-900 transition-all shadow-sm hover:shadow-md"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Yeni Veri Ekle</span>
            </span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 md:right-auto md:min-w-[320px] mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              {dataTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setShowAddForm(true)
                    setShowDropdown(false)
                  }}
                  className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-2xl mt-0.5">{type.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kayıtlı Veriler - Timeline */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Kayıtlı Veriler
          {patientData.length > 0 && (
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
              {patientData.length}
            </span>
          )}
        </h2>

        {patientData.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz veri eklenmedi
            </h3>
            <p className="text-gray-600">
              Yukarıdaki &quot;Yeni Veri Ekle&quot; butonundan veri eklemeye başlayın
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...patientData].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ).map((data, index) => {
              const type = dataTypes.find(t => t.id === data.data_type)
              if (!type) return null

              return (
                <div key={data.id} className="relative">
                  {/* Timeline line */}
                  {index !== patientData.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent"></div>
                  )}

                  <div className="flex space-x-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-white ${
                        type.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        type.color === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                        type.color === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                        type.color === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {type.icon}
                      </div>
                    </div>

                    {/* Content card */}
                    <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                      {/* Card header */}
                      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{type.label}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-600">
                                {formatDistanceToNow(new Date(data.created_at), {
                                  addSuffix: true,
                                  locale: tr,
                                })}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(data.created_at).toLocaleString('tr-TR')}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDelete(data.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="px-6 py-5">
                        {renderContent(data)}
                      </div>
                    </div>
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
