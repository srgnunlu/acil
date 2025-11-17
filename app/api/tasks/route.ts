/**
 * Tasks API Route
 * GET /api/tasks - List tasks with filters
 * POST /api/tasks - Create new task
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTaskSchema, taskFiltersSchema } from '@/lib/validation/task-schemas'
import { logger } from '@/lib/logger'
import type { TaskWithDetails } from '@/types/task.types'

// =====================================================
// GET /api/tasks - List tasks with filters
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const rawFilters = {
      workspace_id: searchParams.get('workspace_id'),
      patient_id: searchParams.get('patient_id') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      created_by: searchParams.get('created_by') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      is_overdue: searchParams.get('is_overdue') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
    }

    // Validate filters
    const validationResult = taskFiltersSchema.safeParse(rawFilters)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid filters',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // 3. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', filters.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      logger.error(
        { error: membershipError, userId: user.id, workspaceId: filters.workspace_id },
        'Workspace access denied'
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Build query
    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        patient:patients(id, name),
        workspace:workspaces(id, name, color)
      `,
        { count: 'exact' }
      )
      .eq('workspace_id', filters.workspace_id)
      .is('deleted_at', null)

    // Apply filters
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id)
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in('priority', filters.priority)
      } else {
        query = query.eq('priority', filters.priority)
      }
    }

    if (filters.category) {
      if (Array.isArray(filters.category)) {
        query = query.in('category', filters.category)
      } else {
        query = query.eq('category', filters.category)
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }

    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    if (filters.is_overdue) {
      query = query
        .lt('due_date', new Date().toISOString())
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'cancelled')
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const sortBy = filters.sort_by as
      | 'created_at'
      | 'updated_at'
      | 'due_date'
      | 'priority'
      | 'status'
    query = query.order(sortBy, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: tasks, error: fetchError, count } = await query

    if (fetchError) {
      logger.error({ error: fetchError, userId: user.id }, 'Failed to fetch tasks')
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // 6. Fetch user profiles for assigned_to, assigned_by, created_by
    const userIds = new Set<string>()
    tasks?.forEach((task) => {
      if (task.assigned_to) userIds.add(task.assigned_to)
      if (task.assigned_by) userIds.add(task.assigned_by)
      if (task.created_by) userIds.add(task.created_by)
    })

    const { data: profiles } =
      userIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', Array.from(userIds))
        : { data: null }

    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.user_id,
        { id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url },
      ])
    )

    // 7. Fetch checklist counts for each task (optimization: single query)
    const taskIds = tasks?.map((t) => t.id) || []
    const { data: checklistCounts } = await supabase
      .from('task_checklist_items')
      .select('task_id, is_completed')
      .in('task_id', taskIds)

    // Group counts by task_id
    const countsMap = new Map<string, { total: number; completed: number }>()
    checklistCounts?.forEach((item) => {
      const current = countsMap.get(item.task_id) || { total: 0, completed: 0 }
      current.total++
      if (item.is_completed) {
        current.completed++
      }
      countsMap.set(item.task_id, current)
    })

    // 8. Enhance tasks with counts and user profiles
    const enhancedTasks: TaskWithDetails[] =
      tasks?.map((task) => ({
        ...task,
        assigned_to_user: task.assigned_to ? profileMap.get(task.assigned_to) || null : null,
        assigned_by_user: task.assigned_by ? profileMap.get(task.assigned_by) || null : null,
        created_by_user: task.created_by ? profileMap.get(task.created_by) || null : null,
        _count: {
          checklist_items: countsMap.get(task.id)?.total || 0,
          completed_checklist_items: countsMap.get(task.id)?.completed || 0,
        },
      })) || []

    // 9. Return response
    return NextResponse.json({
      tasks: enhancedTasks,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.limit),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/tasks')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// POST /api/tasks - Create new task
// =====================================================

export async function POST(request: NextRequest) {
  try {
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
    const validationResult = createTaskSchema.safeParse(body)

    if (!validationResult.success) {
      logger.error({ error: validationResult.error, body }, 'Task validation failed')
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
          message: validationResult.error.issues
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', '),
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 3. Check workspace membership and permissions
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', data.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user has permission to create tasks
    const allowedRoles = ['owner', 'admin', 'senior_doctor', 'doctor', 'resident']
    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tasks' },
        { status: 403 }
      )
    }

    // 4. If patient_id is provided, verify patient exists and belongs to workspace
    if (data.patient_id) {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, workspace_id')
        .eq('id', data.patient_id)
        .eq('workspace_id', data.workspace_id)
        .is('deleted_at', null)
        .single()

      if (patientError || !patient) {
        return NextResponse.json(
          { error: 'Patient not found or not in workspace' },
          { status: 404 }
        )
      }
    }

    // 5. If assigned_to is provided, verify user is member of workspace
    if (data.assigned_to) {
      const { data: assignedMember, error: assignedError } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', data.workspace_id)
        .eq('user_id', data.assigned_to)
        .eq('status', 'active')
        .single()

      if (assignedError || !assignedMember) {
        return NextResponse.json(
          { error: 'Assigned user is not a member of this workspace' },
          { status: 400 }
        )
      }
    }

    // 6. Create task
    const { checklist_items, ...taskData } = data

    const { data: task, error: createError } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: user.id,
        assigned_by: user.id,
      })
      .select(
        `
        *,
        patient:patients(id, name),
        workspace:workspaces(id, name, color)
      `
      )
      .single()

    if (createError) {
      logger.error({ error: createError, userId: user.id }, 'Failed to create task')
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // 7. Fetch user profiles for the created task
    const userIds = new Set<string>()
    if (task.assigned_to) userIds.add(task.assigned_to)
    if (task.assigned_by) userIds.add(task.assigned_by)
    if (task.created_by) userIds.add(task.created_by)

    const { data: profiles } =
      userIds.size > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', Array.from(userIds))
        : { data: null }

    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.user_id,
        { id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url },
      ])
    )

    // Enhance task with user profiles
    const enhancedTask = {
      ...task,
      assigned_to_user: task.assigned_to ? profileMap.get(task.assigned_to) || null : null,
      assigned_by_user: task.assigned_by ? profileMap.get(task.assigned_by) || null : null,
      created_by_user: task.created_by ? profileMap.get(task.created_by) || null : null,
    }

    // 8. Create checklist items if provided
    if (checklist_items && checklist_items.length > 0) {
      const checklistData = checklist_items.map((item, index) => ({
        task_id: enhancedTask.id,
        title: item.title,
        description: item.description,
        order_index: item.order_index ?? index,
        assigned_to: item.assigned_to,
      }))

      const { error: checklistError } = await supabase
        .from('task_checklist_items')
        .insert(checklistData)

      if (checklistError) {
        logger.error(
          { error: checklistError, taskId: enhancedTask.id },
          'Failed to create checklist items'
        )
        // Don't fail the whole request, just log the error
      }
    }

    // 9. Log activity
    await supabase.from('task_activity_log').insert({
      task_id: enhancedTask.id,
      activity_type: 'created',
      performed_by: user.id,
    })

    // 10. Send notification if task is assigned
    if (data.assigned_to && data.assigned_to !== user.id) {
      await supabase.from('notifications').insert({
        user_id: data.assigned_to,
        workspace_id: data.workspace_id,
        type: 'task_assigned',
        title: 'Yeni görev atandı',
        message: `"${enhancedTask.title}" görevi size atandı`,
        link: `/dashboard/tasks/${enhancedTask.id}`,
        related_patient_id: data.patient_id,
        data: {
          task_id: enhancedTask.id,
          assigned_by: user.id,
        },
      })
    }

    logger.info({ taskId: enhancedTask.id, userId: user.id }, 'Task created successfully')

    return NextResponse.json({ task: enhancedTask }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in POST /api/tasks')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
