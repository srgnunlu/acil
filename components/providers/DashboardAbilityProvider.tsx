// ============================================
// DASHBOARD ABILITY PROVIDER
// ============================================
// Wraps dashboard with AbilityProvider using workspace context

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { AbilityProvider } from '@/lib/permissions/ability-context'
import type { WorkspaceRole, Permission } from '@/types/multi-tenant.types'

interface DashboardAbilityProviderProps {
  children: ReactNode
}

export function DashboardAbilityProvider({ children }: DashboardAbilityProviderProps) {
  const { currentWorkspace, isLoading } = useWorkspace()
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])

  // Workspace member'dan custom permissions'ı al
  useEffect(() => {
    if (!currentWorkspace?.id) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setCustomPermissions([]), 0)
      return
    }

    async function fetchMemberPermissions() {
      try {
        console.log(
          '[DashboardAbilityProvider] Fetching member permissions for workspace:',
          currentWorkspace.id
        )

        // Use the new /me endpoint to get current user's membership
        const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/me`)

        if (!response.ok) {
          console.warn('[DashboardAbilityProvider] Failed to fetch member permissions:', {
            status: response.status,
            statusText: response.statusText,
            workspaceId: currentWorkspace.id,
          })

          // 403 hatası workspace'te üye olmadığımız anlamına gelebilir
          // Bu durumda boş permissions ile devam et
          setCustomPermissions([])
          return
        }

        const data = await response.json()
        if (data.success && data.member?.permissions) {
          // JSONB permissions'ı parse et
          const permissions = Array.isArray(data.member.permissions) ? data.member.permissions : []
          console.log('[DashboardAbilityProvider] Member permissions loaded:', permissions.length)
          setCustomPermissions(permissions as Permission[])
        } else {
          console.log('[DashboardAbilityProvider] No custom permissions found')
          setCustomPermissions([])
        }
      } catch (error) {
        console.error('[DashboardAbilityProvider] Error fetching member permissions:', error)
        setCustomPermissions([])
      }
    }

    fetchMemberPermissions()
  }, [currentWorkspace?.id])

  // Workspace yüklenene kadar default ability ile devam et
  if (isLoading || !currentWorkspace) {
    // Default olarak 'observer' rolü ile devam et (en kısıtlı)
    return (
      <AbilityProvider role="observer" customPermissions={[]}>
        {children}
      </AbilityProvider>
    )
  }

  // Workspace'ten rol bilgisini al
  const role = (currentWorkspace.user_role || 'observer') as WorkspaceRole

  return (
    <AbilityProvider role={role} customPermissions={customPermissions}>
      {children}
    </AbilityProvider>
  )
}
