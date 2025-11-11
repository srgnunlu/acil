/**
 * Optimistic Updates Utility
 *
 * Provides optimistic update functionality for better UX
 */

import type { OptimisticUpdate, SyncStatus, ConflictData, ConflictStrategy } from '@/types/realtime.types'

/**
 * Optimistic update manager
 */
export class OptimisticUpdateManager<T = unknown> {
  private pendingUpdates = new Map<string, OptimisticUpdate<T>>()
  private conflictCallbacks: Array<(conflict: ConflictData<T>) => void> = []

  /**
   * Add an optimistic update
   */
  addUpdate(id: string, type: 'insert' | 'update' | 'delete', entity: T): OptimisticUpdate<T> {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      entity,
      status: 'syncing',
      timestamp: Date.now()
    }

    this.pendingUpdates.set(id, update)
    return update
  }

  /**
   * Mark update as synced
   */
  markSynced(id: string): void {
    const update = this.pendingUpdates.get(id)
    if (update) {
      update.status = 'synced'
      this.pendingUpdates.set(id, update)

      // Remove after a delay
      setTimeout(() => {
        this.pendingUpdates.delete(id)
      }, 5000)
    }
  }

  /**
   * Mark update as error
   */
  markError(id: string, error: Error): void {
    const update = this.pendingUpdates.get(id)
    if (update) {
      update.status = 'error'
      update.error = error
      this.pendingUpdates.set(id, update)
    }
  }

  /**
   * Mark update as conflict
   */
  markConflict(id: string): void {
    const update = this.pendingUpdates.get(id)
    if (update) {
      update.status = 'conflict'
      this.pendingUpdates.set(id, update)
    }
  }

  /**
   * Get pending update
   */
  getUpdate(id: string): OptimisticUpdate<T> | undefined {
    return this.pendingUpdates.get(id)
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.pendingUpdates.values())
  }

  /**
   * Clear all updates
   */
  clear(): void {
    this.pendingUpdates.clear()
  }

  /**
   * Remove a specific update
   */
  remove(id: string): void {
    this.pendingUpdates.delete(id)
  }

  /**
   * Register conflict callback
   */
  onConflict(callback: (conflict: ConflictData<T>) => void): void {
    this.conflictCallbacks.push(callback)
  }

  /**
   * Trigger conflict callbacks
   */
  triggerConflict(conflict: ConflictData<T>): void {
    this.conflictCallbacks.forEach((cb) => cb(conflict))
  }
}

/**
 * Conflict resolver
 */
export class ConflictResolver<T = unknown> {
  /**
   * Resolve conflict based on strategy
   */
  resolve(
    conflict: ConflictData<T>,
    strategy: ConflictStrategy = 'server_wins'
  ): T {
    switch (strategy) {
      case 'server_wins':
        return conflict.server_version

      case 'client_wins':
        return conflict.client_version

      case 'merge':
        return this.mergeVersions(conflict.server_version, conflict.client_version)

      case 'manual':
        // Manual resolution required - return server version for now
        console.warn('[ConflictResolver] Manual resolution required for:', conflict.id)
        return conflict.server_version

      default:
        return conflict.server_version
    }
  }

  /**
   * Merge two versions (shallow merge)
   */
  private mergeVersions(serverVersion: T, clientVersion: T): T {
    if (typeof serverVersion === 'object' && typeof clientVersion === 'object') {
      return {
        ...serverVersion,
        ...clientVersion
      }
    }

    // If not objects, server wins
    return serverVersion
  }

  /**
   * Detect conflict
   */
  hasConflict(serverVersion: T, clientVersion: T): boolean {
    // Simple JSON comparison
    return JSON.stringify(serverVersion) !== JSON.stringify(clientVersion)
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Apply optimistic update to a list
 */
export function applyOptimisticUpdate<T extends { id: string }>(
  items: T[],
  update: OptimisticUpdate<T>
): T[] {
  switch (update.type) {
    case 'insert':
      // Add to beginning
      return [update.entity, ...items]

    case 'update':
      // Update existing item
      return items.map((item) =>
        item.id === update.entity.id ? update.entity : item
      )

    case 'delete':
      // Remove item
      return items.filter((item) => item.id !== update.entity.id)

    default:
      return items
  }
}

/**
 * Revert optimistic update from a list
 */
export function revertOptimisticUpdate<T extends { id: string }>(
  items: T[],
  update: OptimisticUpdate<T>
): T[] {
  switch (update.type) {
    case 'insert':
      // Remove inserted item
      return items.filter((item) => item.id !== update.entity.id)

    case 'update':
      // This is tricky - we don't have the original version
      // In practice, we should refetch from server
      return items

    case 'delete':
      // Re-add deleted item
      return [update.entity, ...items]

    default:
      return items
  }
}
