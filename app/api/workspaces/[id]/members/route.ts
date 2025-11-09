// ============================================
// WORKSPACE MEMBERS API
// ============================================
// GET: List workspace members

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'

// ============================================
// GET /api/workspaces/[id]/members
// ============================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check if user is a member of this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return forbiddenResponse("Bu workspace'in üyesi değilsiniz")
    }

    // Get all workspace members (without profile relationship first)
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspace members:', error)
      return NextResponse.json(
        { success: false, error: 'Workspace members yüklenemedi' },
        { status: 500 }
      )
    }

    // Fetch profiles separately if we have members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let membersWithProfiles: any[] = members || []
    if (membersWithProfiles.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userIds: any[] = membersWithProfiles.map((m: any) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, title, specialty')
        .in('user_id', userIds)

      // Merge profiles with members
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      membersWithProfiles = membersWithProfiles.map((member: any) => ({
        ...member,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profile: profiles?.find((p: any) => p.user_id === member.user_id) || null,
      }))
    }

    return NextResponse.json({
      success: true,
      members: membersWithProfiles,
      total: membersWithProfiles.length,
    })
  } catch (error) {
    console.error('Workspace members API error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
