// ============================================
// PERMISSION MIDDLEWARE
// ============================================
// Backend permission checking middleware

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Permission, WorkspaceRole } from '@/types/multi-tenant.types'
import { hasPermission, ROLE_PERMISSIONS } from './ability'

// ============================================
// TYPES
// ============================================

export interface PermissionCheckResult {
  allowed: boolean
  user?: {
    id: string
    role: WorkspaceRole
    permissions: Permission[]
  }
  error?: string
}

// ============================================
// CHECK PERMISSION
// ============================================

/**
 * Check if the current user has a specific permission in a workspace
 */
export async function checkPermission(
  workspaceId: string,
  requiredPermission: Permission
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        allowed: false,
        error: 'Kimlik doğrulama gerekli',
      }
    }

    // Get workspace membership
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !membership) {
      return {
        allowed: false,
        error: 'Workspace üyeliği bulunamadı',
      }
    }

    // Check permission
    const customPermissions = (membership.permissions as Permission[]) || []
    const allowed = hasPermission(
      membership.role as WorkspaceRole,
      customPermissions,
      requiredPermission
    )

    return {
      allowed,
      user: {
        id: user.id,
        role: membership.role as WorkspaceRole,
        permissions: [
          ...(ROLE_PERMISSIONS[membership.role as WorkspaceRole] || []),
          ...customPermissions,
        ],
      },
      error: allowed ? undefined : 'Yeterli izin yok',
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return {
      allowed: false,
      error: 'İzin kontrolü sırasında hata oluştu',
    }
  }
}

/**
 * Check if the current user has any of the required permissions
 */
export async function checkAnyPermission(
  workspaceId: string,
  requiredPermissions: Permission[]
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        allowed: false,
        error: 'Kimlik doğrulama gerekli',
      }
    }

    // Get workspace membership
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !membership) {
      return {
        allowed: false,
        error: 'Workspace üyeliği bulunamadı',
      }
    }

    // Check if user has ANY of the required permissions
    const customPermissions = (membership.permissions as Permission[]) || []
    const allowed = requiredPermissions.some((permission) =>
      hasPermission(membership.role as WorkspaceRole, customPermissions, permission)
    )

    return {
      allowed,
      user: {
        id: user.id,
        role: membership.role as WorkspaceRole,
        permissions: [
          ...(ROLE_PERMISSIONS[membership.role as WorkspaceRole] || []),
          ...customPermissions,
        ],
      },
      error: allowed ? undefined : 'Yeterli izin yok',
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return {
      allowed: false,
      error: 'İzin kontrolü sırasında hata oluştu',
    }
  }
}

/**
 * Check if the current user has all of the required permissions
 */
export async function checkAllPermissions(
  workspaceId: string,
  requiredPermissions: Permission[]
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        allowed: false,
        error: 'Kimlik doğrulama gerekli',
      }
    }

    // Get workspace membership
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !membership) {
      return {
        allowed: false,
        error: 'Workspace üyeliği bulunamadı',
      }
    }

    // Check if user has ALL of the required permissions
    const customPermissions = (membership.permissions as Permission[]) || []
    const allowed = requiredPermissions.every((permission) =>
      hasPermission(membership.role as WorkspaceRole, customPermissions, permission)
    )

    return {
      allowed,
      user: {
        id: user.id,
        role: membership.role as WorkspaceRole,
        permissions: [
          ...(ROLE_PERMISSIONS[membership.role as WorkspaceRole] || []),
          ...customPermissions,
        ],
      },
      error: allowed ? undefined : 'Yeterli izin yok',
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return {
      allowed: false,
      error: 'İzin kontrolü sırasında hata oluştu',
    }
  }
}

// ============================================
// REQUIRE PERMISSION (throws if not allowed)
// ============================================

/**
 * Require permission middleware - throws if user doesn't have permission
 * Use this in API routes to protect endpoints
 */
export async function requirePermission(
  workspaceId: string,
  requiredPermission: Permission
): Promise<{
  user: {
    id: string
    role: WorkspaceRole
    permissions: Permission[]
  }
}> {
  const result = await checkPermission(workspaceId, requiredPermission)

  if (!result.allowed) {
    throw new Error(result.error || 'Yeterli izin yok')
  }

  return { user: result.user! }
}

/**
 * Require role middleware - throws if user doesn't have required role
 */
export async function requireRole(
  workspaceId: string,
  requiredRoles: WorkspaceRole[]
): Promise<{
  user: {
    id: string
    role: WorkspaceRole
    permissions: Permission[]
  }
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Kimlik doğrulama gerekli')
    }

    // Get workspace membership
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (memberError || !membership) {
      throw new Error('Workspace üyeliği bulunamadı')
    }

    // Check if user has required role
    const hasRequiredRole = requiredRoles.includes(membership.role as WorkspaceRole)

    if (!hasRequiredRole) {
      throw new Error('Yeterli rol yok')
    }

    const customPermissions = (membership.permissions as Permission[]) || []

    return {
      user: {
        id: user.id,
        role: membership.role as WorkspaceRole,
        permissions: [
          ...(ROLE_PERMISSIONS[membership.role as WorkspaceRole] || []),
          ...customPermissions,
        ],
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('İzin kontrolü sırasında hata oluştu')
  }
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Return a 403 Forbidden response
 */
export function forbiddenResponse(message = 'Bu işlem için yetkiniz bulunmamaktadır.') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Return a 401 Unauthorized response
 */
export function unauthorizedResponse(message = 'Kimlik doğrulama gerekli') {
  return NextResponse.json({ error: message }, { status: 401 })
}
