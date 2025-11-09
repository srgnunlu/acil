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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return forbiddenResponse('Bu workspace\'in üyesi değilsiniz')
    }

    // Get all workspace members
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(
        `
        *,
        profile:profiles!workspace_members_user_id_fkey(
          id,
          full_name,
          avatar_url,
          title,
          specialty
        )
      `
      )
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspace members:', error)
      return NextResponse.json(
        { success: false, error: 'Workspace members yüklenemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members: members || [],
      total: members?.length || 0,
    })
  } catch (error) {
    console.error('Workspace members API error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
