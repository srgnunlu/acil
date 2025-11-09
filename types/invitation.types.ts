// ============================================
// INVITATION TYPE DEFINITIONS
// ============================================

import type { WorkspaceRole, Permission } from './multi-tenant.types'

// ============================================
// INVITATION STATUS
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'

// ============================================
// INVITATION INTERFACE
// ============================================

export interface WorkspaceInvitation {
  id: string
  workspace_id: string

  // Invitee
  email: string
  invited_user_id?: string | null

  // Role & Permissions
  role: WorkspaceRole
  custom_permissions: Permission[]

  // Invitation details
  invitation_token: string
  invited_by: string
  invited_at: string
  expires_at: string

  // Status
  status: InvitationStatus

  // Acceptance/Decline
  accepted_at?: string | null
  declined_at?: string | null

  // Message
  message?: string | null

  // Metadata
  created_at: string
  updated_at: string
}

export interface WorkspaceInvitationWithDetails extends WorkspaceInvitation {
  workspace?: {
    id: string
    name: string
    slug: string
    type: string
    color: string
    icon: string
  }
  inviter?: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
    title?: string | null
  }
}

// ============================================
// API INPUTS
// ============================================

export interface CreateInvitationInput {
  workspace_id: string
  email: string
  role: WorkspaceRole
  custom_permissions?: Permission[]
  message?: string
  expires_in_days?: number // Default: 7 days
}

export interface UpdateInvitationInput {
  status?: InvitationStatus
  message?: string
}

export interface AcceptInvitationInput {
  invitation_token: string
}

export interface DeclineInvitationInput {
  invitation_token: string
}

export interface ResendInvitationInput {
  invitation_id: string
}

// ============================================
// API RESPONSES
// ============================================

export interface InvitationResponse {
  success: boolean
  invitation?: WorkspaceInvitation
  error?: string
}

export interface InvitationsListResponse {
  success: boolean
  invitations: WorkspaceInvitationWithDetails[]
  total: number
  error?: string
}

export interface AcceptInvitationResponse {
  success: boolean
  member_id?: string
  workspace_id?: string
  error?: string
}

// ============================================
// FILTERS
// ============================================

export interface InvitationFilters {
  workspace_id?: string
  email?: string
  status?: InvitationStatus
  role?: WorkspaceRole
  limit?: number
  offset?: number
}
