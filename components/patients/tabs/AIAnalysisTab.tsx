'use client'

import { useState, useMemo, useEffect } from 'react'
import { PatientData, PatientTest, AIAnalysis } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/modal'
import { cn, copyToClipboard } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Star, Trash2, Edit2, Plus, Save, X, MessageSquare, Send } from 'lucide-react'

interface AIAnalysisTabProps {
  patientId: string
  patientData: PatientData[]
  tests: PatientTest[]
  analyses: AIAnalysis[]
}

interface SectionState {
  [key: string]: boolean
}

interface Note {
  id: string
  analysis_id: string
  user_id: string
  note: string
  created_at: string
  updated_at: string
}

interface NotesState {
  [analysisId: string]: Note[]
}

interface FavoritesState {
  [analysisId: string]: boolean
}

export function AIAnalysisTab({ patientId, patientData, tests, analyses }: AIAnalysisTabProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    summary: true,
    diagnosis: true,
    redFlags: true,
    tests: true,
    treatment: true,
    consultation: true,
    disposition: true,
    references: true,
  })
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'initial' | 'updated'>('all')
  const [compareMode, setCompareMode] = useState(false)
  const [compareAnalysis, setCompareAnalysis] = useState<AIAnalysis | null>(null)

  // Notes and Favorites state
  const [notes, setNotes] = useState<NotesState>({})
  const [favorites, setFavorites] = useState<FavoritesState>({})
  const [newNoteText, setNewNoteText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [notesLoading, setNotesLoading] = useState<{ [analysisId: string]: boolean }>({})

  // Email export state
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  // AI Chat state
  const [chatModalOpen, setChatModalOpen] = useState(false)

  const router = useRouter()
  const { showToast } = useToast()

  const latestAnalysis = analyses[0]

  // Fetch notes and favorites on mount
  useEffect(() => {
    analyses.forEach((analysis) => {
      fetchNotes(analysis.id)
      checkFavorite(analysis.id)
    })
  }, [analyses])

  // Notes management functions
  const fetchNotes = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes((prev) => ({ ...prev, [analysisId]: data.notes || [] }))
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const addNote = async (analysisId: string) => {
    if (!newNoteText.trim()) {
      showToast('Not içeriği boş olamaz', 'warning')
      return
    }

    setNotesLoading((prev) => ({ ...prev, [analysisId]: true }))
    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNoteText }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes((prev) => ({
          ...prev,
          [analysisId]: [data.note, ...(prev[analysisId] || [])],
        }))
        setNewNoteText('')
        showToast('Not eklendi', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Not eklenirken hata oluştu', 'error')
      }
    } catch (error) {
      showToast('Not eklenirken hata oluştu', 'error')
    } finally {
      setNotesLoading((prev) => ({ ...prev, [analysisId]: false }))
    }
  }

  const updateNote = async (analysisId: string, noteId: string) => {
    if (!editingNoteText.trim()) {
      showToast('Not içeriği boş olamaz', 'warning')
      return
    }

    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editingNoteText }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes((prev) => ({
          ...prev,
          [analysisId]: prev[analysisId].map((n) => (n.id === noteId ? data.note : n)),
        }))
        setEditingNoteId(null)
        setEditingNoteText('')
        showToast('Not güncellendi', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Not güncellenirken hata oluştu', 'error')
      }
    } catch (error) {
      showToast('Not güncellenirken hata oluştu', 'error')
    }
  }

  const deleteNote = async (analysisId: string, noteId: string) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotes((prev) => ({
          ...prev,
          [analysisId]: prev[analysisId].filter((n) => n.id !== noteId),
        }))
        showToast('Not silindi', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Not silinirken hata oluştu', 'error')
      }
    } catch (error) {
      showToast('Not silinirken hata oluştu', 'error')
    }
  }

  // Favorites management functions
  const checkFavorite = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/favorite`)
      if (response.ok) {
        const data = await response.json()
        setFavorites((prev) => ({ ...prev, [analysisId]: data.isFavorite }))
      }
    } catch (error) {
      console.error('Error checking favorite:', error)
    }
  }

  const toggleFavorite = async (analysisId: string) => {
    const isFavorite = favorites[analysisId]

    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/favorite`, {
        method: isFavorite ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        setFavorites((prev) => ({ ...prev, [analysisId]: !isFavorite }))
        showToast(isFavorite ? 'Favorilerden kaldırıldı' : 'Favorilere eklendi', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'İşlem başarısız oldu', 'error')
      }
    } catch (error) {
      showToast('İşlem başarısız oldu', 'error')
    }
  }

  // Email export function
  const sendEmail = async () => {
    if (!emailAddress.trim()) {
      showToast('E-posta adresi gerekli', 'warning')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress)) {
      showToast('Geçerli bir e-posta adresi giriniz', 'warning')
      return
    }

    setEmailSending(true)
    try {
      const response = await fetch(`/api/ai/analyses/${latestAnalysis.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAddress,
          message: emailMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        showToast('E-posta gönderildi', 'success')
        setEmailModalOpen(false)
        setEmailAddress('')
        setEmailMessage('')
      } else {
        const data = await response.json()
        showToast(data.error || 'E-posta gönderilirken hata oluştu', 'error')
      }
    } catch (error) {
      showToast('E-posta gönderilirken hata oluştu', 'error')
    } finally {
      setEmailSending(false)
    }
  }

  // Filter analyses based on search and filter
  const filteredAnalyses = useMemo(() => {
    let filtered = analyses.slice(1) // Skip the latest analysis

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.analysis_type === filterType)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((a) => {
        const summary = a.ai_response.summary?.toLowerCase() || ''
        const diagnosis = a.ai_response.differential_diagnosis?.join(' ').toLowerCase() || ''
        return summary.includes(query) || diagnosis.includes(query)
      })
    }

    return filtered
  }, [analyses, searchQuery, filterType])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleAllSections = (expand: boolean) => {
    const newState = Object.keys(expandedSections).reduce(
      (acc, key) => ({ ...acc, [key]: expand }),
      {}
    )
    setExpandedSections(newState)
  }

  const handlePrint = () => {
    window.print()
    showToast('Yazdırma penceresi açıldı', 'success')
  }

  const handleCopyToClipboard = async () => {
    if (!latestAnalysis) return

    const text = `
AI DESTEKL\u0130 HASTA ANAL\u0130Z\u0130
${latestAnalysis.analysis_type === 'initial' ? '\u0130lk De\u011ferlendirme' : 'G\u00fcncellenmi\u015f Analiz'}
Tarih: ${new Date(latestAnalysis.created_at).toLocaleString('tr-TR')}

${latestAnalysis.ai_response.summary ? `\u00d6ZET:\n${latestAnalysis.ai_response.summary}\n` : ''}

${latestAnalysis.ai_response.differential_diagnosis ? `AYIRICI TANILAR:\n${latestAnalysis.ai_response.differential_diagnosis.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}\n` : ''}

${latestAnalysis.ai_response.red_flags && latestAnalysis.ai_response.red_flags.length > 0 ? `KR\u0130T\u0130K BULGULAR:\n${latestAnalysis.ai_response.red_flags.map((f: string) => `\u2022 ${f}`).join('\n')}\n` : ''}

${latestAnalysis.ai_response.recommended_tests ? `\u00d6NER\u0130LEN TETK\u0130KLER:\n${latestAnalysis.ai_response.recommended_tests.map((t: { test: string; priority: string }) => `\u2022 ${t.test} (${t.priority === 'urgent' ? 'Acil' : t.priority === 'high' ? 'Y\u00fcksek' : 'Rutin'})`).join('\n')}\n` : ''}
    `.trim()

    const success = await copyToClipboard(text)
    if (success) {
      showToast('Analiz panoya kopyalandı!', 'success')
    } else {
      showToast('Kopyalama başarısız oldu', 'error')
    }
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          analysisType: analyses.length > 0 ? 'updated' : 'initial',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analiz yapılırken bir hata oluştu')
      }

      showToast('AI analizi başarıyla tamamlandı!', 'success')
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const canAnalyze = patientData.length > 0 || tests.length > 0

  // Skeleton Loading Component
  if (loading && !latestAnalysis) {
    return <AnalysisSkeletonLoader />
  }

  return (
    <div className="space-y-6">
      {/* Analyze Button Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -z-0"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">AI Destekli Hasta Analizi</h2>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {canAnalyze
                  ? analyses.length > 0
                    ? '📊 Hasta verilerinde değişiklik oldu. Yeni bir analiz yaparak güncellenmiş öneriler alın.'
                    : '🎯 Hasta verilerini analiz ederek tanı önerileri, tetkik önerileri ve tedavi algoritması alın.'
                  : '⚠️ Analiz yapabilmek için önce hasta bilgileri veya tetkik sonuçları eklemelisiniz.'}
              </p>
              {canAnalyze && (
                <div className="flex flex-wrap items-center gap-3">
                  <StatBadge icon="📋" label="Veri" count={patientData.length} color="blue" />
                  <StatBadge icon="🔬" label="Tetkik" count={tests.length} color="purple" />
                  {analyses.length > 0 && (
                    <StatBadge icon="🤖" label="Analiz" count={analyses.length} color="green" />
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className={cn(
                'px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg',
                'flex items-center gap-2 whitespace-nowrap',
                canAnalyze && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Analiz Yapılıyor...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>{analyses.length > 0 ? 'Yeniden Analiz Et' : 'Analiz Başlat'}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-300">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold">Hata</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latest Analysis Results */}
      {latestAnalysis ? (
        <div className="space-y-4">
          {/* Control Bar */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => toggleAllSections(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Tümünü Aç
              </button>
              <button
                onClick={() => toggleAllSections(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Tümünü Kapat
              </button>

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(latestAnalysis.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2',
                  favorites[latestAnalysis.id]
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Star
                  className={cn(
                    'w-4 h-4',
                    favorites[latestAnalysis.id] ? 'fill-yellow-500 text-yellow-500' : ''
                  )}
                />
                {favorites[latestAnalysis.id] ? 'Favorilerde' : 'Favorilere Ekle'}
              </button>

              {/* AI Chat Button */}
              <button
                onClick={() => setChatModalOpen(true)}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <MessageSquare className="w-4 h-4" />
                AI Chat
              </button>

              {analyses.length > 1 && (
                <button
                  onClick={() => {
                    setCompareMode(!compareMode)
                    setCompareAnalysis(null)
                  }}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                    compareMode
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {compareMode ? 'Karşılaştırma Aktif' : 'Karşılaştır'}
                </button>
              )}

              {/* Export Buttons */}
              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <button
                onClick={handleCopyToClipboard}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Kopyala
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Yazdır
              </button>

              <button
                onClick={() => setEmailModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                E-posta Gönder
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {formatDistanceToNow(new Date(latestAnalysis.created_at), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            </div>
          </div>

          {/* Compare Mode Notice */}
          {compareMode && (
            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
              <p className="text-purple-900 font-medium">📊 Karşılaştırma Modu Aktif</p>
              <p className="text-purple-700 text-sm mt-1">
                {compareAnalysis
                  ? 'Seçilen analiz güncel analiz ile yan yana görüntüleniyor. Kapatmak için tekrar "Karşılaştır" butonuna tıklayın.'
                  : 'Aşağıdaki önceki analizlerden birini seçerek güncel analiz ile karşılaştırın.'}
              </p>
            </div>
          )}

          {/* Analysis Content - Compare or Single View */}
          <div className={cn(compareAnalysis && compareMode ? 'grid grid-cols-2 gap-4' : '')}>
            {/* Current Analysis */}
            <div className="space-y-4">
              {compareAnalysis && compareMode && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <p className="font-semibold text-blue-900 text-sm">📌 Güncel Analiz</p>
                </div>
              )}

              {/* Analysis Header */}
              <CollapsibleCard
                title={
                  latestAnalysis.analysis_type === 'initial'
                    ? 'İlk Değerlendirme'
                    : 'Güncellenmiş Analiz'
                }
                icon="📝"
                badge="AI Analizi"
                badgeColor="green"
                expanded={expandedSections.summary}
                onToggle={() => toggleSection('summary')}
              >
                {latestAnalysis.ai_response.summary && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">
                      {latestAnalysis.ai_response.summary}
                    </p>
                  </div>
                )}
              </CollapsibleCard>

              {/* Differential Diagnosis */}
              {latestAnalysis.ai_response.differential_diagnosis && (
                <CollapsibleCard
                  title="Ayırıcı Tanılar"
                  icon="🎯"
                  expanded={expandedSections.diagnosis}
                  onToggle={() => toggleSection('diagnosis')}
                  gradient="from-purple-50 to-pink-50"
                >
                  <div className="space-y-3">
                    {latestAnalysis.ai_response.differential_diagnosis.map(
                      (diagnosis: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                        >
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-lg mr-3 group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </span>
                          <span className="text-gray-800 flex-1">{diagnosis}</span>
                        </div>
                      )
                    )}
                  </div>
                </CollapsibleCard>
              )}

              {/* Red Flags */}
              {latestAnalysis.ai_response.red_flags &&
                latestAnalysis.ai_response.red_flags.length > 0 && (
                  <CollapsibleCard
                    title="Kritik Bulgular"
                    icon="⚠️"
                    expanded={expandedSections.redFlags}
                    onToggle={() => toggleSection('redFlags')}
                    gradient="from-red-50 to-orange-50"
                    borderColor="border-red-200"
                  >
                    <div className="space-y-3">
                      {latestAnalysis.ai_response.red_flags.map((flag: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-pulse-slow"
                        >
                          <svg
                            className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-red-900 font-medium flex-1">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleCard>
                )}

              {/* Recommended Tests */}
              {latestAnalysis.ai_response.recommended_tests && (
                <CollapsibleCard
                  title="Önerilen Tetkikler"
                  icon="🔬"
                  expanded={expandedSections.tests}
                  onToggle={() => toggleSection('tests')}
                  gradient="from-teal-50 to-cyan-50"
                >
                  <div className="space-y-6">
                    {/* Priority Distribution Chart */}
                    <TestPriorityChart tests={latestAnalysis.ai_response.recommended_tests} />

                    {/* Tests List */}
                    <div className="space-y-3">
                      {latestAnalysis.ai_response.recommended_tests.map(
                        (
                          test: { test: string; priority: string; rationale: string },
                          idx: number
                        ) => (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all duration-200 hover:border-teal-300"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                {test.test}
                              </h4>
                              {test.priority && <PriorityBadge priority={test.priority} />}
                            </div>
                            {test.rationale && (
                              <p className="text-sm text-gray-600 mt-2 pl-4 border-l-2 border-gray-200">
                                {test.rationale}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CollapsibleCard>
              )}

              {/* Treatment Algorithm */}
              {latestAnalysis.ai_response.treatment_algorithm && (
                <CollapsibleCard
                  title="Tedavi Algoritması"
                  icon="💊"
                  expanded={expandedSections.treatment}
                  onToggle={() => toggleSection('treatment')}
                  gradient="from-green-50 to-emerald-50"
                >
                  <div className="space-y-6">
                    {latestAnalysis.ai_response.treatment_algorithm.immediate && (
                      <TreatmentSection
                        title="Acil Müdahale"
                        icon="🚨"
                        items={latestAnalysis.ai_response.treatment_algorithm.immediate}
                        color="red"
                      />
                    )}

                    {latestAnalysis.ai_response.treatment_algorithm.monitoring && (
                      <TreatmentSection
                        title="İzlem Parametreleri"
                        icon="📊"
                        items={latestAnalysis.ai_response.treatment_algorithm.monitoring}
                        color="blue"
                      />
                    )}

                    {latestAnalysis.ai_response.treatment_algorithm.medications && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <span className="text-xl">💉</span>
                          İlaç Önerileri
                        </h4>
                        <div className="space-y-2">
                          {latestAnalysis.ai_response.treatment_algorithm.medications.map(
                            (
                              item: string | { name: string; dose: string; frequency: string },
                              idx: number
                            ) => (
                              <div
                                key={idx}
                                className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200"
                              >
                                <span className="text-green-600 mr-3 font-bold">→</span>
                                <span className="text-gray-800">
                                  {typeof item === 'string'
                                    ? item
                                    : `${item.name || ''} ${item.dose || ''} - ${item.frequency || ''}`}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleCard>
              )}

              {/* Consultation */}
              {latestAnalysis.ai_response.consultation && (
                <CollapsibleCard
                  title="Konsültasyon Önerisi"
                  icon="👨‍⚕️"
                  expanded={expandedSections.consultation}
                  onToggle={() => toggleSection('consultation')}
                  gradient="from-yellow-50 to-amber-50"
                >
                  {latestAnalysis.ai_response.consultation.required && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">
                          {latestAnalysis.ai_response.consultation.urgency === 'urgent'
                            ? '⚡'
                            : '📋'}
                        </span>
                        <p className="font-semibold text-yellow-900 text-lg">
                          Konsültasyon{' '}
                          {latestAnalysis.ai_response.consultation.urgency === 'urgent'
                            ? 'ACİL gerekli'
                            : 'önerilmektedir'}
                        </p>
                      </div>
                      {latestAnalysis.ai_response.consultation.departments && (
                        <div className="mb-3">
                          <p className="text-yellow-800 font-medium mb-2">Bölümler:</p>
                          <div className="flex flex-wrap gap-2">
                            {latestAnalysis.ai_response.consultation.departments.map(
                              (dept: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-yellow-100 text-yellow-900 rounded-full text-sm font-medium"
                                >
                                  {dept}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      {latestAnalysis.ai_response.consultation.reason && (
                        <div className="bg-white/50 rounded p-3">
                          <p className="text-yellow-900">
                            <span className="font-medium">Neden:</span>{' '}
                            {latestAnalysis.ai_response.consultation.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CollapsibleCard>
              )}

              {/* Disposition */}
              {latestAnalysis.ai_response.disposition && (
                <CollapsibleCard
                  title="Hasta Yönlendirme"
                  icon="🏥"
                  expanded={expandedSections.disposition}
                  onToggle={() => toggleSection('disposition')}
                  gradient="from-indigo-50 to-blue-50"
                >
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-5">
                    <p className="font-semibold text-indigo-900 mb-3 text-lg flex items-center gap-2">
                      <span className="text-2xl">
                        {latestAnalysis.ai_response.disposition.recommendation === 'hospitalize'
                          ? '🏥'
                          : latestAnalysis.ai_response.disposition.recommendation === 'observe'
                            ? '👁️'
                            : '🏠'}
                      </span>
                      Öneri:{' '}
                      {latestAnalysis.ai_response.disposition.recommendation === 'hospitalize'
                        ? 'Yatış'
                        : latestAnalysis.ai_response.disposition.recommendation === 'observe'
                          ? 'Gözlem'
                          : 'Taburcu'}
                    </p>
                    {latestAnalysis.ai_response.disposition.criteria && (
                      <div className="bg-white/50 rounded p-3">
                        <p className="text-indigo-800">
                          {latestAnalysis.ai_response.disposition.criteria}
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleCard>
              )}

              {/* References */}
              {latestAnalysis.ai_response.references && (
                <CollapsibleCard
                  title="Akademik Kaynaklar"
                  icon="📚"
                  expanded={expandedSections.references}
                  onToggle={() => toggleSection('references')}
                  gradient="from-gray-50 to-slate-50"
                >
                  <div className="space-y-4">
                    {latestAnalysis.ai_response.references.map(
                      (
                        ref: { title: string; source: string; year?: string; key_point?: string },
                        idx: number
                      ) => (
                        <div
                          key={idx}
                          className="border-l-4 border-gray-400 pl-4 py-3 bg-white rounded-r-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                        >
                          <p className="font-medium text-gray-900 mb-1">{ref.title}</p>
                          <p className="text-sm text-gray-600 mb-2">
                            {ref.source}
                            {ref.year && ` (${ref.year})`}
                          </p>
                          {ref.key_point && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                              <span className="font-medium">→</span> {ref.key_point}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </CollapsibleCard>
              )}

              {/* Notes Section */}
              <NotesSection
                analysisId={latestAnalysis.id}
                notes={notes[latestAnalysis.id] || []}
                newNoteText={newNoteText}
                setNewNoteText={setNewNoteText}
                editingNoteId={editingNoteId}
                setEditingNoteId={setEditingNoteId}
                editingNoteText={editingNoteText}
                setEditingNoteText={setEditingNoteText}
                notesLoading={notesLoading[latestAnalysis.id]}
                onAddNote={() => addNote(latestAnalysis.id)}
                onUpdateNote={(noteId) => updateNote(latestAnalysis.id, noteId)}
                onDeleteNote={(noteId) => deleteNote(latestAnalysis.id, noteId)}
              />
            </div>
            {/* End Current Analysis */}
          </div>
          {/* End Compare or Single View */}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Analysis Timeline */}
      {analyses.length > 0 && <AnalysisTimeline analyses={analyses} />}

      {/* Previous Analyses */}
      {analyses.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Önceki Analizler ({filteredAnalyses.length})
            </h3>
          </div>

          {/* Search and Filter */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Analizlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <FilterButton
                label="Tümü"
                active={filterType === 'all'}
                onClick={() => setFilterType('all')}
                count={analyses.length - 1}
              />
              <FilterButton
                label="İlk Değerlendirme"
                active={filterType === 'initial'}
                onClick={() => setFilterType('initial')}
                count={analyses.filter((a) => a.analysis_type === 'initial').length}
              />
              <FilterButton
                label="Güncellenmiş"
                active={filterType === 'updated'}
                onClick={() => setFilterType('updated')}
                count={analyses.filter((a) => a.analysis_type === 'updated').length}
              />
            </div>
          </div>

          {/* Analyses List */}
          {filteredAnalyses.length > 0 ? (
            <div className="space-y-2">
              {filteredAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={cn(
                    'flex justify-between items-center p-4 bg-gradient-to-r rounded-lg transition-all duration-200 group border',
                    compareAnalysis?.id === analysis.id && compareMode
                      ? 'from-purple-100 to-purple-200 border-purple-400'
                      : 'from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 border-transparent hover:border-blue-200'
                  )}
                >
                  <div
                    onClick={() => {
                      if (compareMode) {
                        setCompareAnalysis(analysis)
                      } else {
                        setSelectedAnalysis(analysis)
                      }
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {analysis.analysis_type === 'initial'
                          ? '📝 İlk Değerlendirme'
                          : '🔄 Güncellenmiş Analiz'}
                      </p>
                      {favorites[analysis.id] && (
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(analysis.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                    {analysis.ai_response.summary && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {analysis.ai_response.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(analysis.id)
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label={
                        favorites[analysis.id] ? 'Favorilerden kaldır' : 'Favorilere ekle'
                      }
                    >
                      <Star
                        className={cn(
                          'w-5 h-5',
                          favorites[analysis.id]
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-400 hover:text-yellow-500'
                        )}
                      />
                    </button>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>Arama kriterlerine uygun analiz bulunamadı</p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <Modal
          isOpen={!!selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          title={
            selectedAnalysis.analysis_type === 'initial'
              ? 'İlk Değerlendirme - Detaylar'
              : 'Güncellenmiş Analiz - Detaylar'
          }
          size="xl"
        >
          <AnalysisDetailView analysis={selectedAnalysis} />
        </Modal>
      )}

      {/* Email Modal */}
      {latestAnalysis && (
        <Modal
          isOpen={emailModalOpen}
          onClose={() => {
            setEmailModalOpen(false)
            setEmailAddress('')
            setEmailMessage('')
          }}
          title="Analizi E-posta ile Gönder"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Analiz raporunu e-posta ile göndermek için alıcı e-posta adresini girin.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi *
              </label>
              <input
                type="email"
                id="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={emailSending}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Mesaj (İsteğe bağlı)
              </label>
              <textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="E-posta ile birlikte göndermek istediğiniz mesaj..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={4}
                disabled={emailSending}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-blue-800">
                Analiz raporu profesyonel formatta HTML e-posta olarak gönderilecektir.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={sendEmail}
                disabled={emailSending || !emailAddress.trim()}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200',
                  emailSending || !emailAddress.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                )}
              >
                {emailSending ? (
                  <>
                    <Spinner />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Gönder</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setEmailModalOpen(false)
                  setEmailAddress('')
                  setEmailMessage('')
                }}
                disabled={emailSending}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* AI Chat Modal */}
      {latestAnalysis && (
        <Modal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          title="🤖 AI ile Sohbet"
          size="lg"
        >
          <AIChatInterface analysisId={latestAnalysis.id} />
        </Modal>
      )}
    </div>
  )
}

// Helper Components

function StatBadge({
  icon,
  label,
  count,
  color,
}: {
  icon: string
  label: string
  count: number
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    green: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm',
        colorClasses[color as keyof typeof colorClasses]
      )}
    >
      <span>{icon}</span>
      <span>
        {count} {label}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

function CollapsibleCard({
  title,
  icon,
  badge,
  badgeColor = 'blue',
  expanded,
  onToggle,
  gradient = 'from-white to-gray-50',
  borderColor = 'border-gray-200',
  children,
}: {
  title: string
  icon: string
  badge?: string
  badgeColor?: string
  expanded: boolean
  onToggle: () => void
  gradient?: string
  borderColor?: string
  children: React.ReactNode
}) {
  const badgeColors = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
  }

  return (
    <div
      className={cn(
        'rounded-xl shadow-sm border overflow-hidden transition-all duration-300',
        borderColor,
        expanded ? 'shadow-md' : 'hover:shadow-md'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full p-5 bg-gradient-to-r transition-all duration-200',
          gradient,
          'hover:brightness-95'
        )}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  badgeColors[badgeColor as keyof typeof badgeColors]
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <svg
            className={cn(
              'w-6 h-6 text-gray-600 transition-transform duration-300',
              expanded ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          expanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-5 bg-white border-t border-gray-100">{children}</div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    urgent: { label: 'Acil', color: 'bg-red-100 text-red-800 border-red-200' },
    high: { label: 'Yüksek', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    routine: { label: 'Rutin', color: 'bg-green-100 text-green-800 border-green-200' },
  }

  const { label, color } = config[priority as keyof typeof config] || config.routine

  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold border', color)}>{label}</span>
  )
}

function TreatmentSection({
  title,
  icon,
  items,
  color,
}: {
  title: string
  icon: string
  items: string[]
  color: string
}) {
  const colorClasses = {
    red: 'text-red-700 border-red-200 bg-red-50',
    blue: 'text-blue-700 border-blue-200 bg-blue-50',
  }

  return (
    <div>
      <h4 className={cn('font-semibold mb-3 flex items-center gap-2', `text-${color}-700`)}>
        <span className="text-xl">{icon}</span>
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item: string, idx: number) => (
          <div
            key={idx}
            className={cn(
              'flex items-start p-3 rounded-lg border',
              colorClasses[color as keyof typeof colorClasses]
            )}
          >
            <span className={cn('mr-3 font-bold', `text-${color}-600`)}>→</span>
            <span className="text-gray-800">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="text-7xl mb-6 animate-bounce">🤖</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Henüz AI analizi yapılmadı</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Hasta verilerini ekledikten sonra AI analizi yaparak kanıta dayalı öneriler alın
      </p>
      <div className="flex justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Hızlı Analiz</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Kanıta Dayalı</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Akademik Referans</span>
        </div>
      </div>
    </div>
  )
}

function AnalysisSkeletonLoader() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
      </div>

      {/* Content Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function FilterButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
        active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
    >
      {label} <span className="ml-1">({count})</span>
    </button>
  )
}

function TestPriorityChart({
  tests,
}: {
  tests: Array<{ test: string; priority: string; rationale: string }>
}) {
  const priorityData = useMemo(() => {
    const counts = { urgent: 0, high: 0, routine: 0 }
    tests.forEach((test) => {
      if (test.priority === 'urgent') counts.urgent++
      else if (test.priority === 'high') counts.high++
      else counts.routine++
    })

    return [
      { name: 'Acil', value: counts.urgent, color: '#EF4444' },
      { name: 'Yüksek', value: counts.high, color: '#F59E0B' },
      { name: 'Rutin', value: counts.routine, color: '#10B981' },
    ].filter((item) => item.value > 0)
  }, [tests])

  if (priorityData.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-teal-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Öncelik Dağılımı
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {priorityData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <span className="text-2xl font-bold text-gray-700">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalysisTimeline({ analyses }: { analyses: AIAnalysis[] }) {
  if (analyses.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        Analiz Zaman Çizelgesi
      </h3>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Timeline Items */}
        <div className="space-y-6">
          {analyses.map((analysis, idx) => (
            <div key={analysis.id} className="relative pl-12">
              {/* Timeline Dot */}
              <div
                className={cn(
                  'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                  idx === 0
                    ? 'bg-blue-500 ring-4 ring-blue-100'
                    : 'bg-gray-300 ring-4 ring-gray-100'
                )}
              >
                <span className="text-white text-xs font-bold">{analyses.length - idx}</span>
              </div>

              {/* Content */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-200',
                  idx === 0
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      analysis.analysis_type === 'initial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    )}
                  >
                    {analysis.analysis_type === 'initial'
                      ? 'İlk Değerlendirme'
                      : 'Güncellenmiş Analiz'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(analysis.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
                {analysis.ai_response.summary && (
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {analysis.ai_response.summary}
                  </p>
                )}
                {analysis.ai_response.differential_diagnosis &&
                  analysis.ai_response.differential_diagnosis.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {analysis.ai_response.differential_diagnosis
                        .slice(0, 3)
                        .map((diag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white text-gray-700 rounded text-xs border border-gray-200"
                          >
                            {diag}
                          </span>
                        ))}
                      {analysis.ai_response.differential_diagnosis.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          +{analysis.ai_response.differential_diagnosis.length - 3} daha
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotesSection({
  analysisId,
  notes,
  newNoteText,
  setNewNoteText,
  editingNoteId,
  setEditingNoteId,
  editingNoteText,
  setEditingNoteText,
  notesLoading,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: {
  analysisId: string
  notes: Note[]
  newNoteText: string
  setNewNoteText: (text: string) => void
  editingNoteId: string | null
  setEditingNoteId: (id: string | null) => void
  editingNoteText: string
  setEditingNoteText: (text: string) => void
  notesLoading: boolean
  onAddNote: () => void
  onUpdateNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          Notlar
          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
            {notes.length}
          </span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">Analiz hakkında notlarınızı ekleyin</p>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Add Note Form */}
        <div className="mb-6">
          <div className="flex gap-2">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Yeni not ekle..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
              disabled={notesLoading}
            />
          </div>
          <button
            onClick={onAddNote}
            disabled={notesLoading || !newNoteText.trim()}
            className={cn(
              'mt-2 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200',
              notesLoading || !newNoteText.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            )}
          >
            <Plus className="w-4 h-4" />
            {notesLoading ? 'Ekleniyor...' : 'Not Ekle'}
          </button>
        </div>

        {/* Notes List */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all duration-200"
              >
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateNote(note.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Kaydet
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null)
                          setEditingNoteText('')
                        }}
                        className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-800 whitespace-pre-wrap mb-3">{note.note}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id)
                            setEditingNoteText(note.note)
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          aria-label="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          aria-label="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">Henüz not eklenmemiş</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AnalysisDetailView({ analysis }: { analysis: AIAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {formatDistanceToNow(new Date(analysis.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            analysis.analysis_type === 'initial'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          )}
        >
          {analysis.analysis_type === 'initial' ? 'İlk Değerlendirme' : 'Güncellenmiş Analiz'}
        </span>
      </div>

      {/* Summary */}
      {analysis.ai_response.summary && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">📝</span>
            Özet
          </h4>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-gray-800 leading-relaxed">{analysis.ai_response.summary}</p>
          </div>
        </div>
      )}

      {/* Differential Diagnosis */}
      {analysis.ai_response.differential_diagnosis && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Ayırıcı Tanılar
          </h4>
          <div className="space-y-2">
            {analysis.ai_response.differential_diagnosis.map((diagnosis: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start p-3 bg-purple-50 rounded-lg border border-purple-200"
              >
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-600 text-white font-bold rounded mr-3 text-sm">
                  {idx + 1}
                </span>
                <span className="text-gray-800">{diagnosis}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {analysis.ai_response.red_flags && analysis.ai_response.red_flags.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Kritik Bulgular
          </h4>
          <div className="space-y-2">
            {analysis.ai_response.red_flags.map((flag: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start p-3 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <span className="text-red-600 mr-3">•</span>
                <span className="text-red-900 font-medium">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Tests */}
      {analysis.ai_response.recommended_tests && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🔬</span>
            Önerilen Tetkikler
          </h4>
          <div className="space-y-3">
            {analysis.ai_response.recommended_tests.map(
              (test: { test: string; priority: string; rationale: string }, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-900">{test.test}</h5>
                    {test.priority && <PriorityBadge priority={test.priority} />}
                  </div>
                  {test.rationale && (
                    <p className="text-sm text-gray-600 pl-3 border-l-2 border-gray-200">
                      {test.rationale}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Treatment Algorithm */}
      {analysis.ai_response.treatment_algorithm && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">💊</span>
            Tedavi Algoritması
          </h4>
          <div className="space-y-4">
            {analysis.ai_response.treatment_algorithm.immediate && (
              <div>
                <h5 className="font-medium text-red-700 mb-2">Acil Müdahale:</h5>
                <div className="space-y-1">
                  {analysis.ai_response.treatment_algorithm.immediate.map(
                    (item: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start p-2 bg-red-50 rounded border-l-2 border-red-500"
                      >
                        <span className="text-red-600 mr-2">→</span>
                        <span className="text-gray-800 text-sm">{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {analysis.ai_response.treatment_algorithm.monitoring && (
              <div>
                <h5 className="font-medium text-blue-700 mb-2">İzlem Parametreleri:</h5>
                <div className="space-y-1">
                  {analysis.ai_response.treatment_algorithm.monitoring.map(
                    (item: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start p-2 bg-blue-50 rounded border-l-2 border-blue-500"
                      >
                        <span className="text-blue-600 mr-2">→</span>
                        <span className="text-gray-800 text-sm">{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {analysis.ai_response.treatment_algorithm.medications && (
              <div>
                <h5 className="font-medium text-green-700 mb-2">İlaç Önerileri:</h5>
                <div className="space-y-1">
                  {analysis.ai_response.treatment_algorithm.medications.map(
                    (
                      item: string | { name: string; dose: string; frequency: string },
                      idx: number
                    ) => (
                      <div
                        key={idx}
                        className="flex items-start p-2 bg-green-50 rounded border-l-2 border-green-500"
                      >
                        <span className="text-green-600 mr-2">→</span>
                        <span className="text-gray-800 text-sm">
                          {typeof item === 'string'
                            ? item
                            : `${item.name || ''} ${item.dose || ''} - ${item.frequency || ''}`}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consultation */}
      {analysis.ai_response.consultation && analysis.ai_response.consultation.required && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">👨‍⚕️</span>
            Konsültasyon Önerisi
          </h4>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
            <p className="font-semibold text-yellow-900 mb-2">
              Konsültasyon{' '}
              {analysis.ai_response.consultation.urgency === 'urgent'
                ? 'ACİL gerekli'
                : 'önerilmektedir'}
            </p>
            {analysis.ai_response.consultation.departments && (
              <div className="flex flex-wrap gap-2 mb-2">
                {analysis.ai_response.consultation.departments.map((dept: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded text-sm font-medium"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            )}
            {analysis.ai_response.consultation.reason && (
              <p className="text-yellow-800 text-sm">{analysis.ai_response.consultation.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Disposition */}
      {analysis.ai_response.disposition && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🏥</span>
            Hasta Yönlendirme
          </h4>
          <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-4">
            <p className="font-semibold text-indigo-900 mb-2">
              Öneri:{' '}
              {analysis.ai_response.disposition.recommendation === 'hospitalize'
                ? '🏥 Yatış'
                : analysis.ai_response.disposition.recommendation === 'observe'
                  ? '👁️ Gözlem'
                  : '🏠 Taburcu'}
            </p>
            {analysis.ai_response.disposition.criteria && (
              <p className="text-indigo-800">{analysis.ai_response.disposition.criteria}</p>
            )}
          </div>
        </div>
      )}

      {/* References */}
      {analysis.ai_response.references && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">📚</span>
            Akademik Kaynaklar
          </h4>
          <div className="space-y-3">
            {analysis.ai_response.references.map(
              (
                ref: { title: string; source: string; year?: string; key_point?: string },
                idx: number
              ) => (
                <div
                  key={idx}
                  className="border-l-4 border-gray-400 pl-3 py-2 bg-gray-50 rounded-r"
                >
                  <p className="font-medium text-gray-900 text-sm">{ref.title}</p>
                  <p className="text-xs text-gray-600">
                    {ref.source}
                    {ref.year && ` (${ref.year})`}
                  </p>
                  {ref.key_point && <p className="text-xs text-gray-700 mt-1">→ {ref.key_point}</p>}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// AI Chat Interface Component
function AIChatInterface({ analysisId }: { analysisId: string }) {
  interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { showToast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          messages: messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Chat isteği başarısız oldu')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Stream okunamadı')
      }

      let assistantMessage = ''
      const assistantId = (Date.now() + 1).toString()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === assistantId)
          if (existing) {
            return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantMessage } : m))
          } else {
            return [
              ...prev,
              {
                id: assistantId,
                role: 'assistant' as const,
                content: assistantMessage,
              },
            ]
          }
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu'
      setError(err instanceof Error ? err : new Error(errorMsg))
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Asistanına Sor</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Analiz hakkında sorularınızı sorun. AI asistanı hasta verileri ve analiz sonuçları
              kapsamında size yardımcı olacaktır.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setInput('Kritik bulgular ne anlama geliyor?')}
                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Kritik bulgular ne anlama geliyor?
              </button>
              <button
                onClick={() => setInput('Önerilen tetkiklerin öncelik sırası neden böyle?')}
                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Tetkik öncelikleri neden böyle?
              </button>
              <button
                onClick={() => setInput('Ayırıcı tanılar arasındaki farklar nedir?')}
                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Ayırıcı tanılar nedir?
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">Düşünüyor...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">Hata: {error.message}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Sorunuzu yazın..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200',
              isLoading || !input.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
            )}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gönder</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI asistanı sadece analiz kapsamındaki bilgiler hakkında yanıt verir.
        </p>
      </form>
    </div>
  )
}
