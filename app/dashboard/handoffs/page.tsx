/**
 * Handoffs Dashboard Page
 * Main page for shift handoff management
 */

'use client'

import React, { useState } from 'react'
import { HandoffList } from '@/components/handoffs/HandoffList'
import { HandoffCreateModal } from '@/components/handoffs/HandoffCreateModal'
import { ClipboardList, Users, AlertCircle, Plus, Sparkles } from 'lucide-react'
import type { HandoffWithDetails, HandoffStatus } from '@/types/handoff.types'
import { useHandoffs, usePendingHandoffs, useRealtimeHandoffs } from '@/lib/hooks/useHandoffs'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useRouter } from 'next/navigation'

export default function HandoffsPage() {
  const router = useRouter()
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const user: any = null // TODO: Get user from auth context
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<HandoffStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'all' | 'given' | 'received'>('all')

  const workspaceId = currentWorkspace?.id || null
  const userId = user?.id || null

  // Build filters based on view mode
  const filters = {
    workspace_id: workspaceId!,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(viewMode === 'given' && { from_user_id: userId! }),
    ...(viewMode === 'received' && { to_user_id: userId! }),
  }

  const { data: handoffsData, isLoading } = useHandoffs(filters)
  const { data: pendingData } = usePendingHandoffs(userId || '', workspaceId || '')

  // Enable real-time updates
  useRealtimeHandoffs(workspaceId || '', !!workspaceId)

  const handleHandoffClick = (handoff: HandoffWithDetails) => {
    router.push(`/dashboard/handoffs/${(handoff as any).id}`)
  }

  const handleCreateHandoff = () => {
    setIsCreateModalOpen(true)
  }

  // Show loading state while workspace is loading
  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Workspace yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show message if no workspace selected
  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Workspace Seçilmedi</h2>
                <p className="text-gray-600">
                  Vardiya devir sistemi kullanmak için lütfen bir workspace seçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pendingCount = pendingData?.handoffs?.length || 0
  const totalHandoffs = handoffsData?.total || 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-blue-600" />
                Vardiya Devir Sistemi
              </h1>
              <p className="text-gray-600 mt-1">
                {currentWorkspace?.name} workspace&apos;inde vardiya devirlerini yönetin
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateHandoff}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Yeni Devir
              </button>

              <button
                onClick={() => router.push('/dashboard/shifts')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Users className="w-5 h-5" />
                Vardiya Yönetimi
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pending Handoffs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bekleyen Devirler</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>

          {/* Total Handoffs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Devir</p>
                <p className="text-2xl font-bold text-gray-900">{totalHandoffs}</p>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center gap-4">
              <Sparkles className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">AI Destekli Devir</p>
                <button
                  onClick={handleCreateHandoff}
                  className="mt-1 text-sm font-semibold underline hover:opacity-80"
                >
                  Hemen Oluştur →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Görünüm:</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setViewMode('given')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'given'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Verdiğim
                </button>
                <button
                  onClick={() => setViewMode('received')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'received'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Aldığım
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Durum:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                <option value="draft">Taslak</option>
                <option value="pending_review">İnceleme Bekliyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="archived">Arşivlendi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Handoff List */}
        <HandoffList
          handoffs={handoffsData?.handoffs || []}
          isLoading={isLoading}
          onHandoffClick={handleHandoffClick}
        />

        {/* Create Handoff Modal */}
        <HandoffCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  )
}
