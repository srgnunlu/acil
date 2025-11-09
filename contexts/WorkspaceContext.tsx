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

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Helper functions
  switchWorkspace: (workspaceId: string) => void
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
  const [isLoading, setIsLoading] = useState(true)

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces()
  }, [])

  // Load current workspace from localStorage
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')

      if (savedWorkspaceId) {
        const workspace = workspaces.find((w) => w.id === savedWorkspaceId)
        if (workspace) {
          setCurrentWorkspace(workspace)
          return
        }
      }

      // Default to first workspace
      setCurrentWorkspace(workspaces[0])
    }
  }, [workspaces, currentWorkspace])

  // Save current workspace to localStorage
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id)
    }
  }, [currentWorkspace])

  async function loadWorkspaces() {
    try {
      setIsLoading(true)

      // Fetch workspaces
      const workspacesRes = await fetch('/api/workspaces')
      if (!workspacesRes.ok) {
        // Sessizce boş array set et
        setWorkspaces([])
      } else {
        const workspacesData = await workspacesRes.json()
        setWorkspaces(workspacesData.workspaces || [])
      }

      // Fetch organizations
      const orgsRes = await fetch('/api/organizations')
      if (!orgsRes.ok) {
        setOrganizations([])
      } else {
        const orgsData = await orgsRes.json()
        setOrganizations(orgsData.organizations || [])
      }
    } catch {
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

  function switchWorkspace(workspaceId: string) {
    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }

  const value: WorkspaceContextType = {
    currentWorkspace,
    setCurrentWorkspace,
    workspaces,
    setWorkspaces,
    organizations,
    setOrganizations,
    isLoading,
    setIsLoading,
    switchWorkspace,
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
