/**
 * Connection Manager
 *
 * Manages WebSocket connection health and recovery
 */

import { createClient } from '@/lib/supabase/client'
import type { ConnectionStatus } from '@/types/realtime.types'

export interface ConnectionState {
  status: ConnectionStatus
  lastConnected: Date | null
  reconnectAttempts: number
  error: Error | null
}

export interface ConnectionManagerOptions {
  maxReconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
  onStatusChange?: (status: ConnectionStatus) => void
  onReconnecting?: (attempt: number) => void
  onReconnected?: () => void
}

/**
 * Connection manager for real-time features
 */
export class ConnectionManager {
  private state: ConnectionState = {
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  }

  private options: Required<ConnectionManagerOptions>
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private supabase = createClient()

  constructor(options: ConnectionManagerOptions = {}) {
    this.options = {
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      reconnectDelay: options.reconnectDelay ?? 2000,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      onStatusChange: options.onStatusChange ?? (() => {}),
      onReconnecting: options.onReconnecting ?? (() => {}),
      onReconnected: options.onReconnected ?? (() => {})
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.state.status
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return { ...this.state }
  }

  /**
   * Set connection status
   */
  private setStatus(status: ConnectionStatus, error: Error | null = null): void {
    if (this.state.status !== status) {
      this.state.status = status
      this.state.error = error

      if (status === 'connected') {
        this.state.lastConnected = new Date()
        this.state.reconnectAttempts = 0
        this.startHeartbeat()
        this.options.onReconnected()
      } else {
        this.stopHeartbeat()
      }

      this.options.onStatusChange(status)
    }
  }

  /**
   * Mark as connected
   */
  connected(): void {
    this.setStatus('connected')
  }

  /**
   * Mark as disconnected
   */
  disconnected(error?: Error): void {
    this.setStatus('disconnected', error ?? null)

    // Attempt reconnect
    if (this.state.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * Mark as connecting
   */
  connecting(): void {
    this.setStatus('connecting')
  }

  /**
   * Mark as error
   */
  error(error: Error): void {
    this.setStatus('error', error)

    // Attempt reconnect
    if (this.state.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.state.reconnectAttempts++
    const delay = this.options.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1)

    console.log(
      `[ConnectionManager] Scheduling reconnect attempt ${this.state.reconnectAttempts} in ${delay}ms`
    )

    this.options.onReconnecting(this.state.reconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      this.connecting()
    }, delay)
  }

  /**
   * Cancel reconnection attempts
   */
  cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.state.reconnectAttempts = 0
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.checkConnection()
    }, this.options.heartbeatInterval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Check connection health
   */
  private async checkConnection(): Promise<void> {
    try {
      // Simple health check - try to fetch something small
      const { error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine
        throw error
      }

      // Connection is healthy
      if (this.state.status !== 'connected') {
        this.connected()
      }
    } catch (err) {
      console.error('[ConnectionManager] Health check failed:', err)
      this.disconnected(err as Error)
    }
  }

  /**
   * Force reconnect
   */
  async forceReconnect(): Promise<void> {
    this.cancelReconnect()
    this.connecting()
    await this.checkConnection()
  }

  /**
   * Reset state
   */
  reset(): void {
    this.stopHeartbeat()
    this.cancelReconnect()
    this.state = {
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      error: null
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopHeartbeat()
    this.cancelReconnect()
  }
}

/**
 * Global connection manager instance
 */
export const connectionManager = new ConnectionManager({
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,
  heartbeatInterval: 30000,
  onStatusChange: (status) => {
    console.log('[ConnectionManager] Status changed:', status)
  },
  onReconnecting: (attempt) => {
    console.log('[ConnectionManager] Reconnecting, attempt:', attempt)
  },
  onReconnected: () => {
    console.log('[ConnectionManager] Reconnected successfully')
  }
})
