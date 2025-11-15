/**
 * Task Comments API Route
 * GET /api/tasks/[id]/comments - Get comments
 * POST /api/tasks/[id]/comments - Add comment
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTaskCommentSchema } from '@/lib/validation/task-schemas'
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

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(
        `
        *,
        author:profiles!task_comments_created_by_fkey(id, full_name, avatar_url)
      `
      )
      .eq('task_id', taskId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error({ error }, 'Failed to fetch comments')
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    logger.error({ error }, 'Error in GET /api/tasks/[id]/comments')
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
    const validationResult = createTaskCommentSchema.safeParse({ ...body, task_id: taskId })

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

    // Verify task access
    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id, title')
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

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content: data.content,
        mentions: data.mentions || [],
        created_by: user.id,
      })
      .select(
        `
        *,
        author:profiles!task_comments_created_by_fkey(id, full_name, avatar_url)
      `
      )
      .single()

    if (createError) {
      logger.error({ error: createError }, 'Failed to create comment')
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity_log').insert({
      task_id: taskId,
      activity_type: 'commented',
      performed_by: user.id,
    })

    // Send notifications to mentioned users
    if (data.mentions && data.mentions.length > 0) {
      const notificationPromises = data.mentions.map((mention) =>
        supabase.from('notifications').insert({
          user_id: mention.user_id,
          workspace_id: task.workspace_id,
          type: 'task_mention',
          title: 'Görevde bahsedildiniz',
          message: `"${task.title}" görevinde bahsedildiniz`,
          link: `/dashboard/tasks/${taskId}`,
          data: {
            task_id: taskId,
            comment_id: comment.id,
            mentioned_by: user.id,
          },
        })
      )

      await Promise.all(notificationPromises)
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Error in POST /api/tasks/[id]/comments')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
