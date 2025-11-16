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

    // 3. Fetch user profiles
    const userIds = new Set<string>()
    if (task.assigned_to) userIds.add(task.assigned_to)
    if (task.assigned_by) userIds.add(task.assigned_by)
    if (task.created_by) userIds.add(task.created_by)

    const { data: profiles } =
      userIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, specialty')
            .in('user_id', Array.from(userIds))
        : { data: null }

    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.user_id,
        { id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url, specialty: p.specialty },
      ])
    )

    // 4. Check workspace access
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

    // 5. Fetch checklist items
    const { data: checklistItems } = await supabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', task.id)
      .order('order_index', { ascending: true })

    // Fetch checklist user profiles
    const checklistUserIds = new Set<string>()
    checklistItems?.forEach((item) => {
      if (item.assigned_to) checklistUserIds.add(item.assigned_to)
      if (item.completed_by) checklistUserIds.add(item.completed_by)
    })

    const { data: checklistProfiles } =
      checklistUserIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', Array.from(checklistUserIds))
        : { data: null }

    const checklistProfileMap = new Map(
      (checklistProfiles || []).map((p) => [p.user_id, { id: p.user_id, full_name: p.full_name }])
    )

    const enhancedChecklistItems = checklistItems?.map((item) => ({
      ...item,
      assigned_to_user: item.assigned_to ? checklistProfileMap.get(item.assigned_to) || null : null,
      completed_by_user: item.completed_by
        ? checklistProfileMap.get(item.completed_by) || null
        : null,
    }))

    // 6. Fetch comments
    const { data: comments } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Fetch comment author profiles
    const commentUserIds = new Set<string>()
    comments?.forEach((comment) => {
      if (comment.created_by) commentUserIds.add(comment.created_by)
    })

    const { data: commentProfiles } =
      commentUserIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', Array.from(commentUserIds))
        : { data: null }

    const commentProfileMap = new Map(
      (commentProfiles || []).map((p) => [
        p.user_id,
        { id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url },
      ])
    )

    const enhancedComments = comments?.map((comment) => ({
      ...comment,
      author: comment.created_by ? commentProfileMap.get(comment.created_by) || null : null,
    }))

    // 7. Fetch attachments
    const { data: attachments } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', task.id)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    // Fetch attachment uploader profiles
    const attachmentUserIds = new Set<string>()
    attachments?.forEach((attachment) => {
      if (attachment.uploaded_by) attachmentUserIds.add(attachment.uploaded_by)
    })

    const { data: attachmentProfiles } =
      attachmentUserIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', Array.from(attachmentUserIds))
        : { data: null }

    const attachmentProfileMap = new Map(
      (attachmentProfiles || []).map((p) => [p.user_id, { id: p.user_id, full_name: p.full_name }])
    )

    const enhancedAttachments = attachments?.map((attachment) => ({
      ...attachment,
      uploader: attachment.uploaded_by
        ? attachmentProfileMap.get(attachment.uploaded_by) || null
        : null,
    }))

    // 8. Fetch activity log (last 20 activities)
    const { data: activityLog } = await supabase
      .from('task_activity_log')
      .select('*')
      .eq('task_id', task.id)
      .order('performed_at', { ascending: false })
      .limit(20)

    // Fetch activity log user profiles
    const activityUserIds = new Set<string>()
    activityLog?.forEach((activity) => {
      if (activity.performed_by) activityUserIds.add(activity.performed_by)
    })

    const { data: activityProfiles } =
      activityUserIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', Array.from(activityUserIds))
        : { data: null }

    const activityProfileMap = new Map(
      (activityProfiles || []).map((p) => [p.user_id, { id: p.user_id, full_name: p.full_name }])
    )

    const enhancedActivityLog = activityLog?.map((activity) => ({
      ...activity,
      performed_by_user: activity.performed_by
        ? activityProfileMap.get(activity.performed_by) || null
        : null,
    }))

    // 9. Build enhanced task response
    const enhancedTask: TaskWithDetails = {
      ...task,
      assigned_to_user: task.assigned_to ? profileMap.get(task.assigned_to) || null : null,
      assigned_by_user: task.assigned_by ? profileMap.get(task.assigned_by) || null : null,
      created_by_user: task.created_by ? profileMap.get(task.created_by) || null : null,
      checklist_items: enhancedChecklistItems || [],
      comments: enhancedComments || [],
      attachments: enhancedAttachments || [],
      activity_log: enhancedActivityLog || [],
      _count: {
        checklist_items: enhancedChecklistItems?.length || 0,
        completed_checklist_items:
          enhancedChecklistItems?.filter((item) => item.is_completed).length || 0,
        comments: enhancedComments?.length || 0,
        attachments: enhancedAttachments?.length || 0,
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
      return NextResponse.json(
        { error: 'Insufficient permissions to update this task' },
        { status: 403 }
      )
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
        return NextResponse.json(
          { error: 'Assigned user is not a member of this workspace' },
          { status: 400 }
        )
      }
    }

    // 6. Prepare update data with tracking
    const updateData: Record<string, unknown> = { ...data }

    // Auto-set completed_at when status changes to completed
    if (data.status === 'completed' && existingTask.status !== 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (data.status && data.status !== 'completed') {
      updateData.completed_at = null
    }

    // Auto-set started_at when status changes to in_progress
    if (
      data.status === 'in_progress' &&
      existingTask.status !== 'in_progress' &&
      !existingTask.started_at
    ) {
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
        patient:patients(id, name),
        workspace:workspaces(id, name, color)
      `
      )
      .single()

    if (updateError) {
      logger.error({ error: updateError, taskId: id }, 'Failed to update task')
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Fetch user profiles for updated task
    const updatedUserIds = new Set<string>()
    if (updatedTask.assigned_to) updatedUserIds.add(updatedTask.assigned_to)
    if (updatedTask.assigned_by) updatedUserIds.add(updatedTask.assigned_by)
    if (updatedTask.created_by) updatedUserIds.add(updatedTask.created_by)

    const { data: updatedProfiles } =
      updatedUserIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', Array.from(updatedUserIds))
        : { data: null }

    const updatedProfileMap = new Map(
      (updatedProfiles || []).map((p) => [
        p.user_id,
        { id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url },
      ])
    )

    const enhancedUpdatedTask = {
      ...updatedTask,
      assigned_to_user: updatedTask.assigned_to
        ? updatedProfileMap.get(updatedTask.assigned_to) || null
        : null,
      assigned_by_user: updatedTask.assigned_by
        ? updatedProfileMap.get(updatedTask.assigned_by) || null
        : null,
      created_by_user: updatedTask.created_by
        ? updatedProfileMap.get(updatedTask.created_by) || null
        : null,
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
          message: `"${enhancedUpdatedTask.title}" görevi size atandı`,
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

    logger.info(
      { taskId: id, userId: user.id, changes: changedFields },
      'Task updated successfully'
    )

    return NextResponse.json({ task: enhancedUpdatedTask })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in PATCH /api/tasks/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// DELETE /api/tasks/[id] - Delete task (soft delete)
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const canDelete =
      ['owner', 'admin', 'senior_doctor'].includes(membership.role) ||
      existingTask.created_by === user.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this task' },
        { status: 403 }
      )
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
