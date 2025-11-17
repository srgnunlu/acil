/**
 * Supabase Realtime Client Utilities
 *
 * Provides helpers for:
 * - Channel management
 * - Subscription handling
 * - Connection state tracking
 * - Error handling
 */

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { ConnectionStatus } from '@/types/realtime.types'

/**
 * Get Supabase realtime client
 */
export function getRealtimeClient() {
  return createClient()
}

/**
 * Channel configuration
 */
export interface ChannelConfig {
  name: string
  workspaceId?: string
  patientId?: string
}

/**
 * Create a channel name for workspace-specific subscriptions
 */
export function createChannelName(config: ChannelConfig): string {
  const parts = [config.name]

  if (config.workspaceId) {
    parts.push(`workspace:${config.workspaceId}`)
  }

  if (config.patientId) {
    parts.push(`patient:${config.patientId}`)
  }

  return parts.join(':')
}

/**
 * Subscribe to table changes
 */
export function subscribeToTable<T extends Record<string, any> = any>(
  channel: RealtimeChannel,
  table: string,
  filter?: string,
  callback?: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  return channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table,
      ...(filter ? { filter } : {}),
    },
    (payload) => {
      if (callback) {
        callback(payload as RealtimePostgresChangesPayload<T>)
      }
    }
  )
}

/**
 * Subscribe to broadcast events
 */
export function subscribeToBroadcast<T = unknown>(
  channel: RealtimeChannel,
  event: string,
  callback: (payload: T) => void
) {
  return channel.on('broadcast', { event }, ({ payload }) => callback(payload as T))
}

/**
 * Subscribe to presence
 */
export interface PresencePayload {
  user_id: string
  workspace_id: string
  viewing_patient_id?: string | null
  status: string
  online_at: string
}

export function subscribeToPresence(
  channel: RealtimeChannel,
  onJoin?: (key: string, current: PresencePayload, all: Record<string, PresencePayload[]>) => void,
  onLeave?: (key: string, current: PresencePayload, all: Record<string, PresencePayload[]>) => void,
  onSync?: () => void
) {
  if (onSync) {
    channel.on('presence', { event: 'sync' }, onSync)
  }

  if (onJoin) {
    channel.on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
      const current = newPresences[0] as unknown as PresencePayload
      onJoin(key, current, currentPresences as unknown as Record<string, PresencePayload[]>)
    })
  }

  if (onLeave) {
    channel.on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
      const current = leftPresences[0] as unknown as PresencePayload
      onLeave(key, current, currentPresences as unknown as Record<string, PresencePayload[]>)
    })
  }

  return channel
}

/**
 * Track presence state
 */
export async function trackPresence(
  channel: RealtimeChannel,
  state: PresencePayload
): Promise<'ok' | 'timed_out' | 'error'> {
  return channel.track(state) as Promise<'ok' | 'timed_out' | 'error'>
}

/**
 * Untrack presence
 */
export async function untrackPresence(
  channel: RealtimeChannel
): Promise<'ok' | 'timed_out' | 'error'> {
  return channel.untrack() as Promise<'ok' | 'timed_out' | 'error'>
}

/**
 * Broadcast message to channel
 */
export async function broadcastMessage<T = unknown>(
  channel: RealtimeChannel,
  event: string,
  payload: T
) {
  return channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

/**
 * Get channel status
 */
export function getChannelStatus(channel: RealtimeChannel): ConnectionStatus {
  const state = channel.state

  switch (state) {
    case 'joined':
      return 'connected'
    case 'joining':
      return 'connecting'
    case 'leaving':
    case 'closed':
      return 'disconnected'
    default:
      return 'error'
  }
}

/**
 * Channel manager for handling multiple subscriptions
 */
export class ChannelManager {
  private channels = new Map<string, RealtimeChannel>()
  private supabase = getRealtimeClient()

  /**
   * Get or create a channel
   */
  getOrCreateChannel(name: string): RealtimeChannel {
    let channel = this.channels.get(name)

    if (!channel) {
      channel = this.supabase.channel(name)
      this.channels.set(name, channel)
    }

    return channel
  }

  /**
   * Remove a channel
   */
  async removeChannel(name: string) {
    const channel = this.channels.get(name)

    if (channel) {
      await this.supabase.removeChannel(channel)
      this.channels.delete(name)
    }
  }

  /**
   * Remove all channels
   */
  async removeAllChannels() {
    for (const [name] of this.channels) {
      await this.removeChannel(name)
    }
  }

  /**
   * Get all channel names
   */
  getChannelNames(): string[] {
    return Array.from(this.channels.keys())
  }

  /**
   * Get channel status
   */
  getStatus(name: string): ConnectionStatus | null {
    const channel = this.channels.get(name)
    return channel ? getChannelStatus(channel) : null
  }
}

/**
 * Global channel manager instance
 */
export const channelManager = new ChannelManager()

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number
  delayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
}

/**
 * Retry a subscription with exponential backoff
 */
export async function retrySubscription(
  subscribeFn: () => Promise<void>,
  config: Partial<RetryConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let attempt = 0
  let lastError: Error | null = null

  while (attempt < finalConfig.maxAttempts) {
    try {
      await subscribeFn()
      return
    } catch (error) {
      lastError = error as Error
      attempt++

      if (attempt < finalConfig.maxAttempts) {
        const delay = finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(
    `Failed to subscribe after ${finalConfig.maxAttempts} attempts: ${lastError?.message}`
  )
}
