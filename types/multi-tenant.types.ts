// ============================================
// MULTI-TENANT TYPE DEFINITIONS
// ============================================
// Organization, Workspace, Members, Categories types

// ============================================
// ORGANIZATIONS
// ============================================

export type OrganizationType = 'hospital' | 'clinic' | 'health_center' | 'private_practice'

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export type SubscriptionStatus = 'active' | 'inactive' | 'trial' | 'cancelled'

export interface OrganizationSettings {
  timezone?: string
  language?: string
  date_format?: string
  time_format?: string
  [key: string]: unknown
}

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrganizationType
  logo_url?: string | null
  settings: OrganizationSettings

  // Subscription
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  trial_ends_at?: string | null

  // Limits
  max_users: number
  max_workspaces: number
  max_patients_per_workspace: number

  // Contact (optional)
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null

  // Metadata
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface CreateOrganizationInput {
  name: string
  slug: string
  type?: OrganizationType
  logo_url?: string
  settings?: OrganizationSettings
  subscription_tier?: SubscriptionTier
  contact_email?: string
  contact_phone?: string
  address?: string
}

export interface UpdateOrganizationInput {
  name?: string
  logo_url?: string
  settings?: OrganizationSettings
  contact_email?: string
  contact_phone?: string
  address?: string
  subscription_tier?: SubscriptionTier
  subscription_status?: SubscriptionStatus
  max_users?: number
  max_workspaces?: number
  max_patients_per_workspace?: number
}

// ============================================
// WORKSPACES
// ============================================

export type WorkspaceType =
  | 'emergency'
  | 'icu'
  | 'cardiology'
  | 'surgery'
  | 'internal_medicine'
  | 'pediatrics'
  | 'neurology'
  | 'orthopedics'
  | 'oncology'
  | 'general'
  | 'custom'

export interface WorkspaceSettings {
  patient_limit?: number
  require_approval_for_new_patients?: boolean
  enable_auto_analysis?: boolean
  enable_notifications?: boolean
  [key: string]: unknown
}

export interface Workspace {
  id: string
  organization_id: string

  // Identity
  name: string
  slug: string
  description?: string | null
  type: WorkspaceType

  // Appearance
  color: string
  icon: string

  // Settings
  settings: WorkspaceSettings
  is_active: boolean

  // Metadata
  created_by?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface WorkspaceWithDetails extends Workspace {
  organization: Organization
  member_count?: number
  patient_count?: number
  category_count?: number
  user_role?: WorkspaceRole
}

export interface CreateWorkspaceInput {
  organization_id: string
  name: string
  slug: string
  description?: string
  type?: WorkspaceType
  color?: string
  icon?: string
  settings?: WorkspaceSettings
}

export interface UpdateWorkspaceInput {
  name?: string
  description?: string
  color?: string
  icon?: string
  settings?: WorkspaceSettings
  is_active?: boolean
}

// ============================================
// WORKSPACE MEMBERS
// ============================================

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'senior_doctor'
  | 'doctor'
  | 'resident'
  | 'nurse'
  | 'observer'

export type MemberStatus = 'active' | 'inactive' | 'pending'

export type Permission =
  | 'patients.create'
  | 'patients.read'
  | 'patients.update'
  | 'patients.delete'
  | 'patients.export'
  | 'ai.analyze'
  | 'ai.chat'
  | 'notes.create'
  | 'notes.read'
  | 'notes.update'
  | 'notes.delete'
  | 'workspace.manage'
  | 'workspace.settings'
  | 'users.invite'
  | 'users.remove'
  | 'analytics.view'
  | 'audit.view'

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string

  // Role & Permissions
  role: WorkspaceRole
  permissions: Permission[]

  // Status
  status: MemberStatus

  // Invitation
  invited_by?: string | null
  invited_at?: string | null
  joined_at: string

  // Metadata
  created_at: string
  updated_at: string
}

export interface WorkspaceMemberWithProfile extends WorkspaceMember {
  profile?: {
    full_name?: string | null
    avatar_url?: string | null
    title?: string | null
    specialty?: string | null
  }
}

export interface InviteMemberInput {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  permissions?: Permission[]
}

export interface UpdateMemberInput {
  role?: WorkspaceRole
  permissions?: Permission[]
  status?: MemberStatus
}

// ============================================
// PATIENT CATEGORIES
// ============================================

export interface PatientCategory {
  id: string
  workspace_id: string

  // Category details
  name: string
  slug: string
  color: string
  icon?: string | null
  description?: string | null

  // Ordering
  sort_order: number

  // Behavior
  is_default: boolean
  is_system: boolean

