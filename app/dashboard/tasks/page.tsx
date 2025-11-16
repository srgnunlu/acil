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
import { useWorkspace } from '@/contexts/WorkspaceContext'

export default function TasksPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)

  const workspaceId = currentWorkspace?.id || null

  const { data: statistics, isLoading: statsLoading } = useTaskStatistics(workspaceId || '', {
    enabled: !!workspaceId && !workspaceLoading,
  })

  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task)
    // In future, navigate to task detail page
    // router.push(`/dashboard/tasks/${task.id}`)
  }

  const handleEditTask = (task: TaskWithDetails) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
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
                  Görev yönetimini kullanmak için lütfen bir workspace seçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
              <p className="text-gray-600 mt-1">
                {currentWorkspace?.name} workspace&apos;inde görevlerinizi takip edin ve yönetin
              </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.high_priority_tasks}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TaskList
            workspaceId={workspaceId}
            onTaskClick={handleTaskClick}
            onEdit={handleEditTask}
            onCreateClick={() => setIsCreateModalOpen(true)}
            showFilters={true}
          />
        </div>

        {/* Create Task Modal */}
        <TaskFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceId={workspaceId}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            // Optionally show success toast
          }}
        />

        {/* Edit Task Modal */}
        <TaskFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedTask(null)
          }}
          workspaceId={workspaceId}
          task={selectedTask || undefined}
          onSuccess={() => {
            setIsEditModalOpen(false)
            setSelectedTask(null)
            // Optionally show success toast
          }}
        />
      </div>
    </div>
  )
}
