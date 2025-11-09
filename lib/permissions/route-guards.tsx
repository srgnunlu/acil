// ============================================
// ROUTE-LEVEL PERMISSION GUARDS
// ============================================
// Server-side route protection utilities for Next.js App Router

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Permission, WorkspaceRole } from '@/types/multi-tenant.types'
import { hasPermission, ROLE_PERMISSIONS } from './ability'

// ============================================
// TYPES
// ============================================

export interface RouteGuardOptions {
  permission?: Permission
  roles?: WorkspaceRole[]
  requireAllRoles?: boolean // If true, user must have ALL roles. If false, ANY role is enough
  redirectTo?: string
  requireWorkspace?: boolean // If true, user must have an active workspace
}

// ============================================
// CHECK PERMISSION (Server-side)
// ============================================

/**
 * Check if user has permission in their current workspace
 * Returns null if allowed, redirects if not allowed
 */
export async function checkRoutePermission(
  options: RouteGuardOptions
): Promise<{ allowed: boolean; workspaceId?: string; error?: string }> {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(options.redirectTo || '/login')
  }

  // If workspace is required, get current workspace
  if (options.requireWorkspace !== false) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, permissions')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!membership) {
      // No workspace found, redirect to setup
      redirect(options.redirectTo || '/setup')
    }

    const workspaceId = membership.workspace_id

    // Check role if required
    if (options.roles && options.roles.length > 0) {
      const userRole = membership.role as WorkspaceRole
      const hasRequiredRole = options.requireAllRoles
        ? options.roles.every((role) => role === userRole)
        : options.roles.includes(userRole)

      if (!hasRequiredRole) {
        return {
          allowed: false,
          workspaceId,
          error: 'Yeterli rol yok',
        }
      }
    }

    // Check permission if required
    if (options.permission) {
      const customPermissions = (membership.permissions as Permission[]) || []
      const allowed = hasPermission(
        membership.role as WorkspaceRole,
        customPermissions,
        options.permission
      )

      if (!allowed) {
        return {
          allowed: false,
          workspaceId,
          error: 'Yeterli izin yok',
        }
      }
    }

    return {
      allowed: true,
      workspaceId,
    }
  }

  // No workspace required, just check authentication
  return {
    allowed: true,
  }
}

// ============================================
// REQUIRE PERMISSION (Throws/Redirects)
// ============================================

/**
 * Require permission - redirects if user doesn't have permission
 * Use this in server components or server actions
 *
 * @example
 * // In a page.tsx or layout.tsx
 * export default async function MyPage() {
 *   await requireRoutePermission({
 *     permission: 'patients.create',
 *     redirectTo: '/dashboard/patients'
 *   })
 *
 *   return <div>Protected content</div>
 * }
 */
export async function requireRoutePermission(
  options: RouteGuardOptions
): Promise<{ workspaceId: string }> {
  const result = await checkRoutePermission(options)

  if (!result.allowed) {
    redirect(options.redirectTo || '/dashboard')
  }

  if (!result.workspaceId) {
    redirect(options.redirectTo || '/setup')
  }

  return {
    workspaceId: result.workspaceId,
  }
}

/**
 * Require role - redirects if user doesn't have required role
 *
 * @example
 * export default async function AdminPage() {
 *   await requireRouteRole({
 *     roles: ['owner', 'admin'],
 *     redirectTo: '/dashboard'
 *   })
 *
 *   return <div>Admin content</div>
 * }
 */
export async function requireRouteRole(
  options: Omit<RouteGuardOptions, 'permission'> & { roles: WorkspaceRole[] }
): Promise<{ workspaceId: string }> {
  return requireRoutePermission({
    ...options,
    permission: undefined,
  })
}

// ============================================
// GET USER WORKSPACE INFO
// ============================================

/**
 * Get current user's workspace information
 * Useful for pages that need workspace context
 *
 * @example
 * export default async function MyPage() {
 *   const { workspaceId, role } = await getUserWorkspaceInfo()
 *
 *   return <div>Workspace: {workspaceId}</div>
 * }
 */
export async function getUserWorkspaceInfo(): Promise<{
  workspaceId: string
  role: WorkspaceRole
  permissions: Permission[]
  userId: string
} | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, permissions')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!membership) {
    return null
  }

  const customPermissions = (membership.permissions as Permission[]) || []
  const rolePermissions = ROLE_PERMISSIONS[membership.role as WorkspaceRole] || []

  return {
    workspaceId: membership.workspace_id,
    role: membership.role as WorkspaceRole,
    permissions: [...rolePermissions, ...customPermissions],
    userId: user.id,
  }
}

// ============================================
// HELPER: CHECK MULTIPLE PERMISSIONS
// ============================================

/**
 * Check if user has any of the required permissions
 */
export async function checkAnyRoutePermission(
  permissions: Permission[],
  redirectTo?: string
): Promise<{ allowed: boolean; workspaceId?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(redirectTo || '/login')
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, permissions')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!membership) {
    redirect(redirectTo || '/setup')
  }

  const customPermissions = (membership.permissions as Permission[]) || []
  const hasAnyPermission = permissions.some((permission) =>
    hasPermission(membership.role as WorkspaceRole, customPermissions, permission)
  )

  return {
    allowed: hasAnyPermission,
    workspaceId: membership.workspace_id,
  }
}
