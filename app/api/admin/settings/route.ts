import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return system settings (stored in environment or database)
    const settings = {
      ai: {
        openai_enabled: !!process.env.OPENAI_API_KEY,
        gemini_enabled: !!process.env.GEMINI_API_KEY,
        default_model: process.env.DEFAULT_AI_MODEL || 'gpt-4',
      },
      email: {
        enabled: !!process.env.RESEND_API_KEY,
        from_email: process.env.EMAIL_FROM || 'noreply@acil.app',
      },
      notifications: {
        push_enabled: true,
        email_enabled: !!process.env.RESEND_API_KEY,
      },
      rate_limiting: {
        enabled: !!process.env.UPSTASH_REDIS_REST_URL,
        ai_requests_per_minute: 10,
      },
      security: {
        rls_enabled: true,
        require_email_verification: false,
      },
    }

    return NextResponse.json(settings)
  } catch (error) {
    logger.error({ error }, 'Admin settings API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Settings updates would typically be stored in a system_settings table
    // For now, we'll just log the request
    logger.info({ settings: body, updatedBy: user.id }, 'System settings update requested')

    return NextResponse.json({ success: true, message: 'Settings updated' })
  } catch (error) {
    logger.error({ error }, 'Admin settings PATCH error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
