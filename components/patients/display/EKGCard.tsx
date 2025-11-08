'use client'

import { useState } from 'react'
import { PatientTest } from '@/types'
import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface EKGCardProps {
  test: PatientTest
}

export function EKGCard({ test }: EKGCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const results = test.results as Record<string, string>

  const handleDelete = async () => {
    if (!confirm('Bu EKG sonucunu silmek istediğinizden emin misiniz?')) {
      return
    }

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('patient_tests').delete().eq('id', test.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('EKG silinirken hata:', error)
      alert('EKG silinirken bir hata oluştu')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-sm border-2 border-red-200 overflow-hidden hover:shadow-lg transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center">
                EKG Sonucu
                <span className="ml-3 text-xs bg-white bg-opacity-20 backdrop-blur-sm px-2 py-1 rounded-full">
                  ❤️ Kardiyoloji
                </span>
              </h3>
              <div className="flex items-center space-x-2 mt-1 text-sm opacity-90">
                <span>
                  {format(new Date(test.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                </span>
                <span>•</span>
                <span>
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-white rounded-lg transition disabled:opacity-50 text-red-600 hover:bg-red-50 shadow-sm"
              title="Sil"
            >
              {isDeleting ? '⏳' : '🗑️'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white rounded-lg transition text-gray-700 hover:bg-gray-50 shadow-sm"
              title={isExpanded ? 'Daralt' : 'Genişlet'}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary - Always Visible */}
      <div className="p-4 border-b border-red-200 bg-white">
        <div className="grid grid-cols-3 gap-4">
          {results.rhythm && (
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl mb-1">🫀</div>
              <div className="text-xs text-gray-600 mb-1">Ritim</div>
              <div className="font-semibold text-gray-900">{results.rhythm}</div>
            </div>
          )}
          {results.rate && (
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl mb-1">💓</div>
              <div className="text-xs text-gray-600 mb-1">Kalp Hızı</div>
              <div className="font-semibold text-gray-900">{results.rate} atım/dk</div>
            </div>
          )}
          {results.axis && (
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl mb-1">📐</div>
              <div className="text-xs text-gray-600 mb-1">Aks</div>
              <div className="font-semibold text-gray-900">{results.axis}</div>
            </div>
          )}
        </div>

        {results.interpretation && !isExpanded && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Yorum</div>
            <p className="text-sm text-gray-900 line-clamp-2">{results.interpretation}</p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 bg-white space-y-4">
          {/* EKG Image */}
          {test.images && test.images.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="mr-2">📊</span>
                EKG Görseli
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {test.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    {img.includes('.pdf') ? (
                      <a
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-100 p-6 rounded-lg border-2 border-gray-300 hover:border-red-400 transition text-center"
                      >
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-sm text-gray-600">
                          PDF dosyasını görüntülemek için tıklayın
                        </p>
                      </a>
                    ) : (
                      <a href={img} target="_blank" rel="noopener noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`EKG ${idx + 1}`}
                          className="w-full rounded-lg border-2 border-gray-300 hover:border-red-400 transition cursor-pointer"
                        />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="mr-2">⚡</span>
              EKG Parametreleri
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.pr_interval && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">PR Aralığı</div>
                  <div className="font-semibold text-gray-900">{results.pr_interval} ms</div>
                </div>
              )}
              {results.qrs_duration && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">QRS Süresi</div>
                  <div className="font-semibold text-gray-900">{results.qrs_duration} ms</div>
                </div>
              )}
              {results.qt_qtc && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">QT/QTc</div>
                  <div className="font-semibold text-gray-900">{results.qt_qtc} ms</div>
                </div>
              )}
              {results.t_wave && (
                <div className="bg-gray-50 p-3 rounded-lg md:col-span-3">
                  <div className="text-xs text-gray-600 mb-1">T Dalgası</div>
                  <div className="font-semibold text-gray-900">{results.t_wave}</div>
                </div>
              )}
            </div>
          </div>

          {/* ST Changes */}
          {results.st_changes && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                ST Değişiklikleri
              </h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{results.st_changes}</p>
            </div>
          )}

          {/* Interpretation */}
          {results.interpretation && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                EKG Yorumu
              </h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{results.interpretation}</p>
            </div>
          )}

          {/* Clinical Notes */}
          {results.clinical_notes && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">📝</span>
                Klinik Notlar
              </h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{results.clinical_notes}</p>
            </div>
          )}

          {/* AI Info Box */}
          <div className="border border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Gelecekte AI Analizi</h4>
                <p className="text-xs text-gray-600">
                  Bu EKG kaydı gelecekte ekleneceği özelleşmiş yapay zeka ile otomatik olarak analiz
                  edilebilecektir. Görsel güvenli bir şekilde saklanmaktadır.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