  // Metadata
  created_by?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface CreateCategoryInput {
  workspace_id: string
  name: string
  slug: string
  color?: string
  icon?: string
  description?: string
  sort_order?: number
  is_default?: boolean
}

export interface UpdateCategoryInput {
  name?: string
  color?: string
  icon?: string
  description?: string
  sort_order?: number
  is_default?: boolean
}

// ============================================
// PATIENT ASSIGNMENTS
// ============================================

export type AssignmentType = 'primary' | 'secondary' | 'consultant' | 'nurse' | 'observer'

export interface PatientAssignment {
  id: string
  patient_id: string
  user_id: string

  // Assignment type
  assignment_type: AssignmentType

  // Status
  is_active: boolean

  // Metadata
  assigned_by?: string | null
  assigned_at: string
  removed_at?: string | null
  created_at: string
}

export interface PatientAssignmentWithProfile extends PatientAssignment {
  profile?: {
    full_name?: string | null
    avatar_url?: string | null
    title?: string | null
    specialty?: string | null
  }
}

export interface CreateAssignmentInput {
  patient_id: string
  user_id: string
  assignment_type: AssignmentType
}

// ============================================
// WORKFLOW STATES
// ============================================

export type WorkflowState =
  | 'admission'
  | 'assessment'
  | 'diagnosis'
  | 'treatment'
  | 'observation'
  | 'discharge_planning'
  | 'discharged'

// ============================================
// ROLE PERMISSIONS HELPER
// ============================================

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.delete',
    'patients.export',
    'ai.analyze',
    'ai.chat',
    'notes.create',
    'notes.read',
    'notes.update',
    'notes.delete',
    'workspace.manage',
    'workspace.settings',
    'users.invite',
    'users.remove',
    'analytics.view',
    'audit.view',
  ],
  admin: [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.delete',
    'patients.export',
    'ai.analyze',
    'ai.chat',
    'notes.create',
    'notes.read',
    'notes.update',
    'notes.delete',
    'workspace.settings',
    'users.invite',
    'users.remove',
    'analytics.view',
    'audit.view',
  ],
  senior_doctor: [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.delete',
    'patients.export',
    'ai.analyze',
    'ai.chat',
    'notes.create',
    'notes.read',
    'notes.update',
    'notes.delete',
    'analytics.view',
  ],
  doctor: [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.export',
    'ai.analyze',
    'ai.chat',
    'notes.create',
    'notes.read',
    'notes.update',
  ],
  resident: [
    'patients.create',
    'patients.read',
    'patients.update',
    'ai.analyze',
    'ai.chat',
    'notes.create',
    'notes.read',
  ],
  nurse: [
    'patients.read',
    'notes.create',
    'notes.read',
  ],
  observer: [
    'patients.read',
    'notes.read',
  ],
}

// Helper function to check permission
export function hasPermission(
  role: WorkspaceRole,
  customPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  // Check custom permissions first
  if (customPermissions.includes(requiredPermission)) {
    return true
  }

  // Check role-based permissions
  return ROLE_PERMISSIONS[role]?.includes(requiredPermission) ?? false
}

// ============================================
// WORKSPACE TYPE METADATA
// ============================================

export interface WorkspaceTypeMetadata {
  label: string
  icon: string
  color: string
  description: string
}

export const WORKSPACE_TYPE_METADATA: Record<WorkspaceType, WorkspaceTypeMetadata> = {
  emergency: {
    label: 'Acil Servis',
    icon: '🚑',
    color: '#dc2626',
    description: 'Acil tıp servisi - Kırmızı/Sarı/Yeşil alan',
  },
  icu: {
    label: 'Yoğun Bakım',
    icon: '🏥',
    color: '#7c2d12',
    description: 'Yoğun bakım ünitesi',
  },
  cardiology: {
    label: 'Kardiyoloji',
    icon: '❤️',
    color: '#dc2626',
    description: 'Kardiyoloji servisi',
  },
  surgery: {
    label: 'Cerrahi',
    icon: '🔪',
    color: '#0891b2',
    description: 'Genel cerrahi servisi',
  },
  internal_medicine: {
    label: 'Dahiliye',
    icon: '🩺',
    color: '#2563eb',
    description: 'İç hastalıkları servisi',
  },
  pediatrics: {
    label: 'Pediatri',
    icon: '👶',
    color: '#ec4899',
    description: 'Çocuk sağlığı ve hastalıkları',
  },
  neurology: {
    label: 'Nöroloji',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'Nöroloji servisi',
  },
  orthopedics: {
    label: 'Ortopedi',
    icon: '🦴',
    color: '#f59e0b',
    description: 'Ortopedi ve travmatoloji',
  },
  oncology: {
    label: 'Onkoloji',
    icon: '🎗️',
    color: '#a855f7',
    description: 'Onkoloji servisi',
  },
  general: {
    label: 'Genel',
    icon: '🏥',
    color: '#3b82f6',
    description: 'Genel servis',
  },
  custom: {
    label: 'Özel',
    icon: '⚙️',
    color: '#6b7280',
    description: 'Özel tanımlı servis',
  },
}
