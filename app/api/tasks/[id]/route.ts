/**
 * Task Detail API Route
 * GET /api/tasks/[id] - Get task by ID
 * PATCH /api/tasks/[id] - Update task
 * DELETE /api/tasks/[id] - Delete task (soft delete)
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateTaskSchema } from '@/lib/validation/task-schemas'
import { logger } from '@/lib/logger'
import type { TaskWithDetails } from '@/types/task.types'

// =====================================================
// GET /api/tasks/[id] - Get task details
// =====================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch task with all related data
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select(
        `
        *,
        assigned_to_user:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, specialty),
        assigned_by_user:profiles!tasks_assigned_by_fkey(id, full_name),
        created_by_user:profiles!tasks_created_by_fkey(id, full_name),
        patient:patients(id, name, age, gender),
        workspace:workspaces(id, name, color, icon),
        template:task_templates(id, name)
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 3. Check workspace access
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', task.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Fetch checklist items
    const { data: checklistItems } = await supabase
      .from('task_checklist_items')
      .select(
        `
        *,
        assigned_to_user:profiles!task_checklist_items_assigned_to_fkey(id, full_name),
        completed_by_user:profiles!task_checklist_items_completed_by_fkey(id, full_name)
      `
      )
      .eq('task_id', task.id)
      .order('order_index', { ascending: true })

    // 5. Fetch comments
    const { data: comments } = await supabase
      .from('task_comments')
      .select(
        `
        *,
        author:profiles!task_comments_created_by_fkey(id, full_name, avatar_url)
      `
      )
      .eq('task_id', task.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // 6. Fetch attachments
    const { data: attachments } = await supabase
      .from('task_attachments')
      .select(
        `
        *,
        uploader:profiles!task_attachments_uploaded_by_fkey(id, full_name)
      `
      )
      .eq('task_id', task.id)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    // 7. Fetch activity log (last 20 activities)
    const { data: activityLog } = await supabase
      .from('task_activity_log')
      .select(
        `
        *,
        performed_by_user:profiles!task_activity_log_performed_by_fkey(id, full_name)
      `
      )
      .eq('task_id', task.id)
      .order('performed_at', { ascending: false })
      .limit(20)

    // 8. Build enhanced task response
    const enhancedTask: TaskWithDetails = {
      ...task,
      checklist_items: checklistItems || [],
      comments: comments || [],
      attachments: attachments || [],
      activity_log: activityLog || [],
      _count: {
        checklist_items: checklistItems?.length || 0,
        completed_checklist_items: checklistItems?.filter((item) => item.is_completed).length || 0,
        comments: comments?.length || 0,
        attachments: attachments?.length || 0,
      },
    }

    return NextResponse.json({ task: enhancedTask })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/tasks/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// PATCH /api/tasks/[id] - Update task
// =====================================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = updateTaskSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 3. Fetch existing task
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*, workspace:workspaces(id)')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 4. Check permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingTask.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user can update this task
    const canUpdate =
      existingTask.created_by === user.id ||
      existingTask.assigned_to === user.id ||
      ['owner', 'admin', 'senior_doctor'].includes(membership.role)

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions to update this task' }, { status: 403 })
    }

    // 5. If assigned_to is being changed, verify new assignee is workspace member
    if (data.assigned_to) {
      const { data: assignedMember } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', existingTask.workspace_id)
        .eq('user_id', data.assigned_to)
        .eq('status', 'active')
        .single()

      if (!assignedMember) {
        return NextResponse.json({ error: 'Assigned user is not a member of this workspace' }, { status: 400 })
      }
    }

    // 6. Prepare update data with tracking
    const updateData: any = { ...data }

    // Auto-set completed_at when status changes to completed
    if (data.status === 'completed' && existingTask.status !== 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (data.status && data.status !== 'completed') {
      updateData.completed_at = null
    }

    // Auto-set started_at when status changes to in_progress
    if (data.status === 'in_progress' && existingTask.status !== 'in_progress' && !existingTask.started_at) {
      updateData.started_at = new Date().toISOString()
    }

    // 7. Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        assigned_to_user:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
        assigned_by_user:profiles!tasks_assigned_by_fkey(id, full_name),
        created_by_user:profiles!tasks_created_by_fkey(id, full_name),
        patient:patients(id, name),
        workspace:workspaces(id, name, color)
      `
      )
      .single()

    if (updateError) {
      logger.error({ error: updateError, taskId: id }, 'Failed to update task')
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // 8. Log specific changes
    const changedFields = Object.keys(data)

    // Log status change
    if (data.status && data.status !== existingTask.status) {
      await supabase.from('task_activity_log').insert({
        task_id: id,
        activity_type: 'status_changed',
        field_name: 'status',
        old_value: existingTask.status,
        new_value: data.status,
        performed_by: user.id,
      })
    }

    // Log priority change
    if (data.priority && data.priority !== existingTask.priority) {
      await supabase.from('task_activity_log').insert({
        task_id: id,
        activity_type: 'priority_changed',
        field_name: 'priority',
        old_value: existingTask.priority,
        new_value: data.priority,
        performed_by: user.id,
      })
    }

    // Log assignment change
    if (data.assigned_to !== undefined && data.assigned_to !== existingTask.assigned_to) {
      await supabase.from('task_activity_log').insert({
        task_id: id,
        activity_type: data.assigned_to ? 'assigned' : 'unassigned',
        field_name: 'assigned_to',
        old_value: existingTask.assigned_to || '',
        new_value: data.assigned_to || '',
        performed_by: user.id,
      })

      // Send notification to new assignee
      if (data.assigned_to && data.assigned_to !== user.id) {
        await supabase.from('notifications').insert({
          user_id: data.assigned_to,
          workspace_id: existingTask.workspace_id,
          type: 'task_assigned',
          title: 'Görev size atandı',
          message: `"${updatedTask.title}" görevi size atandı`,
          link: `/dashboard/tasks/${id}`,
          related_patient_id: existingTask.patient_id,
          data: {
            task_id: id,
            assigned_by: user.id,
          },
        })
      }
    }

    // Generic activity log for other changes
    if (changedFields.length > 0) {
      await supabase.from('task_activity_log').insert({
        task_id: id,
        activity_type: 'updated',
        metadata: { updated_fields: changedFields },
        performed_by: user.id,
      })
    }

    logger.info({ taskId: id, userId: user.id, changes: changedFields }, 'Task updated successfully')

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in PATCH /api/tasks/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// DELETE /api/tasks/[id] - Delete task (soft delete)
// =====================================================

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch existing task
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('workspace_id, title, created_by')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 3. Check permissions (only owner/admin/senior_doctor can delete)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingTask.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canDelete = ['owner', 'admin', 'senior_doctor'].includes(membership.role) || existingTask.created_by === user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this task' }, { status: 403 })
    }

    // 4. Soft delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      logger.error({ error: deleteError, taskId: id }, 'Failed to delete task')
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    // 5. Log deletion
    await supabase.from('task_activity_log').insert({
      task_id: id,
      activity_type: 'deleted',
      performed_by: user.id,
    })

    logger.info({ taskId: id, userId: user.id }, 'Task deleted successfully')

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in DELETE /api/tasks/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
