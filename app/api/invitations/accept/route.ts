// ============================================
// ACCEPT WORKSPACE INVITATION API
// ============================================
// POST: Accept a workspace invitation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse } from '@/lib/permissions/middleware'
import type { AcceptInvitationInput } from '@/types/invitation.types'

// ============================================
// POST /api/invitations/accept
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: AcceptInvitationInput = await request.json()

    const { invitation_token } = body

    if (!invitation_token) {
      return NextResponse.json(
        { success: false, error: 'invitation_token gerekli' },
        { status: 400 }
      )
    }

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Call the database function to accept invitation
    const { data, error } = await supabase.rpc('accept_workspace_invitation', {
      p_invitation_token: invitation_token,
    })

    if (error) {
      console.error('Error accepting invitation:', error)
      return NextResponse.json(
        { success: false, error: 'Invitation kabul edilemedi' },
        { status: 500 }
      )
    }

    const result = data as { success: boolean; error?: string; member_id?: string; workspace_id?: string; message?: string }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invitation kabul edilemedi' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      member_id: result.member_id,
      workspace_id: result.workspace_id,
      message: result.message,
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
