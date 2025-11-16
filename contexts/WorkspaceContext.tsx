'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { WorkspaceWithDetails, Organization } from '@/types'

interface WorkspaceContextType {
  // Current workspace
  currentWorkspace: WorkspaceWithDetails | null
  setCurrentWorkspace: (workspace: WorkspaceWithDetails | null) => void

  // All user workspaces
  workspaces: WorkspaceWithDetails[]
  setWorkspaces: (workspaces: WorkspaceWithDetails[]) => void

  // Organizations
  organizations: Organization[]
  setOrganizations: (orgs: Organization[]) => void
  currentOrganization: Organization | null
  setCurrentOrganization: (org: Organization | null) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Helper functions
  switchWorkspace: (workspaceId: string) => Promise<void>
  switchOrganization: (organizationId: string) => Promise<void>
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithDetails | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceWithDetails[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces()
  }, [])

  // Load current organization from localStorage or current workspace
  useEffect(() => {
    if (organizations.length > 0 && !currentOrganization) {
      const savedOrgId = localStorage.getItem('currentOrganizationId')

      if (savedOrgId) {
        const org = organizations.find((o) => o.id === savedOrgId)
        if (org) {
          setCurrentOrganization(org)
          return
        }
      }

      // If we have a current workspace, use its organization
      if (currentWorkspace?.organization) {
        const org = organizations.find((o) => o.id === currentWorkspace.organization?.id)
        if (org) {
          setCurrentOrganization(org)
          return
        }
      }

      // Default to first organization
      if (organizations.length > 0) {
        setCurrentOrganization(organizations[0])
      }
    }
  }, [organizations, currentWorkspace, currentOrganization])

  // Load current workspace from localStorage
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')

      if (savedWorkspaceId) {
        const workspace = workspaces.find((w) => w.id === savedWorkspaceId)
        if (workspace) {
          setCurrentWorkspace(workspace)
          // Update current organization based on workspace
          if (workspace.organization) {
            const org = organizations.find((o) => o.id === workspace.organization?.id)
            if (org) {
              setCurrentOrganization(org)
            }
          }
          return
        }
      }

      // Default to first workspace
      setCurrentWorkspace(workspaces[0])
      // Update current organization based on workspace
      if (workspaces[0]?.organization) {
        const org = organizations.find((o) => o.id === workspaces[0].organization?.id)
        if (org) {
          setCurrentOrganization(org)
        }
      }
    }
  }, [workspaces, currentWorkspace, organizations])

  // Save current workspace to localStorage and cookie (for server components)
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id)
      // Cookie set et (server component'ler için)
      document.cookie = `currentWorkspaceId=${currentWorkspace.id}; path=/; max-age=86400; SameSite=Lax`
    }
  }, [currentWorkspace])

  // Save current organization to localStorage and cookie (for server components)
  // Organization değiştiğinde workspace'i de güncelle
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id)
      // Cookie set et (server component'ler için)
      document.cookie = `currentOrganizationId=${currentOrganization.id}; path=/; max-age=86400; SameSite=Lax`

      // Organization'a ait workspaceleri bul
      const orgWorkspaces = workspaces.filter((w) => w.organization_id === currentOrganization.id)

      // Eğer current workspace bu organization'a ait değilse, ilk workspace'i seç
      if (orgWorkspaces.length > 0) {
        const isValidWorkspace =
          currentWorkspace && orgWorkspaces.find((w) => w.id === currentWorkspace.id)

        if (!isValidWorkspace) {
          // İlk workspace'i seç
          const firstWorkspace = orgWorkspaces[0]
          setCurrentWorkspace(firstWorkspace)

          // Cookie'yi de güncelle
          try {
            fetch('/api/workspace/set-current', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workspaceId: firstWorkspace.id }),
            }).catch(() => {
              document.cookie = `currentWorkspaceId=${firstWorkspace.id}; path=/; max-age=86400; SameSite=Lax`
            })
          } catch {
            document.cookie = `currentWorkspaceId=${firstWorkspace.id}; path=/; max-age=86400; SameSite=Lax`
          }
        }
      } else if (currentWorkspace && !orgWorkspaces.find((w) => w.id === currentWorkspace.id)) {
        // Organization'a ait workspace yoksa, current workspace'i temizle
        setCurrentWorkspace(null)
      }
    }
  }, [currentOrganization, workspaces, currentWorkspace])

  async function loadWorkspaces() {
    try {
      setIsLoading(true)

      // Fetch workspaces
      const workspacesRes = await fetch('/api/workspaces', { cache: 'no-store' })
      if (!workspacesRes.ok) {
        console.warn('[WorkspaceContext] Failed to fetch workspaces:', workspacesRes.status)
        setWorkspaces([])
      } else {
        const workspacesData = await workspacesRes.json()
        console.log('[WorkspaceContext] Loaded workspaces:', workspacesData.workspaces?.length || 0)
        console.log('[WorkspaceContext] Workspaces data:', workspacesData)
        setWorkspaces(workspacesData.workspaces || [])
      }

      // Fetch organizations (with cache busting to get fresh data)
      const orgsRes = await fetch('/api/organizations', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (!orgsRes.ok) {
        console.warn('[WorkspaceContext] Failed to fetch organizations:', orgsRes.status)
        setOrganizations([])
      } else {
        const orgsData = await orgsRes.json()
        console.log('[WorkspaceContext] Loaded organizations:', orgsData.organizations?.length || 0)
        setOrganizations(orgsData.organizations || [])
      }
    } catch (error) {
      console.error('[WorkspaceContext] Error loading workspaces/organizations:', error)
      // Sessizce boş array'ler set et
      setWorkspaces([])
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshWorkspaces() {
    await loadWorkspaces()
  }

  async function switchWorkspace(workspaceId: string) {
    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (workspace) {
      // Cookie'yi server-side set et (daha güvenilir)
      try {
        await fetch('/api/workspace/set-current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId: workspace.id }),
        })
      } catch (error) {
        console.warn(
          '[WorkspaceContext] Failed to set workspace cookie via API, using client-side:',
          error
        )
        // Fallback: client-side cookie set
        document.cookie = `currentWorkspaceId=${workspace.id}; path=/; max-age=86400; SameSite=Lax`
      }

      setCurrentWorkspace(workspace)

      // Update current organization based on workspace
      if (workspace.organization) {
        const org = organizations.find((o) => o.id === workspace.organization?.id)
        if (org) {
          // Organization cookie'sini de set et
          try {
            await fetch('/api/workspace/set-current', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ organizationId: org.id }),
            })
          } catch {
            document.cookie = `currentOrganizationId=${org.id}; path=/; max-age=86400; SameSite=Lax`
          }
          setCurrentOrganization(org)
        }
      }
    }
  }

  async function switchOrganization(organizationId: string) {
    const org = organizations.find((o) => o.id === organizationId)
    if (org) {
      // Organization cookie'sini server-side set et
      try {
        await fetch('/api/workspace/set-current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: org.id }),
        })
      } catch (error) {
        console.warn(
          '[WorkspaceContext] Failed to set organization cookie via API, using client-side:',
          error
        )
        document.cookie = `currentOrganizationId=${org.id}; path=/; max-age=86400; SameSite=Lax`
      }

      setCurrentOrganization(org)

      // Switch to first workspace in this organization
      const orgWorkspaces = workspaces.filter((w) => w.organization?.id === organizationId)
      if (orgWorkspaces.length > 0) {
        // Workspace cookie'sini de set et
        try {
          await fetch('/api/workspace/set-current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId: orgWorkspaces[0].id }),
          })
        } catch {
          document.cookie = `currentWorkspaceId=${orgWorkspaces[0].id}; path=/; max-age=86400; SameSite=Lax`
        }
        setCurrentWorkspace(orgWorkspaces[0])
      }
    }
  }

  const value: WorkspaceContextType = {
    currentWorkspace,
    setCurrentWorkspace,
    workspaces,
    setWorkspaces,
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
    setIsLoading,
    switchWorkspace,
    switchOrganization,
    refreshWorkspaces,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// Custom hook to use workspace context
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Hook to get current workspace (throws if no workspace)
export function useCurrentWorkspace() {
  const { currentWorkspace, isLoading } = useWorkspace()

  if (!isLoading && !currentWorkspace) {
    throw new Error('No workspace selected')
  }

  return currentWorkspace
}

// Hook to check permission
export function useWorkspacePermission() {
  const { currentWorkspace } = useWorkspace()

  function hasPermission(permission: string): boolean {
    if (!currentWorkspace?.user_role) return false

    // Import role permissions (will be defined in types)
    const rolePermissions: Record<string, string[]> = {
      owner: [
        'patients.create',
        'patients.read',
        'patients.update',
        'patients.delete',
        'workspace.manage',
        'users.invite',
      ],
      admin: [
        'patients.create',
        'patients.read',
        'patients.update',
        'patients.delete',
        'users.invite',
      ],
      senior_doctor: ['patients.create', 'patients.read', 'patients.update', 'patients.delete'],
      doctor: ['patients.create', 'patients.read', 'patients.update'],
      resident: ['patients.create', 'patients.read', 'patients.update'],
      nurse: ['patients.read'],
      observer: ['patients.read'],
    }

    const permissions = rolePermissions[currentWorkspace.user_role] || []
    return permissions.includes(permission)
  }

  return { hasPermission }
}
