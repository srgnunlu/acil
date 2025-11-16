/**
 * TaskCard Component
 * Displays a task card with priority, status, assignee, and progress
 */

'use client'

import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageSquare,
  Paperclip,
  CheckSquare,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import type { TaskWithDetails, TaskPriority, TaskStatus } from '@/types/task.types'
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/types/task.types'
import { useUpdateTaskStatus, useDeleteTask } from '@/lib/hooks/useTasks'

interface TaskCardProps {
  task: TaskWithDetails
  onClick?: () => void
  onEdit?: (task: TaskWithDetails) => void
  compact?: boolean
}

export function TaskCard({ task, onClick, onEdit, compact = false }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const updateStatusMutation = useUpdateTaskStatus()
  const deleteMutation = useDeleteTask()

  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority as TaskPriority]
  const statusConfig = TASK_STATUS_CONFIG[task.status as TaskStatus]

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    !['completed', 'cancelled'].includes(task.status)
  const isCompleted = task.status === 'completed'
  const isCancelled = task.status === 'cancelled'

  const checklistProgress = task._count
    ? (task._count.completed_checklist_items || 0) / (task._count.checklist_items || 1)
    : 0

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateStatusMutation.mutateAsync({ id: task.id, status: 'completed' })
      setShowMenu(false)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateStatusMutation.mutateAsync({ id: task.id, status: 'cancelled' })
      setShowMenu(false)
    } catch (error) {
      console.error('Failed to cancel task:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteMutation.mutateAsync(task.id)
        setShowMenu(false)
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(task)
    setShowMenu(false)
  }

  const isLoading = updateStatusMutation.isPending || deleteMutation.isPending

  return (
    <div
      className={`
        group relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-all
        ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-300'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* Priority indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg`}
        style={{
          backgroundColor:
            priorityConfig.color === 'red'
              ? '#ef4444'
              : priorityConfig.color === 'orange'
                ? '#f97316'
                : priorityConfig.color === 'yellow'
                  ? '#eab308'
                  : '#6b7280',
        }}
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
            <h3
              className={`font-medium text-gray-900 line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}
            >
              {task.title}
            </h3>
            {!compact && task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status badge */}
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                statusConfig.color === 'green'
                  ? 'bg-green-100 text-green-700'
                  : statusConfig.color === 'blue'
                    ? 'bg-blue-100 text-blue-700'
                    : statusConfig.color === 'yellow'
                      ? 'bg-yellow-100 text-yellow-700'
                      : statusConfig.color === 'red'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
              }`}
            >
              {statusConfig.label}
            </div>

            {/* Action menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                disabled={isLoading}
                className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="İşlemler"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                  />
                  <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={handleComplete}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tamamla</span>
                      </button>
                    )}

                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={handleCancel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span>İptal Et</span>
                      </button>
                    )}

                    {(isCompleted || isCancelled) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateStatusMutation.mutateAsync({ id: task.id, status: 'pending' })
                          setShowMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Circle className="w-4 h-4" />
                        <span>Yeniden Aç</span>
                      </button>
                    )}

                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Düzenle</span>
                      </button>
                    )}

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Sil</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          {/* Priority */}
          <div className="flex items-center gap-1">
            {task.priority === 'urgent' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            ) : task.priority === 'high' ? (
              <ArrowUp className="w-3.5 h-3.5 text-orange-500" />
            ) : task.priority === 'low' ? (
              <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className={task.priority === 'urgent' ? 'text-red-600 font-medium' : ''}>
              {priorityConfig.label}
            </span>
          </div>

          {/* Assignee */}
          {task.assigned_to_user && (
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{task.assigned_to_user.full_name}</span>
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <div
              className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isOverdue && 'Gecikmiş: '}
                {formatDistanceToNow(new Date(task.due_date), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            </div>
          )}

          {/* Patient */}
          {task.patient && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Hasta:</span>
              <span className="font-medium text-gray-700">{task.patient.name}</span>
            </div>
          )}
        </div>

        {/* Progress indicators */}
        {!compact && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            {/* Checklist progress */}
            {task._count && task._count.checklist_items > 0 && (
              <div className="flex items-center gap-2 flex-1">
                <CheckSquare className="w-4 h-4 text-gray-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${checklistProgress * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {task._count.completed_checklist_items}/{task._count.checklist_items}
                </span>
              </div>
            )}

            {/* Comments count */}
            {task._count && task._count.comments > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">{task._count.comments}</span>
              </div>
            )}

            {/* Attachments count */}
            {task._count && task._count.attachments > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <Paperclip className="w-4 h-4" />
                <span className="text-xs">{task._count.attachments}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {!compact && task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
