// ============================================
// DECLINE WORKSPACE INVITATION API
// ============================================
// POST: Decline a workspace invitation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse } from '@/lib/permissions/middleware'
import type { DeclineInvitationInput } from '@/types/invitation.types'

// ============================================
// POST /api/invitations/decline
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: DeclineInvitationInput = await request.json()

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

    // Call the database function to decline invitation
    const { data, error } = await supabase.rpc('decline_workspace_invitation', {
      p_invitation_token: invitation_token,
    })

    if (error) {
      console.error('Error declining invitation:', error)
      return NextResponse.json(
        { success: false, error: 'Invitation reddedilemedi' },
        { status: 500 }
      )
    }

    const result = data as { success: boolean; error?: string }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invitation reddedilemedi' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Decline invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
