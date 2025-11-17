/**
 * Handoff List Component
 * Displays list of handoffs with filters and actions
 */

'use client'

import React from 'react'
import { Clock, User, Users, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import type { HandoffWithDetails } from '@/types/handoff.types'
import { HANDOFF_STATUS_CONFIG, HandoffStatus } from '@/types/handoff.types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface HandoffListProps {
  handoffs: HandoffWithDetails[]
  isLoading: boolean
  onHandoffClick: (handoff: HandoffWithDetails) => void
}

export function HandoffList({ handoffs, isLoading, onHandoffClick }: HandoffListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Devirler yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!handoffs || handoffs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Devir Bulunamadı</h3>
            <p className="text-gray-600 mb-4">
              Henüz hiç vardiya devri oluşturulmamış.
            </p>
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              İlk Devri Oluştur
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-200">
        {handoffs.map((handoff) => (
          <HandoffListItem
            key={(handoff as any).id}
            handoff={handoff}
            onClick={() => onHandoffClick(handoff)}
          />
        ))}
      </div>
    </div>
  )
}

interface HandoffListItemProps {
  handoff: HandoffWithDetails
  onClick: () => void
}

function HandoffListItem({ handoff, onClick }: HandoffListItemProps) {
  const statusConfig = HANDOFF_STATUS_CONFIG[(handoff as any).status as HandoffStatus]
  const patientCount = (handoff as any)._count?.patients || 0
  const completedChecklist = (handoff as any)._count?.completed_checklist_items || 0
  const totalChecklist = (handoff as any)._count?.checklist_items || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'archived':
        return 'bg-gray-100 text-gray-500'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div
      onClick={onClick}
      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        {/* Left side - Main info */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor((handoff as any).status)}`}>
              {statusConfig.label}
            </div>

            {(handoff as any).is_ai_generated && (
              <div className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Destekli
              </div>
            )}

            <span className="text-sm text-gray-500">
              {new Date((handoff as any).handoff_date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>

            <span className="text-sm text-gray-400">
              {formatDistanceToNow(new Date((handoff as any).created_at), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          </div>

          {/* Users */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Veren:</span>
              <span className="text-sm font-medium text-gray-900">
                {(handoff as any).from_user?.full_name || 'Bilinmiyor'}
              </span>
            </div>

            <div className="text-gray-300">→</div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Alan:</span>
              <span className="text-sm font-medium text-gray-900">
                {(handoff as any).to_user?.full_name || 'Bilinmiyor'}
              </span>
            </div>
          </div>

          {/* Summary */}
          {(handoff as any).summary && (
            <p className="text-sm text-gray-700 line-clamp-2 mb-3">
              {(handoff as any).summary}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{patientCount} hasta</span>
            </div>

            {totalChecklist > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>
                  {completedChecklist}/{totalChecklist} görev
                </span>
              </div>
            )}

            {(handoff as any).shift?.shift_definition && (
              <div
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${(handoff as any).shift.shift_definition.color}20`,
                  color: (handoff as any).shift.shift_definition.color,
                }}
              >
                {(handoff as any).shift.shift_definition.name}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Status icon */}
        <div className="ml-4">
          {(handoff as any).status === 'completed' ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (handoff as any).status === 'pending_review' ? (
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          ) : (
            <Clock className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  )
}
