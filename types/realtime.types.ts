// ============================================
// REAL-TIME COLLABORATION TYPES
// ============================================

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

/**
 * User presence in workspace
 */
export interface UserPresence {
  user_id: string
  workspace_id: string | null
  status: PresenceStatus
  viewing_patient_id: string | null
  last_activity_at: string
  updated_at: string
}

/**
 * User presence with profile info
 */
export interface UserPresenceWithProfile extends UserPresence {
  full_name: string | null
  avatar_url: string | null
  title: string | null
}

/**
 * Activity log types
 */
export type ActivityType =
  | 'patient_created'
  | 'patient_updated'
  | 'patient_deleted'
  | 'patient_viewed'
  | 'patient_assigned'
  | 'data_added'
  | 'data_updated'
  | 'test_added'
  | 'ai_analysis_requested'
  | 'ai_analysis_completed'
  | 'chat_message_sent'
  | 'note_created'
  | 'note_updated'
  | 'workspace_joined'
  | 'workspace_left'
  | 'member_invited'
  | 'member_removed'
  | 'settings_updated'

/**
 * Entity types that can be logged
 */
export type EntityType =
  | 'patient'
  | 'patient_data'
  | 'patient_test'
  | 'ai_analysis'
  | 'chat_message'
  | 'workspace'
  | 'workspace_member'
  | 'organization'
  | 'note'
  | 'task'

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string
  organization_id: string | null
  workspace_id: string | null
  user_id: string | null
  activity_type: ActivityType
  entity_type: EntityType | null
  entity_id: string | null
  description: string | null
  data: Record<string, unknown>
  created_at: string
}

/**
 * Activity log with user info
 */
export interface ActivityLogWithUser extends ActivityLog {
  user: {
    full_name: string | null
    avatar_url: string | null
    title: string | null
  } | null
}

/**
 * Realtime channel types for Supabase
 */
export type RealtimeChannel = 'patients' | 'presence' | 'activity' | 'notifications'

/**
 * Realtime event types
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Realtime payload structure
 */
export interface RealtimePayload<T = unknown> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: RealtimeEventType
  new: T
  old: T | Record<string, never>
  errors: string | null
}

/**
 * Broadcast payload for custom events
 */
export interface BroadcastPayload<T = unknown> {
  type: string
  payload: T
  user_id: string
  workspace_id: string
  timestamp: string
}

/**
 * Presence state for Supabase Realtime
 */
export interface PresenceState {
  user_id: string
  workspace_id: string
  viewing_patient_id?: string | null
  status: PresenceStatus
  online_at: string
}

/**
 * Sync status for optimistic updates
 */
export type SyncStatus = 'syncing' | 'synced' | 'error' | 'conflict'

/**
 * Optimistic update item
 */
export interface OptimisticUpdate<T = unknown> {
  id: string
  type: 'insert' | 'update' | 'delete'
  entity: T
  status: SyncStatus
  timestamp: number
  error?: Error
}

/**
 * Connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Realtime subscription status
 */
export interface RealtimeSubscriptionStatus {
  channel: RealtimeChannel
  status: ConnectionStatus
  subscribedAt?: Date
  error?: Error
}

/**
 * Live counter data
 */
export interface LiveCounter {
  total: number
  active: number
  online_users: number
  last_updated: string
}

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'server_wins' | 'client_wins' | 'merge' | 'manual'

/**
 * Conflict data
 */
export interface ConflictData<T = unknown> {
  id: string
  server_version: T
  client_version: T
  timestamp: string
  strategy: ConflictStrategy
  resolved?: boolean
}
