// ============================================
// PERMISSIONS MODULE EXPORTS
// ============================================

// Ability
export {
  defineAbilityFor,
  hasPermission,
  getPermissionsForRole,
  canPerformAction,
  getAllPermissions,
  getPermissionLabel,
  getRoleLabel,
  getRoleDescription,
  ROLE_PERMISSIONS,
  AppAbility,
} from './ability'

export type { DefineAbilityParams, Actions, Subjects } from './ability'

// Context & Hooks
export {
  AbilityContext,
  AbilityProvider,
  Can,
  useAbility,
  usePermission,
  usePermissions,
  useAnyPermission,
} from './ability-context'

// Guards
export { Protected, RequirePermission, RequireRole, Unauthorized } from './guards'

// Note: Middleware exports are intentionally excluded from this index
// Import middleware directly from './middleware' in server-side code only
// This prevents client-side bundling of server-only dependencies
