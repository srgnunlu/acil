// ============================================
// CASL ABILITY DEFINITIONS
// ============================================
// Define permissions using CASL (isomorphic authorization)

import { AbilityBuilder, PureAbility, AbilityClass } from '@casl/ability'
import type { Permission, WorkspaceRole } from '@/types/multi-tenant.types'

// ============================================
// ABILITY TYPES
// ============================================

// Subject types that can be authorized
export type Subjects =
  | 'Patient'
  | 'Note'
  | 'Workspace'
  | 'User'
  | 'Analytics'
  | 'Audit'
  | 'AI'
  | 'Protocol'
  | 'ProtocolCategory'
  | 'all'

// Actions that can be performed
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'analyze' | 'chat' | 'view' | 'invite' | 'remove'

// Define the Ability type
export type AppAbility = PureAbility<[Actions, Subjects]>
export const AppAbility = PureAbility as AbilityClass<AppAbility>

// ============================================
// PERMISSION TO CASL MAPPING
// ============================================

// Map our Permission enum to CASL actions and subjects
export const permissionToAbility = (permission: Permission): [Actions, Subjects] => {
  const mapping: Record<Permission, [Actions, Subjects]> = {
    'patients.create': ['create', 'Patient'],
    'patients.read': ['read', 'Patient'],
    'patients.update': ['update', 'Patient'],
    'patients.delete': ['delete', 'Patient'],
    'patients.export': ['export', 'Patient'],
    'ai.analyze': ['analyze', 'AI'],
    'ai.chat': ['chat', 'AI'],
    'notes.create': ['create', 'Note'],
    'notes.read': ['read', 'Note'],
    'notes.update': ['update', 'Note'],
    'notes.delete': ['delete', 'Note'],
    'workspace.manage': ['manage', 'Workspace'],
    'workspace.settings': ['update', 'Workspace'],
    'users.invite': ['invite', 'User'],
    'users.remove': ['remove', 'User'],
    'analytics.view': ['view', 'Analytics'],
    'audit.view': ['view', 'Audit'],
  }

  return mapping[permission]
}

// ============================================
// ROLE-BASED PERMISSIONS (from multi-tenant.types.ts)
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
  nurse: ['patients.read', 'notes.create', 'notes.read'],
  observer: ['patients.read', 'notes.read'],
}

// ============================================
// DEFINE ABILITY FOR USER
// ============================================

export interface DefineAbilityParams {
  role: WorkspaceRole
  customPermissions?: Permission[]
  userId?: string
}

export function defineAbilityFor(params: DefineAbilityParams): AppAbility {
  const { role, customPermissions = [], userId } = params
  const { can, build } = new AbilityBuilder(AppAbility)

  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[role] || []

  // Combine role permissions and custom permissions
  const allPermissions = [...new Set([...rolePermissions, ...customPermissions])]

  // Convert each permission to CASL rules
  allPermissions.forEach((permission) => {
    const [action, subject] = permissionToAbility(permission)
    can(action, subject)
  })

  // Build and return the ability
  return build()
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a user has a specific permission
 */
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

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: WorkspaceRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a role can perform an action on a subject
 */
export function canPerformAction(
  role: WorkspaceRole,
  customPermissions: Permission[],
  action: Actions,
  subject: Subjects
): boolean {
  const ability = defineAbilityFor({ role, customPermissions })
  return ability.can(action, subject)
}

/**
 * Get all available permissions (for UI selectors)
 */
export function getAllPermissions(): Permission[] {
  return [
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
  ]
}

/**
 * Get permission label (for UI display)
 */
export function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    'patients.create': 'Hasta Oluştur',
    'patients.read': 'Hasta Görüntüle',
    'patients.update': 'Hasta Güncelle',
    'patients.delete': 'Hasta Sil',
    'patients.export': 'Hasta Export Et',
    'ai.analyze': 'AI Analiz',
    'ai.chat': 'AI Chat',
    'notes.create': 'Not Oluştur',
    'notes.read': 'Not Görüntüle',
    'notes.update': 'Not Güncelle',
    'notes.delete': 'Not Sil',
    'workspace.manage': 'Workspace Yönet',
    'workspace.settings': 'Workspace Ayarları',
    'users.invite': 'Kullanıcı Davet Et',
    'users.remove': 'Kullanıcı Çıkar',
    'analytics.view': 'Analytics Görüntüle',
    'audit.view': 'Audit Log Görüntüle',
  }

  return labels[permission]
}

/**
 * Get role label (for UI display)
 */
export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    owner: 'Sahip',
    admin: 'Yönetici',
    senior_doctor: 'Uzman Doktor',
    doctor: 'Doktor',
    resident: 'Asistan',
    nurse: 'Hemşire',
    observer: 'Gözlemci',
  }

  return labels[role]
}

/**
 * Get role description (for UI display)
 */
export function getRoleDescription(role: WorkspaceRole): string {
  const descriptions: Record<WorkspaceRole, string> = {
    owner: 'Tüm izinler, workspace yönetimi ve kullanıcı yönetimi',
    admin: 'Hasta yönetimi, kullanıcı yönetimi ve ayarlar',
    senior_doctor: 'Tüm hasta işlemleri, AI analiz ve raporlama',
    doctor: 'Hasta ekleme, güncelleme ve AI analiz',
    resident: 'Hasta ekleme, güncelleme ve sınırlı işlemler',
    nurse: 'Hasta görüntüleme ve not ekleme',
    observer: 'Sadece görüntüleme izni',
  }

  return descriptions[role]
}
