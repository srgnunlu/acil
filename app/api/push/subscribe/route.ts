/**
 * Push Subscription API Route
 * Phase 6: Push Notifications (PWA)
 *
 * Handles push notification subscriptions
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
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

    // Validate subscription object
    if (!body.subscription || !body.subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    const { subscription } = body
    const keys = subscription.keys || {}

    // Extract device info from user agent
    const userAgent = request.headers.get('user-agent') || ''
    const deviceType = getDeviceType(userAgent)

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          user_agent: userAgent,
          device_type: deviceType,
          is_active: true,
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('[API] Update push subscription error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'updated' })
    }

    // Create new subscription
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh_key: keys.p256dh,
      auth_key: keys.auth,
      user_agent: userAgent,
      device_type: deviceType,
      is_active: true,
      last_used_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[API] Create push subscription error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'created' }, { status: 201 })
  } catch (error) {
    console.error('[API] Push subscribe exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
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

    const body = await request.json()

    if (!body.endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', body.endpoint)

    if (error) {
      console.error('[API] Delete push subscription error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Push unsubscribe exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | null {
  const ua = userAgent.toLowerCase()

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }

  return 'desktop'
}
