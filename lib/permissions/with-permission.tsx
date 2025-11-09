// ============================================
// HIGHER-ORDER COMPONENT FOR ROUTE PROTECTION
// ============================================
// HOC pattern for protecting routes with permissions

import { ComponentType } from 'react'
import { requireRoutePermission, type RouteGuardOptions } from './route-guards'

// ============================================
// WITH PERMISSION HOC
// ============================================

/**
 * Higher-order component that protects a page with permission check
 *
 * @example
 * // app/dashboard/patients/new/page.tsx
 * export default withPermission({
 *   permission: 'patients.create',
 *   redirectTo: '/dashboard/patients'
 * })(NewPatientPage)
 */
export function withPermission<P extends object>(options: RouteGuardOptions) {
  return function <T extends ComponentType<P>>(Component: T): T {
    const ProtectedComponent = async (props: P) => {
      await requireRoutePermission(options)
      return <Component {...props} />
    }

    ProtectedComponent.displayName = `withPermission(${Component.displayName || Component.name})`

    return ProtectedComponent as T
  }
}

/**
 * Higher-order component that protects a page with role check
 *
 * @example
 * // app/dashboard/admin/page.tsx
 * export default withRole({
 *   roles: ['owner', 'admin'],
 *   redirectTo: '/dashboard'
 * })(AdminPage)
 */
export function withRole<P extends object>(
  options: Omit<RouteGuardOptions, 'permission'> & { roles: string[] }
) {
  return function <T extends ComponentType<P>>(Component: T): T {
    const ProtectedComponent = async (props: P) => {
      await requireRoutePermission({
        ...options,
        permission: undefined,
      })
      return <Component {...props} />
    }

    ProtectedComponent.displayName = `withRole(${Component.displayName || Component.name})`

    return ProtectedComponent as T
  }
}
