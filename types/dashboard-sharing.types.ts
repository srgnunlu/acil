/**
 * Dashboard Sharing Types
 *
 * Type definitions for dashboard sharing and collaboration
 */

import { DashboardLayout } from './widget.types'

export type SharePermission = 'view' | 'edit' | 'admin'
export type ShareStatus = 'active' | 'revoked' | 'expired'
export type ShareVisibility = 'private' | 'workspace' | 'organization' | 'public'

export interface DashboardShare {
  id: string
  dashboardId: string
  dashboard: DashboardLayout
  sharedBy: string
  sharedByName: string
  shareType: ShareVisibility
  permission: SharePermission
  expiresAt?: string | null
  status: ShareStatus
  accessCode?: string // For public shares
  allowedUsers?: string[] // User IDs who can access
  allowedWorkspaces?: string[] // Workspace IDs who can access
  views: number
  lastAccessedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ShareLink {
  id: string
  dashboardId: string
  url: string
  accessCode: string
  permission: SharePermission
  expiresAt?: string | null
  maxUses?: number | null
  currentUses: number
  createdBy: string
  createdAt: string
}

export interface ShareInvitation {
  id: string
  dashboardShareId: string
  recipientEmail: string
  recipientUserId?: string
  permission: SharePermission
  status: 'pending' | 'accepted' | 'declined'
  invitedBy: string
  invitedByName: string
  expiresAt?: string | null
  sentAt: string
  respondedAt?: string | null
}

export interface DashboardCollaborator {
  userId: string
  userName: string
  userAvatar?: string
  permission: SharePermission
  addedAt: string
  lastAccessedAt?: string | null
  isActive: boolean
}

export interface ShareActivityLog {
  id: string
  dashboardShareId: string
  userId: string
  userName: string
  action: ShareAction
  metadata?: Record<string, any>
  createdAt: string
}

export type ShareAction =
  | 'created'
  | 'viewed'
  | 'edited'
  | 'duplicated'
  | 'permission_changed'
  | 'revoked'
  | 'expired'
  | 'deleted'

export interface CreateShareOptions {
  dashboardId: string
  shareType: ShareVisibility
  permission: SharePermission
  expiresIn?: number // Hours
  allowedUsers?: string[]
  allowedWorkspaces?: string[]
  requireAccessCode?: boolean
}

export interface UpdateShareOptions {
  permission?: SharePermission
  expiresAt?: string | null
  status?: ShareStatus
  allowedUsers?: string[]
  allowedWorkspaces?: string[]
}

export interface ShareAnalytics {
  totalShares: number
  activeShares: number
  totalViews: number
  uniqueViewers: number
  mostViewedDashboard: string
  recentActivity: ShareActivityLog[]
  sharesByType: Record<ShareVisibility, number>
  sharesByPermission: Record<SharePermission, number>
}
