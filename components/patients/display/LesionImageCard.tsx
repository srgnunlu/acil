'use client'

import { PatientTest } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LesionImageCardProps {
  test: PatientTest
}

export function LesionImageCard({ test }: LesionImageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const results = test.results as any
  const symptoms = results?.symptoms || 'Belirtilmedi'
  const aiAnalysis = results?.ai_analysis || {}
  const imageUrl = test.images?.[0] || ''

  const handleDelete = async () => {
    if (!confirm('Bu lezyon analizini silmek istediğinizden emin misiniz?')) {
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClient()

      console.log('Silme işlemi başlatılıyor, test ID:', test.id)

      // Delete images from storage first if they exist
      if (test.images && test.images.length > 0) {
        console.log('Görseller siliniyor:', test.images)
        for (const imageUrl of test.images) {
          try {
            // Extract file path from URL
            const url = new URL(imageUrl)
            const pathParts = url.pathname.split('/medical-images/')
            if (pathParts.length > 1) {
              const filePath = decodeURIComponent(pathParts[1])
              console.log('Silinen dosya yolu:', filePath)

              const { error: storageError } = await supabase.storage
                .from('medical-images')
                .remove([filePath])

              if (storageError) {
                console.warn('Storage silme hatası:', storageError)
              } else {
                console.log('Görsel başarıyla silindi')
              }
            }
          } catch (imgError) {
            console.warn('Görsel silinemedi:', imgError)
            // Continue with database deletion even if image deletion fails
          }
        }
      }

      // Delete the test record
      console.log('Veritabanı kaydı siliniyor...')

      // First check if record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('patient_tests')
        .select('id')
        .eq('id', test.id)
        .single()

      console.log('Kayıt kontrolü:', existingRecord, checkError)

      if (!existingRecord && checkError) {
        console.error('Kayıt bulunamadı:', checkError)
        throw new Error('Kayıt bulunamadı, sayfa yenilenecek')
      }

      const { error: deleteError, data } = await supabase
        .from('patient_tests')
        .delete()
        .eq('id', test.id)
        .select()

      if (deleteError) {
        console.error('Veritabanı silme hatası:', deleteError)
        throw deleteError
      }

      console.log('Silme başarılı, silinen kayıt:', data)

      // Refresh immediately
      router.refresh()
    } catch (error: any) {
      console.error('Lezyon analizi silinirken hata:', error)
      alert(`Silme işlemi başarısız: ${error.message || 'Bilinmeyen hata'}`)
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden hover:shadow-md transition-all">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🔬</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Lezyon Analizi</h3>
              <p className="text-xs text-white opacity-90">
                {formatDistanceToNow(new Date(test.created_at), {
                  addSuffix: true,
                  locale: tr,
                })}
              </p>
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
              {isDeleting ? '⏳' : <Trash2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white rounded-lg transition text-gray-700 hover:bg-gray-50 shadow-sm"
              title={isExpanded ? 'Daralt' : 'Genişlet'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Compact Preview */}
      {!isExpanded && (
        <div className="p-3 bg-purple-50">
          <div className="grid grid-cols-2 gap-3">
            {/* Image Thumbnail */}
            {imageUrl && (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Lezyon"
                  className="w-full h-24 object-cover rounded-lg border border-purple-200"
                />
              </div>
            )}

            {/* Quick Info */}
            <div className="text-xs space-y-1">
              {aiAnalysis.malignancy_risk && (
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  aiAnalysis.malignancy_risk === 'high' ? 'bg-red-100 text-red-700' :
                  aiAnalysis.malignancy_risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  Risk: {aiAnalysis.malignancy_risk === 'high' ? 'Yüksek' :
                         aiAnalysis.malignancy_risk === 'medium' ? 'Orta' : 'Düşük'}
                </div>
              )}
              {aiAnalysis.confidence && (
                <div className="text-gray-600">
                  <span className="font-medium">Güven:</span> {
                    aiAnalysis.confidence === 'high' ? 'Yüksek' :
                    aiAnalysis.confidence === 'medium' ? 'Orta' : 'Düşük'
                  }
                </div>
              )}
              {symptoms !== 'Belirtilmedi' && (
                <div className="text-gray-600 line-clamp-2">
                  <span className="font-medium">Semptom:</span> {symptoms.slice(0, 50)}...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white border-t border-purple-200">
          {/* Full Image - Constrained size */}
          {imageUrl && (
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={imageUrl}
                alt="Lezyon detay"
                className="max-w-lg max-h-[28rem] object-contain rounded-lg border-2 border-gray-300 shadow-md"
              />
            </div>
          )}

          {/* Symptoms */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
              <span className="mr-1">📋</span>
              Semptomlar
            </h4>
            <p className="text-sm text-gray-700">{symptoms}</p>
          </div>

          {/* AI Analysis - Structured */}
          {aiAnalysis.description && (
            <div className="bg-purple-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-1">🤖</span>
                AI Değerlendirme
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.description}</p>
            </div>
          )}

          {/* ABCDE Score Grid */}
          {aiAnalysis.abcde_score && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">ABCDE Kriterleri</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(aiAnalysis.abcde_score).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-2 rounded">
                    <span className="font-medium capitalize">{key}:</span>
                    <span className="ml-1 text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Differential Diagnosis */}
          {aiAnalysis.differential_diagnosis && Array.isArray(aiAnalysis.differential_diagnosis) && aiAnalysis.differential_diagnosis.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">Ayırıcı Tanı</h4>
              <ul className="space-y-1 text-xs">
                {aiAnalysis.differential_diagnosis.map((diagnosis: string, idx: number) => (
                  <li key={idx} className="text-gray-700 flex items-start">
                    <span className="text-purple-600 mr-1">•</span>
                    <span>{diagnosis}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiAnalysis.recommendations && Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">Öneriler</h4>
              <ul className="space-y-1 text-xs">
                {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-gray-700 flex items-start">
                    <span className="text-blue-600 mr-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning if urgent */}
          {aiAnalysis.urgent_evaluation_needed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                Acil dermatolojik değerlendirme önerilir
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border-l-2 border-yellow-400 p-2 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Not:</strong> Bu analiz bilgilendirme amaçlıdır. Kesin tanı için hekim değerlendirmesi gereklidir.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
