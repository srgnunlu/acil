/**
 * Task Checklist API Route
 * GET /api/tasks/[id]/checklist - Get checklist items
 * POST /api/tasks/[id]/checklist - Add checklist item
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createChecklistItemSchema } from '@/lib/validation/task-schemas'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task access
    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id')
      .eq('id', taskId)
      .is('deleted_at', null)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', task.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch checklist items
    const { data: items, error } = await supabase
      .from('task_checklist_items')
      .select(
        `
        *,
        assigned_to_user:profiles!task_checklist_items_assigned_to_fkey(id, full_name),
        completed_by_user:profiles!task_checklist_items_completed_by_fkey(id, full_name)
      `
      )
      .eq('task_id', taskId)
      .order('order_index', { ascending: true })

    if (error) {
      logger.error({ error }, 'Failed to fetch checklist items')
      return NextResponse.json({ error: 'Failed to fetch checklist items' }, { status: 500 })
    }

    return NextResponse.json({ items })
  } catch (error) {
    logger.error({ error }, 'Error in GET /api/tasks/[id]/checklist')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createChecklistItemSchema.safeParse({ ...body, task_id: taskId })

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

    // Verify task access and get workspace
    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id, created_by, assigned_to')
      .eq('id', taskId)
      .is('deleted_at', null)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', task.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canUpdate =
      task.created_by === user.id ||
      task.assigned_to === user.id ||
      ['owner', 'admin', 'senior_doctor'].includes(membership.role)

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create checklist item
    const { data: item, error: createError } = await supabase
      .from('task_checklist_items')
      .insert(data)
      .select(
        `
        *,
        assigned_to_user:profiles!task_checklist_items_assigned_to_fkey(id, full_name)
      `
      )
      .single()

    if (createError) {
      logger.error({ error: createError }, 'Failed to create checklist item')
      return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity_log').insert({
      task_id: taskId,
      activity_type: 'checklist_updated',
      metadata: { action: 'added', item_title: data.title },
      performed_by: user.id,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Error in POST /api/tasks/[id]/checklist')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
