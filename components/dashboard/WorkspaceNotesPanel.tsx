'use client'

/**
 * Workspace Notes Panel
 * Displays workspace-level sticky notes (not tied to any patient)
 */

import { useEffect, useState } from 'react'
import StickyNotesPanel from '@/components/sticky-notes/StickyNotesPanel'
import { MentionSuggestion } from '@/types/sticky-notes.types'
import { createClient } from '@/lib/supabase/client'

interface WorkspaceNotesPanelProps {
  workspaceId: string
  currentUserId: string
}

export function WorkspaceNotesPanel({ workspaceId, currentUserId }: WorkspaceNotesPanelProps) {
  const [workspaceMembers, setWorkspaceMembers] = useState<MentionSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('observer')

  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      setIsLoading(true)
      const supabase = createClient()

      try {
        // Get current user's role in workspace
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', currentUserId)
          .eq('status', 'active')
          .single()

        if (membership) {
          setUserRole(membership.role)
        }

        // Get all active workspace members
        const { data: members, error: membersError } = await supabase
          .from('workspace_members')
          .select('user_id')
          .eq('workspace_id', workspaceId)
          .eq('status', 'active')

        if (membersError) {
          console.error('Error fetching workspace members:', membersError)
          setIsLoading(false)
          return
        }

        const userIds = (members || []).map((m) => m.user_id).filter(Boolean)

        if (userIds.length === 0) {
          setWorkspaceMembers([])
          setIsLoading(false)
          return
        }

        // Fetch profiles - use user_id to match
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, user_id')
          .in('user_id', userIds)

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          setIsLoading(false)
          return
        }

        // Transform to MentionSuggestion format
        const suggestions: MentionSuggestion[] = (profiles || []).map((profile) => ({
          id: profile.id,
          label: profile.full_name || `Kullanıcı ${profile.id.slice(0, 8)}`,
          email: undefined, // Email will be fetched from API if needed
          avatar_url: profile.avatar_url,
        }))

        setWorkspaceMembers(suggestions)
      } catch (error) {
        console.error('Error in fetchWorkspaceMembers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (workspaceId && currentUserId) {
      fetchWorkspaceMembers()
    }
  }, [workspaceId, currentUserId])

  // Determine permissions based on role
  const canEdit = ['owner', 'admin', 'senior_doctor', 'doctor', 'resident'].includes(userRole)
  const canDelete = ['owner', 'admin', 'senior_doctor'].includes(userRole)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Notlar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="workspace-notes-panel">
      <StickyNotesPanel
        workspaceId={workspaceId}
        patientId={null}
        currentUserId={currentUserId}
        workspaceMembers={workspaceMembers}
        canEdit={canEdit}
        canDelete={canDelete}
        showAddButton={true}
      />
    </div>
  )
}
