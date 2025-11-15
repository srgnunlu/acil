/**
 * Tasks Dashboard Page
 * Main page for task management
 */

'use client'

import React, { useState } from 'react'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { CheckSquare, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import type { TaskWithDetails } from '@/types/task.types'
import { useTaskStatistics } from '@/lib/hooks/useTasks'

// Mock workspace - in real app, get from context/route
const WORKSPACE_ID = '00000000-0000-0000-0000-000000000000' // Replace with actual workspace

export default function TasksPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)

  const { data: statistics, isLoading: statsLoading } = useTaskStatistics(WORKSPACE_ID, {
    enabled: false, // Will enable when workspace context is available
  })

  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task)
    // In future, navigate to task detail page
    // router.push(`/dashboard/tasks/${task.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-blue-600" />
                Görev Yönetimi
              </h1>
              <p className="text-gray-600 mt-1">Ekip görevlerinizi takip edin ve yönetin</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && !statsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Toplam Görev</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_tasks}</p>
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Devam Ediyor</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.in_progress_tasks}</p>
                </div>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gecikmiş</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.overdue_tasks}</p>
                </div>
              </div>
            </div>

            {/* High Priority */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Yüksek Öncelik</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.high_priority_tasks}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TaskList
            workspaceId={WORKSPACE_ID}
            onTaskClick={handleTaskClick}
            onCreateClick={() => setIsCreateModalOpen(true)}
            showFilters={true}
          />
        </div>

        {/* Create/Edit Task Modal */}
        <TaskFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceId={WORKSPACE_ID}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            // Optionally show success toast
          }}
        />

        {/* Info Message for Development */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Geliştirme Notu</h3>
              <p className="text-sm text-blue-800">
                Bu sayfa aktif workspace context entegrasyonunu bekliyor. Workspace ID şu anda sabit kodlanmış durumda. Production'da
                aktif workspace'ten otomatik olarak alınacaktır.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Özellikler:</strong>
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside mt-1 space-y-1">
                <li>Görev oluşturma ve düzenleme (Modal form)</li>
                <li>Öncelik, durum ve kategori filtreleme</li>
                <li>Görev arama</li>
                <li>Checklist desteği</li>
                <li>Yorum sistemi (API hazır)</li>
                <li>Real-time güncellemeler (Hook hazır)</li>
                <li>Hatırlatma sistemi (Backend hazır)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
