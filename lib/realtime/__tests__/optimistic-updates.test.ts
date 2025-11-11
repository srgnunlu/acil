import { describe, it, expect, beforeEach } from 'vitest'
import {
  OptimisticUpdateManager,
  ConflictResolver,
  debounce,
  throttle,
  applyOptimisticUpdate,
  revertOptimisticUpdate
} from '../optimistic-updates'

describe('OptimisticUpdateManager', () => {
  let manager: OptimisticUpdateManager<{ id: string; name: string }>

  beforeEach(() => {
    manager = new OptimisticUpdateManager()
  })

  it('should add update', () => {
    const entity = { id: '1', name: 'Test' }
    const update = manager.addUpdate('1', 'insert', entity)

    expect(update.id).toBe('1')
    expect(update.type).toBe('insert')
    expect(update.status).toBe('syncing')
    expect(update.entity).toEqual(entity)
  })

  it('should mark update as synced', () => {
    const entity = { id: '1', name: 'Test' }
    manager.addUpdate('1', 'insert', entity)

    manager.markSynced('1')

    const update = manager.getUpdate('1')
    expect(update?.status).toBe('synced')
  })

  it('should mark update as error', () => {
    const entity = { id: '1', name: 'Test' }
    const error = new Error('Sync failed')
    manager.addUpdate('1', 'insert', entity)

    manager.markError('1', error)

    const update = manager.getUpdate('1')
    expect(update?.status).toBe('error')
    expect(update?.error).toBe(error)
  })

  it('should get pending updates', () => {
    manager.addUpdate('1', 'insert', { id: '1', name: 'Test 1' })
    manager.addUpdate('2', 'update', { id: '2', name: 'Test 2' })

    const pending = manager.getPendingUpdates()
    expect(pending).toHaveLength(2)
  })

  it('should clear all updates', () => {
    manager.addUpdate('1', 'insert', { id: '1', name: 'Test 1' })
    manager.addUpdate('2', 'update', { id: '2', name: 'Test 2' })

    manager.clear()

    expect(manager.getPendingUpdates()).toHaveLength(0)
  })
})

describe('ConflictResolver', () => {
  let resolver: ConflictResolver<{ id: string; name: string; value: number }>

  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  it('should resolve with server_wins strategy', () => {
    const conflict = {
      id: '1',
      server_version: { id: '1', name: 'Server', value: 100 },
      client_version: { id: '1', name: 'Client', value: 50 },
      timestamp: new Date().toISOString(),
      strategy: 'server_wins' as const
    }

    const result = resolver.resolve(conflict, 'server_wins')
    expect(result).toEqual(conflict.server_version)
  })

  it('should resolve with client_wins strategy', () => {
    const conflict = {
      id: '1',
      server_version: { id: '1', name: 'Server', value: 100 },
      client_version: { id: '1', name: 'Client', value: 50 },
      timestamp: new Date().toISOString(),
      strategy: 'client_wins' as const
    }

    const result = resolver.resolve(conflict, 'client_wins')
    expect(result).toEqual(conflict.client_version)
  })

  it('should detect conflicts', () => {
    const version1 = { id: '1', name: 'Version 1', value: 100 }
    const version2 = { id: '1', name: 'Version 2', value: 100 }

    expect(resolver.hasConflict(version1, version2)).toBe(true)
    expect(resolver.hasConflict(version1, version1)).toBe(false)
  })
})

describe('debounce', () => {
  it('should debounce function calls', async () => {
    let callCount = 0
    const fn = () => {
      callCount++
    }

    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    expect(callCount).toBe(0)

    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(callCount).toBe(1)
  })
})

describe('throttle', () => {
  it('should throttle function calls', async () => {
    let callCount = 0
    const fn = () => {
      callCount++
    }

    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(callCount).toBe(1)

    await new Promise((resolve) => setTimeout(resolve, 150))

    throttled()
    expect(callCount).toBe(2)
  })
})

describe('applyOptimisticUpdate', () => {
  it('should apply insert update', () => {
    const items = [{ id: '1', name: 'Item 1' }]
    const update = {
      id: '2',
      type: 'insert' as const,
      entity: { id: '2', name: 'Item 2' },
      status: 'syncing' as const,
      timestamp: Date.now()
    }

    const result = applyOptimisticUpdate(items, update)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(update.entity)
  })

  it('should apply update update', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ]
    const update = {
      id: '1',
      type: 'update' as const,
      entity: { id: '1', name: 'Updated Item 1' },
      status: 'syncing' as const,
      timestamp: Date.now()
    }

    const result = applyOptimisticUpdate(items, update)

    expect(result[0].name).toBe('Updated Item 1')
  })

  it('should apply delete update', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ]
    const update = {
      id: '2',
      type: 'delete' as const,
      entity: { id: '2', name: 'Item 2' },
      status: 'syncing' as const,
      timestamp: Date.now()
    }

    const result = applyOptimisticUpdate(items, update)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('revertOptimisticUpdate', () => {
  it('should revert insert update', () => {
    const items = [
      { id: '2', name: 'Item 2' },
      { id: '1', name: 'Item 1' }
    ]
    const update = {
      id: '2',
      type: 'insert' as const,
      entity: { id: '2', name: 'Item 2' },
      status: 'error' as const,
      timestamp: Date.now()
    }

    const result = revertOptimisticUpdate(items, update)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should revert delete update', () => {
    const items = [{ id: '1', name: 'Item 1' }]
    const update = {
      id: '2',
      type: 'delete' as const,
      entity: { id: '2', name: 'Item 2' },
      status: 'error' as const,
      timestamp: Date.now()
    }

    const result = revertOptimisticUpdate(items, update)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(update.entity)
  })
})
