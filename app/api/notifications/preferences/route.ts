/**
 * Notification Preferences API Route
 * Phase 6: Notification System
 *
 * Manage user notification preferences
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NotificationPreferences } from '@/types/notification.types'

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
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

    // Get user profile with preferences
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('[API] Get notification preferences error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      preferences: profile?.notification_preferences || {
        email: true,
        push: true,
        sms: false,
        mention: true,
        assignment: true,
        critical_alerts: true,
        patient_updates: true,
        ai_alerts: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      },
    })
  } catch (error) {
    console.error('[API] Get notification preferences exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PUT(request: NextRequest) {
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
    const preferences = body.preferences as Partial<NotificationPreferences>

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences object' }, { status: 400 })
    }

    // Get current preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('[API] Get current preferences error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Merge with current preferences
    const updatedPreferences = {
      ...(currentProfile?.notification_preferences || {}),
      ...preferences,
    }

    // Update preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        notification_preferences: updatedPreferences,
      })
      .eq('user_id', user.id)
      .select('notification_preferences')
      .single()

    if (updateError) {
      console.error('[API] Update notification preferences error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      preferences: profile?.notification_preferences,
    })
  } catch (error) {
    console.error('[API] Update notification preferences exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/preferences
 * Partially update notification preferences
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

    // Get current preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('[API] Get current preferences error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Merge with current preferences
    const updatedPreferences = {
      ...(currentProfile?.notification_preferences || {}),
      ...body,
    }

    // Update preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        notification_preferences: updatedPreferences,
      })
      .eq('user_id', user.id)
      .select('notification_preferences')
      .single()

    if (updateError) {
      console.error('[API] Update notification preferences error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      preferences: profile?.notification_preferences,
    })
  } catch (error) {
    console.error('[API] Patch notification preferences exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
