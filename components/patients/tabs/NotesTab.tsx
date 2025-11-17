'use client'

/**
 * Notes Tab Component
 * Display sticky notes for a patient with workspace context
 */

import { useEffect, useState } from 'react'
import StickyNotesPanel from '@/components/sticky-notes/StickyNotesPanel'
import { MentionSuggestion } from '@/types/sticky-notes.types'
import { createClient } from '@/lib/supabase/client'

interface NotesTabProps {
  patientId: string
  workspaceId: string
  currentUserId: string
}

export function NotesTab({ patientId, workspaceId, currentUserId }: NotesTabProps) {
  const [workspaceMembers, setWorkspaceMembers] = useState<MentionSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      setIsLoading(true)
      const supabase = createClient()

      try {
        // Fetch workspace members for mentions
        const { data: members, error: membersError } = await supabase
          .from('workspace_members')
          .select('user_id, role')
          .eq('workspace_id', workspaceId)
          .eq('status', 'active')

        if (membersError) {
          console.error('Error fetching workspace members:', membersError)
          return
        }

        if (!members || members.length === 0) {
          setWorkspaceMembers([])
          setIsLoading(false)
          return
        }

        // Get current user's role
        const currentUserMember = members.find((m) => m.user_id === currentUserId)
        if (currentUserMember) {
          setUserRole(currentUserMember.role)
        }

        // Fetch profiles for all user IDs - use user_id to match
        const userIds = members.map((m) => m.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, user_id')
          .in('user_id', userIds)

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          return
        }

        // Create a map of user_id to profile (use user_id, not id!)
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]))

        // Transform to MentionSuggestion format
        const suggestions = members
          .map((m) => {
            const profile = profileMap.get(m.user_id)
            if (!profile) return null
            return {
              id: profile.id,
              label: profile.full_name || `Kullanıcı ${profile.id.slice(0, 8)}`,
              email: undefined, // Email will be fetched from API if needed
              avatar_url: profile.avatar_url,
            }
          })
          .filter((s) => s !== null) as MentionSuggestion[]

        setWorkspaceMembers(suggestions)
      } catch (error) {
        console.error('Error in fetchWorkspaceMembers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaceMembers()
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
    <div className="notes-tab-container">
      <StickyNotesPanel
        workspaceId={workspaceId}
        patientId={patientId}
        currentUserId={currentUserId}
        workspaceMembers={workspaceMembers}
        canEdit={canEdit}
        canDelete={canDelete}
        showAddButton={true}
      />
    </div>
  )
}
