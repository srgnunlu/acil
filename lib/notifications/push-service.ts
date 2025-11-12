/**
 * Push Notification Service
 * Phase 6: Push Notifications (PWA)
 *
 * Handles sending push notifications using Web Push API
 */

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import type { PushNotificationPayload } from '@/types/notification.types'

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'noreply@acil.app'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

/**
 * Push Notification Service
 */
export class PushService {
  /**
   * Send push notification to a specific user
   */
  static async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Get all active subscriptions for the user
      const supabase = await createClient()

      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('[PushService] Get subscriptions error:', error)
        return false
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('[PushService] No active subscriptions for user:', userId)
        return false
      }

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map((sub) => this.sendToSubscription(sub, payload))
      )

      // Count successes
      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length

      console.log(
        `[PushService] Sent to ${successCount}/${subscriptions.length} subscriptions for user ${userId}`
      )

      return successCount > 0
    } catch (error) {
      console.error('[PushService] sendToUser error:', error)
      return false
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    const results = await Promise.allSettled(userIds.map((userId) => this.sendToUser(userId, payload)))

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length

    console.log(`[PushService] Sent to ${successCount}/${userIds.length} users`)

    return successCount
  }

  /**
   * Send push notification to a specific subscription
   */
  private static async sendToSubscription(
    subscription: {
      endpoint: string
      p256dh_key: string
      auth_key: string
      id: string
    },
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key,
        },
      }

      const payloadString = JSON.stringify(payload)

      await webpush.sendNotification(pushSubscription, payloadString)

      // Update last_used_at
      const supabase = await createClient()
      await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', subscription.id)

      return true
    } catch (error: unknown) {
      console.error('[PushService] sendToSubscription error:', error)

      // Handle expired subscriptions
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode: number }).statusCode

        if (statusCode === 410 || statusCode === 404) {
          console.log('[PushService] Subscription expired, marking as inactive')

          const supabase = await createClient()
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id)
        }
      }

      return false
    }
  }

  /**
   * Test push notification
   */
  static async sendTestNotification(userId: string): Promise<boolean> {
    const payload: PushNotificationPayload = {
      title: 'ACIL Test Bildirimi',
      body: 'Bu bir test bildirimidir. Push notification sistemi çalışıyor! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        action_url: '/dashboard',
      },
      tag: 'test-notification',
    }

    return this.sendToUser(userId, payload)
  }
}
