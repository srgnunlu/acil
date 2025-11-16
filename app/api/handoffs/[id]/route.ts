/**
 * Handoff Detail API Route
 * GET /api/handoffs/[id] - Get handoff details
 * PATCH /api/handoffs/[id] - Update handoff
 * DELETE /api/handoffs/[id] - Delete handoff
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { UpdateHandoffPayload } from '@/types/handoff.types'

// =====================================================
// GET /api/handoffs/[id] - Get handoff details
// =====================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch handoff with details
    const { data: handoff, error: fetchError } = await supabase
      .from('handoffs')
      .select(
        `
        *,
        from_user:profiles!handoffs_from_user_id_fkey(user_id, full_name, avatar_url, specialty),
        to_user:profiles!handoffs_to_user_id_fkey(user_id, full_name, avatar_url, specialty),
        shift:shift_schedules(
          id,
          start_time,
          end_time,
          status,
          shift_definition:shift_definitions(name, short_name, color)
        ),
        template:handoff_templates(id, name, sections),
        workspace:workspaces(id, name, color),
        acknowledged_by_user:profiles!handoffs_acknowledged_by_fkey(user_id, full_name),
        patients:handoff_patients(
          *,
          patient:patients(id, name, age, gender, category:patient_categories(id, name, color))
        ),
        checklist_items:handoff_checklist_items(
          *,
          completed_by_user:profiles(user_id, full_name)
        )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !handoff) {
      logger.error({ error: fetchError, handoffId: id }, 'Handoff not found')
      return NextResponse.json({ error: 'Handoff not found' }, { status: 404 })
    }

    // 3. Check access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', handoff.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isFromUser = handoff.from_user_id === user.id
    const isToUser = handoff.to_user_id === user.id
    const hasWorkspaceAccess = !!membership

    if (!isFromUser && !isToUser && !hasWorkspaceAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    logger.info({ userId: user.id, handoffId: id }, 'Handoff fetched successfully')

    return NextResponse.json(handoff)
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/handoffs/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// PATCH /api/handoffs/[id] - Update handoff
// =====================================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body: UpdateHandoffPayload = await request.json()

    // 3. Fetch existing handoff
    const { data: existingHandoff, error: fetchError } = await supabase
      .from('handoffs')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingHandoff) {
      return NextResponse.json({ error: 'Handoff not found' }, { status: 404 })
    }

    // 4. Check permission to update
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingHandoff.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isFromUser = existingHandoff.from_user_id === user.id
    const isToUser = existingHandoff.to_user_id === user.id
    const isAdmin = membership && ['owner', 'admin'].includes(membership.role)

    if (!isFromUser && !isToUser && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Update handoff
    const updateData: any = {}

    if (body.template_id !== undefined) updateData.template_id = body.template_id
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.content !== undefined) updateData.content = body.content
    if (body.status !== undefined) updateData.status = body.status
    if (body.receiver_notes !== undefined) updateData.receiver_notes = body.receiver_notes

    // Handle acknowledgment
    if (body.status === 'completed' && !existingHandoff.acknowledged_at) {
      updateData.acknowledged_at = new Date().toISOString()
      updateData.acknowledged_by = user.id
    }

    const { data: updatedHandoff, error: updateError } = await supabase
      .from('handoffs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error({ error: updateError, handoffId: id }, 'Failed to update handoff')
      return NextResponse.json({ error: 'Failed to update handoff' }, { status: 500 })
    }

    // 6. Send notification if status changed to completed
    if (body.status === 'completed' && existingHandoff.status !== 'completed') {
      await supabase.from('notifications').insert({
        user_id: existingHandoff.from_user_id,
        workspace_id: existingHandoff.workspace_id,
        type: 'handoff_acknowledged',
        title: 'Vardiya Devri Onaylandı',
        message: `${updatedHandoff.to_user_id === user.id ? 'Alıcı' : 'Bir kullanıcı'} vardiya devrini onayladı.`,
        severity: 'low',
        link: `/dashboard/handoffs/${id}`,
      })
    }

    logger.info({ userId: user.id, handoffId: id }, 'Handoff updated successfully')

    return NextResponse.json(updatedHandoff)
  } catch (error) {
    logger.error({ error }, 'Unexpected error in PATCH /api/handoffs/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// DELETE /api/handoffs/[id] - Delete handoff (soft delete)
// =====================================================

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch existing handoff
    const { data: existingHandoff, error: fetchError } = await supabase
      .from('handoffs')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingHandoff) {
      return NextResponse.json({ error: 'Handoff not found' }, { status: 404 })
    }

    // 3. Check permission to delete
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingHandoff.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isFromUser = existingHandoff.from_user_id === user.id
    const isAdmin = membership && ['owner', 'admin'].includes(membership.role)

    if (!isFromUser && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Soft delete handoff
    const { error: deleteError } = await supabase
      .from('handoffs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      logger.error({ error: deleteError, handoffId: id }, 'Failed to delete handoff')
      return NextResponse.json({ error: 'Failed to delete handoff' }, { status: 500 })
    }

    logger.info({ userId: user.id, handoffId: id }, 'Handoff deleted successfully')

    return NextResponse.json({ message: 'Handoff deleted successfully' })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in DELETE /api/handoffs/[id]')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
