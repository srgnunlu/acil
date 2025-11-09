// ============================================
// PERMISSION GUARDS
// ============================================
// Permission guard components and utilities

'use client'

import { ReactNode } from 'react'
import { usePermission, useAbility } from './ability-context'
import type { Actions, Subjects } from './ability'
import type { Permission } from '@/types/multi-tenant.types'

// ============================================
// PROTECTED COMPONENT
// ============================================

interface ProtectedProps {
  permission: Permission | [Actions, Subjects]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Render children only if user has the required permission
 *
 * @example
 * <Protected permission="patients.create">
 *   <AddPatientButton />
 * </Protected>
 *
 * @example
 * <Protected permission={['create', 'Patient']} fallback={<div>No access</div>}>
 *   <AddPatientButton />
 * </Protected>
 */
export function Protected({ permission, children, fallback = null }: ProtectedProps) {
  const ability = useAbility()

  let canAccess = false

  if (Array.isArray(permission)) {
    // Direct CASL action/subject check
    const [action, subject] = permission
    canAccess = ability.can(action, subject)
  } else {
    // Permission string check (needs mapping)
    // This will be handled by the ability definition
    // For now, we'll parse the permission string
    const [resource, action] = permission.split('.')

    const subjectMap: Record<string, Subjects> = {
      patients: 'Patient',
      notes: 'Note',
      workspace: 'Workspace',
      users: 'User',
      analytics: 'Analytics',
      audit: 'Audit',
      ai: 'AI',
    }

    const actionMap: Record<string, Actions> = {
      create: 'create',
      read: 'read',
      update: 'update',
      delete: 'delete',
      export: 'export',
      analyze: 'analyze',
      chat: 'chat',
      view: 'view',
      invite: 'invite',
      remove: 'remove',
      manage: 'manage',
      settings: 'update',
    }

    const subject = subjectMap[resource] || 'all'
    const mappedAction = actionMap[action] || 'read'

    canAccess = ability.can(mappedAction, subject)
  }

  return canAccess ? <>{children}</> : <>{fallback}</>
}

// ============================================
// REQUIRE PERMISSION
// ============================================

interface RequirePermissionProps {
  permissions: Permission[] | Array<[Actions, Subjects]>
  requireAll?: boolean // If true, user must have ALL permissions. If false, ANY permission is enough
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Render children only if user has required permissions
 *
 * @example
 * <RequirePermission permissions={['patients.create', 'patients.update']}>
 *   <EditPatientForm />
 * </RequirePermission>
 *
 * @example
 * <RequirePermission
 *   permissions={['patients.create', 'patients.update']}
 *   requireAll={false}
 * >
 *   <EditPatientForm />
 * </RequirePermission>
 */
export function RequirePermission({
  permissions,
  requireAll = true,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const ability = useAbility()

  const checkPermission = (permission: Permission | [Actions, Subjects]): boolean => {
    if (Array.isArray(permission)) {
      const [action, subject] = permission
      return ability.can(action, subject)
    }

    // Parse permission string
    const [resource, action] = permission.split('.')

    const subjectMap: Record<string, Subjects> = {
      patients: 'Patient',
      notes: 'Note',
      workspace: 'Workspace',
      users: 'User',
      analytics: 'Analytics',
      audit: 'Audit',
      ai: 'AI',
    }

    const actionMap: Record<string, Actions> = {
      create: 'create',
      read: 'read',
      update: 'update',
      delete: 'delete',
      export: 'export',
      analyze: 'analyze',
      chat: 'chat',
      view: 'view',
      invite: 'invite',
      remove: 'remove',
      manage: 'manage',
      settings: 'update',
    }

    const subject = subjectMap[resource] || 'all'
    const mappedAction = actionMap[action] || 'read'

    return ability.can(mappedAction, subject)
  }

  const canAccess = requireAll
    ? permissions.every(checkPermission)
    : permissions.some(checkPermission)

  return canAccess ? <>{children}</> : <>{fallback}</>
}

// ============================================
// REQUIRE ROLE
// ============================================

interface RequireRoleProps {
  roles: string[]
  userRole: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Render children only if user has one of the required roles
 *
 * @example
 * <RequireRole roles={['owner', 'admin']} userRole={currentRole}>
 *   <AdminPanel />
 * </RequireRole>
 */
export function RequireRole({ roles, userRole, children, fallback = null }: RequireRoleProps) {
  const hasRole = roles.includes(userRole)
  return hasRole ? <>{children}</> : <>{fallback}</>
}

// ============================================
// UNAUTHORIZED COMPONENT
// ============================================

interface UnauthorizedProps {
  message?: string
}

/**
 * Display an unauthorized access message
 */
export function Unauthorized({ message = 'Bu işlem için yetkiniz bulunmamaktadır.' }: UnauthorizedProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-4 text-6xl">🔒</div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Yetkisiz Erişim</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
