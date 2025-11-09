// ============================================
// CASL ABILITY CONTEXT
// ============================================
// React Context for managing user abilities

'use client'

import { createContext, useContext, ReactNode } from 'react'
import { createContextualCan } from '@casl/react'
import type { AppAbility } from './ability'
import { defineAbilityFor } from './ability'
import type { WorkspaceRole, Permission } from '@/types/multi-tenant.types'

// ============================================
// CONTEXT
// ============================================

export const AbilityContext = createContext<AppAbility | undefined>(undefined)

// Create the Can component for conditional rendering
export const Can = createContextualCan(AbilityContext.Consumer)

// ============================================
// PROVIDER
// ============================================

interface AbilityProviderProps {
  role: WorkspaceRole
  customPermissions?: Permission[]
  userId?: string
  children: ReactNode
}

export function AbilityProvider({
  role,
  customPermissions = [],
  userId,
  children,
}: AbilityProviderProps) {
  const ability = defineAbilityFor({ role, customPermissions, userId })

  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access the current user's ability
 */
export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext)

  if (!ability) {
    throw new Error('useAbility must be used within an AbilityProvider')
  }

  return ability
}

/**
 * Hook to check if user can perform an action
 */
export function usePermission(action: string, subject: string): boolean {
  const ability = useAbility()
  return ability.can(action as any, subject as any)
}

/**
 * Hook to check multiple permissions (returns true if user has ALL permissions)
 */
export function usePermissions(permissions: Array<[string, string]>): boolean {
  const ability = useAbility()
  return permissions.every(([action, subject]) => ability.can(action as any, subject as any))
}

/**
 * Hook to check if user has ANY of the given permissions
 */
export function useAnyPermission(permissions: Array<[string, string]>): boolean {
  const ability = useAbility()
  return permissions.some(([action, subject]) => ability.can(action as any, subject as any))
}
