/**
 * Handoffs API Route
 * GET /api/handoffs - List handoffs with filters
 * POST /api/handoffs - Create new handoff
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { HandoffWithDetails, CreateHandoffPayload } from '@/types/handoff.types'

// =====================================================
// GET /api/handoffs - List handoffs with filters
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const workspace_id = searchParams.get('workspace_id')
    const from_user_id = searchParams.get('from_user_id')
    const to_user_id = searchParams.get('to_user_id')
    const status = searchParams.get('status')
    const handoff_date_from = searchParams.get('handoff_date_from')
    const handoff_date_to = searchParams.get('handoff_date_to')
    const shift_id = searchParams.get('shift_id')
    const is_ai_generated = searchParams.get('is_ai_generated')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // 3. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      logger.error(
        { error: membershipError, userId: user.id, workspaceId: workspace_id },
        'Workspace access denied'
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Build query
    let query = supabase
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
          shift_definition:shift_definitions(name, short_name, color)
        ),
        template:handoff_templates(id, name),
        workspace:workspaces(id, name, color),
        handoff_patients(count)
      `,
        { count: 'exact' }
      )
      .eq('workspace_id', workspace_id)
      .is('deleted_at', null)

    // Apply filters
    if (from_user_id) {
      query = query.eq('from_user_id', from_user_id)
    }

    if (to_user_id) {
      query = query.eq('to_user_id', to_user_id)
    }

    if (status) {
      const statuses = status.split(',')
      if (statuses.length > 1) {
        query = query.in('status', statuses)
      } else {
        query = query.eq('status', status)
      }
    }

    if (handoff_date_from) {
      query = query.gte('handoff_date', handoff_date_from)
    }

    if (handoff_date_to) {
      query = query.lte('handoff_date', handoff_date_to)
    }

    if (shift_id) {
      query = query.eq('shift_id', shift_id)
    }

    if (is_ai_generated !== null) {
      query = query.eq('is_ai_generated', is_ai_generated === 'true')
    }

    // Sorting
    query = query.order('handoff_date', { ascending: false })
    query = query.order('created_at', { ascending: false })

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: handoffs, error: fetchError, count } = await query

    if (fetchError) {
      logger.error({ error: fetchError, workspaceId: workspace_id }, 'Failed to fetch handoffs')
      return NextResponse.json({ error: 'Failed to fetch handoffs' }, { status: 500 })
    }

    logger.info(
      { userId: user.id, workspaceId: workspace_id, count },
      'Handoffs fetched successfully'
    )

    return NextResponse.json({
      handoffs,
      total: count,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/handoffs')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// POST /api/handoffs - Create new handoff
// =====================================================

export async function POST(request: NextRequest) {
  try {
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
    const body: CreateHandoffPayload = await request.json()

    const {
      workspace_id,
      shift_id,
      from_user_id,
      to_user_id,
      handoff_date,
      handoff_time,
      template_id,
      summary,
      content,
      patient_ids,
      checklist_items,
    } = body

    // 3. Validate required fields
    if (!workspace_id || !from_user_id || !to_user_id || !handoff_date || !handoff_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 4. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      logger.error(
        { error: membershipError, userId: user.id, workspaceId: workspace_id },
        'Workspace access denied'
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Create handoff
    const { data: handoff, error: createError } = await supabase
      .from('handoffs')
      .insert({
        workspace_id,
        shift_id,
        from_user_id,
        to_user_id,
        handoff_date,
        handoff_time,
        template_id,
        summary,
        content,
        status: 'pending_review',
        created_by: user.id,
      })
      .select()
      .single()

    if (createError || !handoff) {
      logger.error({ error: createError, userId: user.id }, 'Failed to create handoff')
      return NextResponse.json({ error: 'Failed to create handoff' }, { status: 500 })
    }

    // 6. Add patients to handoff (if provided)
    if (patient_ids && patient_ids.length > 0) {
      const handoffPatients = patient_ids.map((patient_id, index) => ({
        handoff_id: handoff.id,
        patient_id,
        sort_order: index,
      }))

      const { error: patientsError } = await supabase
        .from('handoff_patients')
        .insert(handoffPatients)

      if (patientsError) {
        logger.error({ error: patientsError, handoffId: handoff.id }, 'Failed to add patients to handoff')
      }
    }

    // 7. Add checklist items (if provided)
    if (checklist_items && checklist_items.length > 0) {
      const checklistData = checklist_items.map((item, index) => ({
        handoff_id: handoff.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        sort_order: item.sort_order || index,
      }))

      const { error: checklistError } = await supabase
        .from('handoff_checklist_items')
        .insert(checklistData)

      if (checklistError) {
        logger.error({ error: checklistError, handoffId: handoff.id }, 'Failed to add checklist items')
      }
    }

    // 8. Send notification to receiver
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: to_user_id,
      workspace_id,
      type: 'handoff_created',
      title: 'Yeni Vardiya Devir Bildirimi',
      message: `${from_user_id === user.id ? 'Siz' : 'Bir doktor'} sizin için bir vardiya devri oluşturdu.`,
      severity: 'medium',
      link: `/dashboard/handoffs/${handoff.id}`,
    })

    if (notificationError) {
      logger.error({ error: notificationError }, 'Failed to send notification')
    }

    logger.info({ userId: user.id, handoffId: handoff.id }, 'Handoff created successfully')

    return NextResponse.json(handoff, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in POST /api/handoffs')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
