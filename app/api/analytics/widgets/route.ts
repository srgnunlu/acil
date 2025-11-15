import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/analytics/widgets
 * Get user's dashboard widgets
 * Query params: workspace_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Get widgets
    const { data: widgets, error: widgetsError } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    if (widgetsError) {
      logger.error({ error: widgetsError }, 'Failed to get widgets')
      throw widgetsError
    }

    // If no widgets exist, create defaults
    if (!widgets || widgets.length === 0) {
      const { error: createError } = await supabase.rpc('create_default_dashboard_widgets', {
        p_user_id: user.id,
        p_workspace_id: workspaceId,
      })

      if (createError) {
        logger.error({ error: createError }, 'Failed to create default widgets')
      }

      // Fetch again
      const { data: newWidgets } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })

      return NextResponse.json({
        success: true,
        data: newWidgets || [],
      })
    }

    return NextResponse.json({
      success: true,
      data: widgets,
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Get widgets error')
    return NextResponse.json({ error: err.message || 'Failed to get widgets' }, { status: 500 })
  }
}

/**
 * POST /api/analytics/widgets
 * Create a new widget
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, widget_type, title, config, position_x, position_y, width, height } = body

    if (!workspace_id || !widget_type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create widget
    const { data: widget, error: createError } = await supabase
      .from('dashboard_widgets')
      .insert({
        user_id: user.id,
        workspace_id,
        widget_type,
        title,
        config: config || {},
        position_x: position_x || 0,
        position_y: position_y || 0,
        width: width || 4,
        height: height || 3,
      })
      .select()
      .single()

    if (createError) {
      logger.error({ error: createError }, 'Failed to create widget')
      throw createError
    }

    return NextResponse.json({
      success: true,
      data: widget,
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Create widget error')
    return NextResponse.json({ error: err.message || 'Failed to create widget' }, { status: 500 })
  }
}

/**
 * PATCH /api/analytics/widgets
 * Update widget configuration or position
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { widget_id, ...updates } = body

    if (!widget_id) {
      return NextResponse.json({ error: 'widget_id is required' }, { status: 400 })
    }

    // Update widget
    const { data: widget, error: updateError } = await supabase
      .from('dashboard_widgets')
      .update(updates)
      .eq('id', widget_id)
      .eq('user_id', user.id) // Ensure user owns the widget
      .select()
      .single()

    if (updateError) {
      logger.error({ error: updateError }, 'Failed to update widget')
      throw updateError
    }

    return NextResponse.json({
      success: true,
      data: widget,
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Update widget error')
    return NextResponse.json({ error: err.message || 'Failed to update widget' }, { status: 500 })
  }
}

/**
 * DELETE /api/analytics/widgets
 * Delete a widget
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const widgetId = searchParams.get('widget_id')

    if (!widgetId) {
      return NextResponse.json({ error: 'widget_id is required' }, { status: 400 })
    }

    // Delete widget
    const { error: deleteError } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', widgetId)
      .eq('user_id', user.id)

    if (deleteError) {
      logger.error({ error: deleteError }, 'Failed to delete widget')
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Widget deleted successfully',
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Delete widget error')
    return NextResponse.json({ error: err.message || 'Failed to delete widget' }, { status: 500 })
  }
}
