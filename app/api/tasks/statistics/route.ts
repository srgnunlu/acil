/**
 * Tasks Statistics API Route
 * GET /api/tasks/statistics - Get task statistics for a workspace
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

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

    // 2. Get workspace_id from query params
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // 3. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Get statistics
    const now = new Date().toISOString()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Total tasks
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    // Pending tasks
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .is('deleted_at', null)

    // In progress tasks
    const { count: inProgressTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'in_progress')
      .is('deleted_at', null)

    // Completed today
    const { count: completedToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())
      .is('deleted_at', null)

    // Overdue tasks
    const { count: overdueTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .lt('due_date', now)
      .not('status', 'eq', 'completed')
      .not('status', 'eq', 'cancelled')
      .is('deleted_at', null)

    // High priority tasks
    const { count: highPriorityTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('priority', ['urgent', 'high'])
      .not('status', 'eq', 'completed')
      .not('status', 'eq', 'cancelled')
      .is('deleted_at', null)

    return NextResponse.json({
      total_tasks: totalTasks || 0,
      pending_tasks: pendingTasks || 0,
      in_progress_tasks: inProgressTasks || 0,
      completed_today: completedToday || 0,
      overdue_tasks: overdueTasks || 0,
      high_priority_tasks: highPriorityTasks || 0,
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/tasks/statistics')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
