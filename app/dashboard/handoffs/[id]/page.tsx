/**
 * Handoff Detail Page
 * Display handoff details with full information, checklist, and actions
 */

'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  Printer,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  FileText,
} from 'lucide-react'
import { useHandoff, useUpdateHandoff, useDeleteHandoff, useAcknowledgeHandoff } from '@/lib/hooks/useHandoffs'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { toast } from 'react-hot-toast'
import { HANDOFF_STATUS_CONFIG } from '@/types/handoff.types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function HandoffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const handoffId = params.id as string

  const { user } = useWorkspace()
  const { data: handoff, isLoading } = useHandoff(handoffId)
  const updateMutation = useUpdateHandoff()
  const deleteMutation = useDeleteHandoff()
  const acknowledgeMutation = useAcknowledgeHandoff()

  const [isPrinting, setIsPrinting] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Devir bilgileri yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!handoff) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Devir Bulunamadı</h2>
                <p className="text-gray-600 mb-4">Bu devir bulunamadı veya erişim yetkiniz yok.</p>
                <button
                  onClick={() => router.push('/dashboard/handoffs')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Devir Listesine Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = HANDOFF_STATUS_CONFIG[handoff.status]
  const isFromUser = handoff.from_user_id === user?.id
  const isToUser = handoff.to_user_id === user?.id
  const canAcknowledge = isToUser && handoff.status === 'pending_review'
  const canEdit = isFromUser && handoff.status !== 'completed'
  const canDelete = isFromUser

  const handleAcknowledge = async () => {
    if (!canAcknowledge) return

    try {
      await acknowledgeMutation.mutateAsync(handoffId)
      toast.success('Devir onaylandı!')
    } catch (error: any) {
      toast.error(error.message || 'Devir onaylanırken hata oluştu')
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 500)
  }

  const handleEmail = () => {
    toast.info('Email gönderme özelliği yakında eklenecek')
  }

  const handleDelete = async () => {
    if (!confirm('Bu devri silmek istediğinizden emin misiniz?')) return

    try {
      await deleteMutation.mutateAsync(handoffId)
      toast.success('Devir silindi')
      router.push('/dashboard/handoffs')
    } catch (error: any) {
      toast.error(error.message || 'Devir silinirken hata oluştu')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'archived':
        return 'bg-gray-100 text-gray-500 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
        {/* Header - Hide on print */}
        <div className="print:hidden">
          <button
            onClick={() => router.push('/dashboard/handoffs')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Devir Listesine Dön
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 print:bg-white print:border-b print:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(handoff.status)} print:border-gray-300`}>
                    {statusConfig.label}
                  </div>

                  {handoff.is_ai_generated && (
                    <div className="px-3 py-1 rounded-md text-sm font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      AI Destekli
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 print:text-gray-900">
                  Vardiya Devri
                </h1>

                <p className="text-blue-100 print:text-gray-600">
                  {new Date(handoff.handoff_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    weekday: 'long',
                  })}
                </p>

                <p className="text-sm text-blue-200 print:text-gray-500 mt-1">
                  Oluşturuldu: {formatDistanceToNow(new Date(handoff.created_at), { addSuffix: true, locale: tr })}
                </p>
              </div>

              {/* Actions - Hide on print */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Yazdır"
                >
                  <Printer className="w-5 h-5" />
                </button>

                <button
                  onClick={handleEmail}
                  className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Email Gönder"
                >
                  <Mail className="w-5 h-5" />
                </button>

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Sil"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6 print:p-4">
            {/* Users Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div className="bg-blue-50 rounded-lg p-4 print:bg-transparent print:border">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Devir Veren</h3>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {handoff.from_user?.full_name || 'Bilinmiyor'}
                </p>
                {handoff.from_user?.specialty && (
                  <p className="text-sm text-gray-600">{handoff.from_user.specialty}</p>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-4 print:bg-transparent print:border">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Devir Alan</h3>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {handoff.to_user?.full_name || 'Bilinmiyor'}
                </p>
                {handoff.to_user?.specialty && (
                  <p className="text-sm text-gray-600">{handoff.to_user.specialty}</p>
                )}
              </div>
            </div>

            {/* Shift Info */}
            {handoff.shift && (
              <div className="bg-gray-50 rounded-lg p-4 print:bg-transparent print:border">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Vardiya Bilgileri</h3>
                </div>
                <p className="text-gray-900">
                  {handoff.shift.shift_definition?.name || 'Vardiya'}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(handoff.shift.start_time).toLocaleTimeString('tr-TR')} -{' '}
                  {new Date(handoff.shift.end_time).toLocaleTimeString('tr-TR')}
                </p>
              </div>
            )}

            {/* Summary */}
            {handoff.summary && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Genel Özet
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 print:bg-transparent print:border">
                  <p className="text-gray-700 whitespace-pre-wrap">{handoff.summary}</p>
                </div>
              </div>
            )}

            {/* Patients */}
            {handoff.patients && handoff.patients.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Hastalar ({handoff.patients.length})
                </h3>
                <div className="space-y-3">
                  {handoff.patients.map((hp: any) => (
                    <div key={hp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{hp.patient?.name || 'Hasta'}</h4>
                          <p className="text-sm text-gray-600">
                            {hp.patient?.age} yaş, {hp.patient?.gender === 'male' ? 'Erkek' : 'Kadın'}
                          </p>
                        </div>
                        {hp.patient?.category && (
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${hp.patient.category.color}20`,
                              color: hp.patient.category.color,
                            }}
                          >
                            {hp.patient.category.name}
                          </span>
                        )}
                      </div>

                      {hp.patient_summary && (
                        <p className="text-sm text-gray-700 mb-2">{hp.patient_summary}</p>
                      )}

                      {hp.critical_items && hp.critical_items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-600 mb-1">Kritik Noktalar:</p>
                          <ul className="space-y-1">
                            {hp.critical_items.map((item: string, idx: number) => (
                              <li key={idx} className="text-xs text-red-900">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {hp.pending_tasks && hp.pending_tasks.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-yellow-600 mb-1">Bekleyen İşlemler:</p>
                          <ul className="space-y-1">
                            {hp.pending_tasks.map((task: string, idx: number) => (
                              <li key={idx} className="text-xs text-yellow-900">• {task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {handoff.checklist_items && handoff.checklist_items.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-gray-600" />
                  Devir Kontrol Listesi ({handoff._count?.completed_checklist_items || 0}/{handoff.checklist_items.length})
                </h3>
                <div className="space-y-2">
                  {handoff.checklist_items.map((item: any) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        item.is_completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.is_completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${item.is_completed ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.is_completed && item.completed_at && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {new Date(item.completed_at).toLocaleString('tr-TR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledgment */}
            {handoff.acknowledged_at && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Devir Onaylandı</p>
                    <p className="text-sm text-green-700">
                      {new Date(handoff.acknowledged_at).toLocaleString('tr-TR')} tarihinde{' '}
                      {handoff.acknowledged_by_user?.full_name || 'Bilinmeyen kullanıcı'} tarafından onaylandı.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Receiver Notes */}
            {handoff.receiver_notes && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Alıcı Notları</h3>
                <div className="bg-blue-50 rounded-lg p-4 print:bg-transparent print:border">
                  <p className="text-gray-700 whitespace-pre-wrap">{handoff.receiver_notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions - Hide on print */}
          {canAcknowledge && (
            <div className="border-t border-gray-200 p-6 bg-gray-50 print:hidden">
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  Bu devri inceleyip onaylamak için aşağıdaki butonu kullanın.
                </p>
                <button
                  onClick={handleAcknowledge}
                  disabled={acknowledgeMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  Devri Onayla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
