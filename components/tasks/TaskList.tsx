/**
 * TaskList Component
 * Displays a list of tasks with filtering and sorting
 */

'use client'

import React, { useState } from 'react'
import { Plus, Filter, Search, Loader2 } from 'lucide-react'
import { TaskCard } from './TaskCard'
import type { TaskWithDetails, TaskFilters, TaskStatus, TaskPriority } from '@/types/task.types'
import { useTasks } from '@/lib/hooks/useTasks'

interface TaskListProps {
  workspaceId: string
  patientId?: string
  filters?: Partial<TaskFilters>
  onTaskClick?: (task: TaskWithDetails) => void
  onEdit?: (task: TaskWithDetails) => void
  onCreateClick?: () => void
  showFilters?: boolean
  compact?: boolean
}

export function TaskList({
  workspaceId,
  patientId,
  filters: externalFilters = {},
  onTaskClick,
  onEdit,
  onCreateClick,
  showFilters = true,
  compact = false,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Build filters
  const filters: TaskFilters = {
    workspace_id: workspaceId,
    patient_id: patientId,
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TaskStatus) : undefined,
    priority: priorityFilter !== 'all' ? (priorityFilter as TaskPriority) : undefined,
    ...externalFilters,
  }

  const { data, isLoading, error } = useTasks(filters)

  const tasks = data?.tasks || []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Görevler</h2>
          {pagination && (
            <p className="text-sm text-gray-600 mt-1">
              Toplam {pagination.total} görev{pagination.total > 1 ? '' : ''}
            </p>
          )}
        </div>

        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Görev ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="on_hold">Beklemede</option>
            <option value="cancelled">İptal Edildi</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="urgent">Acil</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Görevler yüklenirken bir hata oluştu.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Görev bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Filtrelere uygun görev bulunamadı.'
              : 'Henüz görev oluşturulmamış.'}
          </p>
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Görevi Oluştur</span>
            </button>
          )}
        </div>
      )}

      {/* Task list */}
      {!isLoading && !error && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              onEdit={onEdit}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sayfa {pagination.page} / {pagination.total_pages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <button
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
