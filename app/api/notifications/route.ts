/**
 * Notifications API Route
 * Phase 6: Notification System
 *
 * Handles notification CRUD operations
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NotificationFilters } from '@/types/notification.types'

/**
 * GET /api/notifications
 * Get user's notifications with optional filters
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const is_read = searchParams.get('is_read')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (is_read !== null) {
      query = query.eq('is_read', is_read === 'true')
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('[API] Get notifications error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      notifications: notifications || [],
      count: notifications?.length || 0,
    })
  } catch (error) {
    console.error('[API] Get notifications exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate required fields
    if (!body.user_id || !body.type || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, title' },
        { status: 400 }
      )
    }

    // Create notification using database function
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: body.user_id,
      p_type: body.type,
      p_title: body.title,
      p_message: body.message || null,
      p_severity: body.severity || 'info',
      p_related_patient_id: body.related_patient_id || null,
      p_related_workspace_id: body.related_workspace_id || null,
      p_related_note_id: body.related_note_id || null,
      p_data: body.data || {},
      p_action_url: body.action_url || null,
      p_expires_at: body.expires_at || null,
    })

    if (error) {
      console.error('[API] Create notification error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notification: data }, { status: 201 })
  } catch (error) {
    console.error('[API] Create notification exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Bulk update notifications (mark all as read)
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()

    if (body.action === 'mark_all_read') {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('[API] Mark all as read error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Bulk update notifications exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 * Clear all notifications
 */
export async function DELETE(request: NextRequest) {
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

    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)

    if (error) {
      console.error('[API] Delete all notifications error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete all notifications exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
