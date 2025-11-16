/**
 * Shifts API Route
 * GET /api/shifts - List shift schedules
 * POST /api/shifts - Create shift schedule
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { CreateShiftSchedulePayload } from '@/types/handoff.types'

// =====================================================
// GET /api/shifts - List shift schedules
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
    const user_id = searchParams.get('user_id')
    const shift_definition_id = searchParams.get('shift_definition_id')
    const status = searchParams.get('status')
    const shift_date_from = searchParams.get('shift_date_from')
    const shift_date_to = searchParams.get('shift_date_to')
    const is_current = searchParams.get('is_current')

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // 3. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Build query
    let query = supabase
      .from('shift_schedules')
      .select(
        `
        *,
        shift_definition:shift_definitions(id, name, short_name, color, start_time, end_time),
        user:profiles!shift_schedules_user_id_fkey(user_id, full_name, avatar_url, specialty),
        workspace:workspaces(id, name, color),
        handoff:handoffs(id, status, summary)
      `,
        { count: 'exact' }
      )
      .eq('workspace_id', workspace_id)

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    if (shift_definition_id) {
      query = query.eq('shift_definition_id', shift_definition_id)
    }

    if (status) {
      const statuses = status.split(',')
      if (statuses.length > 1) {
        query = query.in('status', statuses)
      } else {
        query = query.eq('status', status)
      }
    }

    if (shift_date_from) {
      query = query.gte('shift_date', shift_date_from)
    }

    if (shift_date_to) {
      query = query.lte('shift_date', shift_date_to)
    }

    if (is_current === 'true') {
      const now = new Date().toISOString()
      query = query
        .lte('start_time', now)
        .gte('end_time', now)
        .eq('status', 'active')
    }

    // Sorting
    query = query.order('shift_date', { ascending: false })
    query = query.order('start_time', { ascending: true })

    const { data: shifts, error: fetchError, count } = await query

    if (fetchError) {
      logger.error({ error: fetchError }, 'Failed to fetch shifts')
      return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
    }

    return NextResponse.json({ shifts, total: count })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/shifts')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// POST /api/shifts - Create shift schedule
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
    const body: CreateShiftSchedulePayload = await request.json()

    const { workspace_id, shift_definition_id, user_id: shift_user_id, shift_date, start_time, end_time, notes } = body

    if (!workspace_id || !shift_definition_id || !shift_user_id || !shift_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Check workspace membership (admins can create schedules)
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isAdmin = ['owner', 'admin', 'senior_doctor', 'doctor'].includes(membership.role)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only authorized users can create shifts' }, { status: 403 })
    }

    // 4. Check for overlapping shifts
    const { data: existingShifts } = await supabase
      .from('shift_schedules')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', shift_user_id)
      .eq('shift_date', shift_date)
      .neq('status', 'cancelled')
      .or(`start_time.lte.${end_time},end_time.gte.${start_time}`)

    if (existingShifts && existingShifts.length > 0) {
      return NextResponse.json({ error: 'Overlapping shift exists for this user' }, { status: 400 })
    }

    // 5. Create shift schedule
    const { data: shift, error: createError } = await supabase
      .from('shift_schedules')
      .insert({
        workspace_id,
        shift_definition_id,
        user_id: shift_user_id,
        shift_date,
        start_time,
        end_time,
        status: 'scheduled',
        notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      logger.error({ error: createError }, 'Failed to create shift')
      return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 })
    }

    // 6. Send notification to assigned user
    await supabase.from('notifications').insert({
      user_id: shift_user_id,
      workspace_id,
      type: 'shift_assigned',
      title: 'Yeni Vardiya Ataması',
      message: `${shift_date} tarihinde bir vardiyaya atandınız.`,
      severity: 'low',
      link: `/dashboard/shifts`,
    })

    logger.info({ userId: user.id, shiftId: shift.id }, 'Shift created successfully')

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in POST /api/shifts')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
