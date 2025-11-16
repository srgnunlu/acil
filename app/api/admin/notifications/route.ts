import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('notification_id')
    const userId = searchParams.get('user_id')
    const workspaceId = searchParams.get('workspace_id')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const isRead = searchParams.get('is_read')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single notification
    if (notificationId) {
      const { data: notification, error } = await supabase
        .from('notifications')
        .select(
          `
          *,
          user:profiles!notifications_user_id_fkey(user_id, full_name, avatar_url),
          patient:patients(id, name),
          workspace:workspaces(id, name, slug)
        `
        )
        .eq('id', notificationId)
        .single()

      if (error) {
        logger.error({ error, notificationId }, 'Failed to fetch notification')
        return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 })
      }

      return NextResponse.json(notification)
    }

    // List all notifications
    let query = supabase
      .from('notifications')
      .select(
        `
        *,
        user:profiles!notifications_user_id_fkey(user_id, full_name, avatar_url),
        patient:patients(id, name),
        workspace:workspaces(id, name, slug)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (workspaceId) {
      query = query.eq('related_workspace_id', workspaceId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (isRead !== null && isRead !== undefined) {
      query = query.eq('is_read', isRead === 'true')
    }

    const { data: notifications, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch notifications')
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get statistics
    const { count: totalNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    const { count: readNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', true)

    // Get notifications by type
    const { data: typeData } = await supabase.from('notifications').select('type')

    const byType: Record<string, number> = {}
    typeData?.forEach((notif) => {
      byType[notif.type] = (byType[notif.type] || 0) + 1
    })

    // Get notifications by severity
    const { data: severityData } = await supabase.from('notifications').select('severity')

    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    }

    severityData?.forEach((notif) => {
      if (notif.severity in bySeverity) {
        bySeverity[notif.severity]++
      }
    })

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        total: totalNotifications || 0,
        unread: unreadNotifications || 0,
        read: readNotifications || 0,
        by_type: byType,
        by_severity: bySeverity,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin notifications API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const body = await request.json()
    const { notification_id, ...updates } = body

    if (!notification_id) {
      return NextResponse.json({ error: 'notification_id required' }, { status: 400 })
    }

    // Handle read status
    if (updates.is_read !== undefined) {
      updates.read_at = updates.is_read ? new Date().toISOString() : null
    }

    // Update notification
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', notification_id)
      .select()
      .single()

    if (error) {
      logger.error({ error, notification_id, updates }, 'Failed to update notification')
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    logger.info({ notification_id, updates, updatedBy: authResult.user!.id }, 'Notification updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin notifications PATCH error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('notification_id')

    if (!notificationId) {
      return NextResponse.json({ error: 'notification_id required' }, { status: 400 })
    }

    // Delete notification
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId)

    if (error) {
      logger.error({ error, notificationId }, 'Failed to delete notification')
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    logger.info({ notificationId, deletedBy: authResult.user!.id }, 'Notification deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin notifications DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

