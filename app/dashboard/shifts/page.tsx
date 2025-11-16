/**
 * Shifts Management Page
 * Manage shift schedules and definitions
 */

'use client'

import React, { useState } from 'react'
import { Calendar, Clock, Users, Plus, AlertCircle } from 'lucide-react'
import { useShifts, useCurrentShift, useRealtimeShifts } from '@/lib/hooks/useShifts'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useRouter } from 'next/navigation'
import { SHIFT_SCHEDULE_STATUS_CONFIG } from '@/types/handoff.types'

export default function ShiftsPage() {
  const router = useRouter()
  const { currentWorkspace, isLoading: workspaceLoading, user } = useWorkspace()
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  const workspaceId = currentWorkspace?.id || null
  const userId = user?.id || null

  const { data: shiftsData, isLoading } = useShifts({
    workspace_id: workspaceId!,
    shift_date_from: dateFilter,
    shift_date_to: dateFilter,
  })

  const { data: currentShiftData } = useCurrentShift(userId || '', workspaceId || '')

  // Enable real-time updates
  useRealtimeShifts(workspaceId || '', !!workspaceId)

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
                  Vardiya yönetimini kullanmak için lütfen bir workspace seçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const shifts = shiftsData?.shifts || []
  const currentShift = currentShiftData?.shifts?.[0] || null
  const totalShifts = shiftsData?.total || 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                Vardiya Yönetimi
              </h1>
              <p className="text-gray-600 mt-1">
                {currentWorkspace?.name} workspace&apos;inde vardiya planlaması yapın
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/handoffs')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Users className="w-5 h-5" />
                Devirler
              </button>

              <button
                onClick={() => {}}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Yeni Vardiya
              </button>
            </div>
          </div>
        </div>

        {/* Current Shift Card */}
        {currentShift && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Aktif Vardiya</h3>
                <p className="text-green-100">
                  {currentShift.shift_definition?.name || 'Vardiya'}
                </p>
                <p className="text-sm text-green-100 mt-1">
                  {new Date(currentShift.start_time).toLocaleTimeString('tr-TR')} -{' '}
                  {new Date(currentShift.end_time).toLocaleTimeString('tr-TR')}
                </p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm font-medium mb-2">
                  {currentShift.status === 'active' ? 'Aktif' : currentShift.status}
                </div>
                {currentShift.checked_in_at && (
                  <p className="text-sm text-green-100">
                    Giriş: {new Date(currentShift.checked_in_at).toLocaleTimeString('tr-TR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">
              {totalShifts} vardiya planlanmış
            </span>
          </div>
        </div>

        {/* Shifts List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Vardiyalar yükleniyor...</p>
              </div>
            </div>
          </div>
        ) : shifts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vardiya Bulunamadı</h3>
                <p className="text-gray-600 mb-4">
                  Seçilen tarihte hiç vardiya planlanmamış.
                </p>
                <button
                  onClick={() => {}}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Vardiya Ekle
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {shifts.map((shift: any) => (
                <div key={shift.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: shift.shift_definition?.color || '#3b82f6' }}
                        ></div>
                        <h3 className="font-semibold text-gray-900">
                          {shift.shift_definition?.name || 'Vardiya'}
                        </h3>
                        <div
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            shift.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : shift.status === 'completed'
                              ? 'bg-gray-100 text-gray-700'
                              : shift.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {SHIFT_SCHEDULE_STATUS_CONFIG[shift.status]?.label || shift.status}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Görevli:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {shift.user?.full_name || 'Bilinmiyor'}
                        </span>
                        {shift.user?.specialty && (
                          <span className="text-sm text-gray-500">({shift.user.specialty})</span>
                        )}
                      </div>

                      {/* Time Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(shift.start_time).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} -{' '}
                            {new Date(shift.end_time).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {shift.checked_in_at && (
                          <span className="text-green-600">
                            ✓ Giriş: {new Date(shift.checked_in_at).toLocaleTimeString('tr-TR')}
                          </span>
                        )}

                        {shift.checked_out_at && (
                          <span className="text-gray-600">
                            Çıkış: {new Date(shift.checked_out_at).toLocaleTimeString('tr-TR')}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {shift.notes && (
                        <p className="text-sm text-gray-600 mt-2">{shift.notes}</p>
                      )}

                      {/* Handoff */}
                      {shift.handoff && shift.handoff.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => router.push(`/dashboard/handoffs/${shift.handoff[0].id}`)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Devir Kaydı Görüntüle →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
