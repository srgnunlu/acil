/**
 * TaskFormModal Component
 * Modal form for creating/editing tasks
 */

'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Calendar, Tag, AlertCircle } from 'lucide-react'
import { useCreateTask, useUpdateTask } from '@/lib/hooks/useTasks'
import type { TaskWithDetails, TaskPriority, TaskStatus, TaskCategory } from '@/types/task.types'
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, TASK_CATEGORY_CONFIG } from '@/types/task.types'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  patientId?: string
  task?: TaskWithDetails // If editing
  onSuccess?: () => void
}

export function TaskFormModal({
  isOpen,
  onClose,
  workspaceId,
  patientId,
  task,
  onSuccess,
}: TaskFormModalProps) {
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  const isEditing = !!task

  // Initialize form data based on task prop
  const getInitialFormData = () => {
    if (task) {
      return {
        title: task.title,
        description: task.description || '',
        priority: task.priority as TaskPriority,
        status: task.status as TaskStatus,
        category: (task.category as TaskCategory) || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        assigned_to: task.assigned_to || '',
        tags: task.tags || [],
        reminder_enabled: task.reminder_enabled || false,
        reminder_before_minutes: task.reminder_before_minutes ?? 60,
      }
    }
    return {
      title: '',
      description: '',
      priority: 'medium' as TaskPriority,
      status: 'pending' as TaskStatus,
      category: '' as TaskCategory | '',
      due_date: '',
      assigned_to: '',
      tags: [] as string[],
      reminder_enabled: false,
      reminder_before_minutes: 60,
    }
  }

  // Form state
  const [formData, setFormData] = useState(getInitialFormData)

  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Convert due_date from datetime-local format to ISO string
      let dueDate: string | undefined = undefined
      if (formData.due_date) {
        // datetime-local format: "YYYY-MM-DDTHH:mm"
        // Convert to ISO string: "YYYY-MM-DDTHH:mm:ss.sssZ"
        const date = new Date(formData.due_date)
        if (!isNaN(date.getTime())) {
          dueDate = date.toISOString()
        }
      }

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        status: formData.status,
        category: formData.category || undefined,
        due_date: dueDate,
        assigned_to: formData.assigned_to || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        reminder_enabled: formData.reminder_enabled,
        reminder_before_minutes: formData.reminder_enabled
          ? formData.reminder_before_minutes
          : undefined,
      }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: task.id, data: payload })
      } else {
        await createMutation.mutateAsync({
          ...payload,
          workspace_id: workspaceId,
          patient_id: patientId || undefined,
        } as any)
      }

      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Görev kaydedilirken bir hata oluştu'
      setError(errorMessage)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  if (!isOpen) return null

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Görevi Düzenle' : 'Yeni Görev'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görev Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Lab sonuçlarını kontrol et"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Görev detaylarını yazın..."
            />
          </div>

          {/* Priority, Status, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(TASK_PRIORITY_CONFIG).map((config) => (
                  <option key={config.value} value={config.value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as TaskStatus }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(TASK_STATUS_CONFIG).map((config) => (
                  <option key={config.value} value={config.value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value as TaskCategory }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                {Object.values(TASK_CATEGORY_CONFIG).map((config) => (
                  <option key={config.value} value={config.value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Bitiş Tarihi
            </label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              Etiketler
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Etiket ekle..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Ekle
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.reminder_enabled}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reminder_enabled: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Hatırlatma gönder</span>
            </label>

            {formData.reminder_enabled && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">
                  Bitiş tarihinden önce (dakika)
                </label>
                <input
                  type="number"
                  min="5"
                  max="10080"
                  value={formData.reminder_before_minutes ?? 60}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    if (inputValue === '') {
                      setFormData((prev) => ({ ...prev, reminder_before_minutes: 60 }))
                      return
                    }
                    const value = parseInt(inputValue, 10)
                    if (!isNaN(value)) {
                      setFormData((prev) => ({
                        ...prev,
                        reminder_before_minutes: Math.max(5, Math.min(10080, value)),
                      }))
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Güncelle' : 'Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
