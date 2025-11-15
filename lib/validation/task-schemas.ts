/**
 * Task Management Validation Schemas
 * Phase 9: Zod schemas for task-related data validation
 */

import { z } from 'zod'

// =====================================================
// ENUMS
// =====================================================

export const taskPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low'])

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'])

export const taskCategorySchema = z.enum([
  'clinical',
  'administrative',
  'lab',
  'imaging',
  'medication',
  'consultation',
  'discharge',
  'other',
])

export const taskActivityTypeSchema = z.enum([
  'created',
  'updated',
  'assigned',
  'unassigned',
  'status_changed',
  'priority_changed',
  'completed',
  'cancelled',
  'commented',
  'attachment_added',
  'checklist_updated',
  'due_date_changed',
])

// =====================================================
// TASK SCHEMAS
// =====================================================

export const createTaskSchema = z.object({
  workspace_id: z.string().uuid('Geçerli bir workspace ID gerekli'),
  patient_id: z.string().uuid('Geçerli bir patient ID gerekli').optional(),
  title: z
    .string()
    .min(3, 'Görev başlığı en az 3 karakter olmalı')
    .max(200, 'Görev başlığı en fazla 200 karakter olabilir'),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('pending'),
  assigned_to: z.string().uuid('Geçerli bir user ID gerekli').optional(),
  due_date: z.string().datetime('Geçerli bir tarih formatı gerekli').optional(),
  category: taskCategorySchema.optional(),
  tags: z.array(z.string().max(50)).max(10, 'En fazla 10 etiket eklenebilir').optional(),
  template_id: z.string().uuid().optional(),
  reminder_enabled: z.boolean().default(false),
  reminder_before_minutes: z.number().int().min(5).max(10080).optional(), // Max 1 week
  checklist_items: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        order_index: z.number().int().min(0).optional(),
        assigned_to: z.string().uuid().optional(),
      })
    )
    .optional(),
})

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Görev başlığı en az 3 karakter olmalı')
    .max(200, 'Görev başlığı en fazla 200 karakter olabilir')
    .optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  assigned_to: z.string().uuid('Geçerli bir user ID gerekli').nullable().optional(),
  due_date: z.string().datetime('Geçerli bir tarih formatı gerekli').nullable().optional(),
  category: taskCategorySchema.nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  reminder_enabled: z.boolean().optional(),
  reminder_before_minutes: z.number().int().min(5).max(10080).nullable().optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
})

export const taskFiltersSchema = z.object({
  workspace_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  priority: z.union([taskPrioritySchema, z.array(taskPrioritySchema)]).optional(),
  category: z.union([taskCategorySchema, z.array(taskCategorySchema)]).optional(),
  tags: z.array(z.string()).optional(),
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
  is_overdue: z.boolean().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'updated_at', 'due_date', 'priority', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// =====================================================
// TASK TEMPLATE SCHEMAS
// =====================================================

export const createTaskTemplateSchema = z.object({
  workspace_id: z.string().uuid('Geçerli bir workspace ID gerekli'),
  organization_id: z.string().uuid().optional(),
  name: z.string().min(3, 'Template adı en az 3 karakter olmalı').max(100),
  description: z.string().max(500).optional(),
  category: taskCategorySchema.optional(),
  default_priority: taskPrioritySchema.default('medium'),
  default_duration_minutes: z.number().int().min(5).max(43200).optional(), // Max 30 days
  default_reminder_before_minutes: z.number().int().min(5).max(10080).optional(),
  title_template: z
    .string()
    .min(3, 'Başlık şablonu en az 3 karakter olmalı')
    .max(200, 'Başlık şablonu en fazla 200 karakter olabilir'),
  description_template: z.string().max(2000).optional(),
  checklist_items: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        order: z.number().int().min(0),
      })
    )
    .optional(),
  default_tags: z.array(z.string().max(50)).max(10).optional(),
})

export const updateTaskTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  category: taskCategorySchema.optional(),
  default_priority: taskPrioritySchema.optional(),
  default_duration_minutes: z.number().int().min(5).max(43200).optional(),
  default_reminder_before_minutes: z.number().int().min(5).max(10080).optional(),
  title_template: z.string().min(3).max(200).optional(),
  description_template: z.string().max(2000).optional(),
  checklist_items: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        order: z.number().int().min(0),
      })
    )
    .optional(),
  default_tags: z.array(z.string().max(50)).max(10).optional(),
  is_active: z.boolean().optional(),
})

// =====================================================
// CHECKLIST ITEM SCHEMAS
// =====================================================

export const createChecklistItemSchema = z.object({
  task_id: z.string().uuid('Geçerli bir task ID gerekli'),
  title: z.string().min(1, 'Checklist başlığı gerekli').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().max(500).optional(),
  order_index: z.number().int().min(0).default(0),
  assigned_to: z.string().uuid().optional(),
})

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  order_index: z.number().int().min(0).optional(),
  is_completed: z.boolean().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})

export const reorderChecklistItemsSchema = z.object({
  task_id: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order_index: z.number().int().min(0),
    })
  ),
})

// =====================================================
// COMMENT SCHEMAS
// =====================================================

export const createTaskCommentSchema = z.object({
  task_id: z.string().uuid('Geçerli bir task ID gerekli'),
  content: z
    .string()
    .min(1, 'Yorum içeriği gerekli')
    .max(2000, 'Yorum en fazla 2000 karakter olabilir'),
  mentions: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        full_name: z.string(),
      })
    )
    .optional(),
})

export const updateTaskCommentSchema = z.object({
  content: z.string().min(1).max(2000),
})

// =====================================================
// ATTACHMENT SCHEMAS
// =====================================================

export const createTaskAttachmentSchema = z.object({
  task_id: z.string().uuid('Geçerli bir task ID gerekli'),
  file_name: z.string().min(1, 'Dosya adı gerekli').max(255),
  file_size: z.number().int().min(1).max(10485760).optional(), // Max 10MB
  file_type: z.string().max(100).optional(),
  file_url: z.string().url('Geçerli bir URL gerekli'),
  storage_path: z.string().max(500).optional(),
})

// =====================================================
// BULK OPERATION SCHEMAS
// =====================================================

export const bulkTaskOperationSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'En az bir görev seçilmeli').max(50, 'En fazla 50 görev seçilebilir'),
  operation: z.enum(['update_status', 'update_priority', 'assign', 'delete', 'add_tag', 'remove_tag']),
  params: z
    .object({
      status: taskStatusSchema.optional(),
      priority: taskPrioritySchema.optional(),
      assigned_to: z.string().uuid().optional(),
      tag: z.string().max(50).optional(),
    })
    .optional(),
})

// =====================================================
// REMINDER SCHEMAS
// =====================================================

export const taskReminderSchema = z.object({
  task_id: z.string().uuid(),
  task_title: z.string(),
  due_date: z.string().datetime(),
  assigned_to: z.string().uuid(),
  workspace_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(),
})

// =====================================================
// TYPE EXPORTS
// =====================================================

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>

export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>
export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>
export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentSchema>

export type CreateTaskAttachmentInput = z.infer<typeof createTaskAttachmentSchema>

export type BulkTaskOperationInput = z.infer<typeof bulkTaskOperationSchema>

export type TaskReminderInput = z.infer<typeof taskReminderSchema>
