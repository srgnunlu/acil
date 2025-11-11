'use client';

/**
 * Notes Tab Component
 * Display sticky notes for a patient with workspace context
 */

import { useEffect, useState } from 'react';
import StickyNotesPanel from '@/components/sticky-notes/StickyNotesPanel';
import { MentionSuggestion } from '@/types/sticky-notes.types';
import { createClient } from '@/lib/supabase/client';

interface NotesTabProps {
  patientId: string;
  workspaceId: string;
  currentUserId: string;
}

export function NotesTab({ patientId, workspaceId, currentUserId }: NotesTabProps) {
  const [workspaceMembers, setWorkspaceMembers] = useState<MentionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch workspace members for mentions
        const { data: members, error } = await supabase
          .from('workspace_members')
          .select(
            `
            user_id,
            role,
            profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `
          )
          .eq('workspace_id', workspaceId)
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching workspace members:', error);
          return;
        }

        // Transform to MentionSuggestion format
        const suggestions: MentionSuggestion[] = (members || [])
          .filter((m: any) => m.profiles)
          .map((m: any) => ({
            id: m.profiles.id,
            label: m.profiles.full_name || m.profiles.email || 'Unknown',
            email: m.profiles.email,
            avatar_url: m.profiles.avatar_url,
          }));

        setWorkspaceMembers(suggestions);

        // Get current user's role
        const currentUserMember = members?.find((m: any) => m.user_id === currentUserId);
        if (currentUserMember) {
          setUserRole(currentUserMember.role);
        }
      } catch (error) {
        console.error('Error in fetchWorkspaceMembers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceMembers();
  }, [workspaceId, currentUserId]);

  // Determine permissions based on role
  const canEdit = ['owner', 'admin', 'senior_doctor', 'doctor', 'resident'].includes(userRole);
  const canDelete = ['owner', 'admin', 'senior_doctor'].includes(userRole);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Notlar yükleniyor...</p>
      </div>
    );
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
  );
}
