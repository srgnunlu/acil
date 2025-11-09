'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { AbilityProvider } from '@/lib/permissions/ability-context'
import type { WorkspaceRole, Permission } from '@/types/multi-tenant.types'

interface ProvidersProps {
  children: ReactNode
  // Optional: Workspace-based ability props
  workspaceRole?: WorkspaceRole
  workspacePermissions?: Permission[]
  userId?: string
}

export function Providers({
  children,
  workspaceRole,
  workspacePermissions,
  userId,
}: ProvidersProps) {
  // Eğer workspace bilgileri varsa AbilityProvider ekle
  if (workspaceRole) {
    return (
      <ToastProvider>
        <AbilityProvider
          role={workspaceRole}
          customPermissions={workspacePermissions || []}
          userId={userId}
        >
          {children}
          <PWAInstallPrompt />
        </AbilityProvider>
      </ToastProvider>
    )
  }

  // Workspace bilgisi yoksa sadece temel provider'ları kullan
  return (
    <ToastProvider>
      {children}
      <PWAInstallPrompt />
    </ToastProvider>
  )
}
