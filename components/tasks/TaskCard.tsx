/**
 * TaskCard Component
 * Displays a task card with priority, status, assignee, and progress
 */

'use client'

import React from 'react'
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
} from 'lucide-react'
import type { TaskWithDetails, TaskPriority, TaskStatus } from '@/types/task.types'
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/types/task.types'

interface TaskCardProps {
  task: TaskWithDetails
  onClick?: () => void
  compact?: boolean
}

export function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority as TaskPriority]
  const statusConfig = TASK_STATUS_CONFIG[task.status as TaskStatus]

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed', 'cancelled'].includes(task.status)

  const checklistProgress = task._count
    ? (task._count.completed_checklist_items || 0) / (task._count.checklist_items || 1)
    : 0

  return (
    <div
      className={`
        group relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer
        ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-300'}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={onClick}
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
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
              {task.title}
            </h3>
            {!compact && task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Status badge */}
          <div
            className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
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
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
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
            {task.tags.length > 3 && <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
