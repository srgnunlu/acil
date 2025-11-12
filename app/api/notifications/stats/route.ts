/**
 * Notification Stats API Route
 * Phase 6: Notification System
 *
 * Get notification statistics
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Notification, NotificationStats } from '@/types/notification.types'

/**
 * GET /api/notifications/stats
 * Get notification statistics for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('[API] Get notification stats error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const notifs = (notifications as Notification[]) || []

    // Calculate stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats: NotificationStats = {
      total: notifs.length,
      unread: notifs.filter((n) => !n.is_read).length,
      by_severity: {
        critical: notifs.filter((n) => n.severity === 'critical').length,
        high: notifs.filter((n) => n.severity === 'high').length,
        medium: notifs.filter((n) => n.severity === 'medium').length,
        low: notifs.filter((n) => n.severity === 'low').length,
        info: notifs.filter((n) => n.severity === 'info').length,
      },
      by_type: notifs.reduce(
        (acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      today: notifs.filter((n) => new Date(n.created_at) >= today).length,
      this_week: notifs.filter((n) => new Date(n.created_at) >= weekAgo).length,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[API] Get notification stats exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
