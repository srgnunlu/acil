/**
 * Handoffs API Route
 * GET /api/handoffs - List handoffs with filters
 * POST /api/handoffs - Create new handoff
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { CreateHandoffPayload } from '@/types/handoff.types'

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

    // 3. Check workspace access
    // Organization'a üye olan kullanıcılar workspace'leri görebilir
    // Workspace'in organization'ını kontrol et
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace's organization
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', workspace.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Also check workspace_members for backward compatibility
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!orgMembership && !workspaceMembership) {
      logger.error(
        { userId: user.id, workspaceId: workspace_id, organizationId: workspace.organization_id },
        'Workspace access denied'
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Build query
    // Note: from_user_id and to_user_id reference auth.users, not profiles directly
    // We'll fetch profiles separately if needed
    let query = supabase
      .from('handoffs')
      .select(
        `
        *,
        shift:shift_schedules(
          id,
          start_time,
          end_time,
          shift_definition:shift_definitions(name, short_name, color)
        ),
        template:handoff_templates(id, name),
        workspace:workspaces(id, name, color),
        handoff_patients(handoff_id, patient_id)
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

    // Fetch profiles for from_user_id and to_user_id
    if (handoffs && handoffs.length > 0) {
      const userIds = new Set<string>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handoffs.forEach((h: any) => {
        if (h.from_user_id) userIds.add(h.from_user_id)
        if (h.to_user_id) userIds.add(h.to_user_id)
      })

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, specialty')
          .in('user_id', Array.from(userIds))

        const profilesMap = new Map(profiles?.map((p) => [p.user_id, p]) || [])

        // Attach profiles to handoffs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handoffs.forEach((h: any) => {
          h.from_user = h.from_user_id ? profilesMap.get(h.from_user_id) || null : null
          h.to_user = h.to_user_id ? profilesMap.get(h.to_user_id) || null : null
          // Count handoff_patients
          h.patient_count = h.handoff_patients?.length || 0
        })
      }
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

    // 4. Check workspace access
    // Organization'a üye olan kullanıcılar workspace'leri görebilir
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace's organization
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', workspace.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Also check workspace_members for backward compatibility
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!orgMembership && !workspaceMembership) {
      logger.error(
        { userId: user.id, workspaceId: workspace_id, organizationId: workspace.organization_id },
        'Workspace access denied'
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4.5. Validate that to_user_id is a member of the workspace
    const { data: toUserMembership } = await supabase
      .from('workspace_members')
      .select('role, status')
      .eq('workspace_id', workspace_id)
      .eq('user_id', to_user_id)
      .eq('status', 'active')
      .single()

    if (!toUserMembership) {
      logger.error(
        { toUserId: to_user_id, workspaceId: workspace_id },
        'To user is not a member of the workspace'
      )
      return NextResponse.json(
        { error: "Devir alacak kişi bu workspace'in üyesi değil" },
        { status: 400 }
      )
    }

    // 5. Create handoff
    // Ensure handoff_time is a valid ISO timestamp
    // Combine handoff_date and handoff_time to create a proper timestamp
    let finalHandoffTime: string
    try {
      // Parse handoff_time to extract time part
      const timeDate = new Date(handoff_time)
      if (!isNaN(timeDate.getTime())) {
        // Extract time part (HH:mm:ss.sssZ)
        const timePart = timeDate.toISOString().split('T')[1]
        // Combine with handoff_date
        finalHandoffTime = `${handoff_date}T${timePart}`
      } else {
        // If handoff_time is not a valid date, try to extract time part
        const timePart = handoff_time.includes('T')
          ? handoff_time.split('T')[1]
          : handoff_time.includes(':')
            ? handoff_time
            : '00:00:00.000Z'
        finalHandoffTime = `${handoff_date}T${timePart}`
      }

      // Validate the final timestamp
      const finalDate = new Date(finalHandoffTime)
      if (isNaN(finalDate.getTime())) {
        // Fallback: use handoff_date with default time
        finalHandoffTime = `${handoff_date}T00:00:00.000Z`
      } else {
        // Ensure it's in ISO format
        finalHandoffTime = finalDate.toISOString()
      }
    } catch {
      // Fallback: use handoff_date with default time
      finalHandoffTime = `${handoff_date}T00:00:00.000Z`
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handoffData: any = {
      workspace_id,
      from_user_id,
      to_user_id,
      handoff_date,
      handoff_time: finalHandoffTime,
      status: 'pending_review',
      created_by: user.id,
    }

    // Optional fields
    if (shift_id) handoffData.shift_id = shift_id
    if (template_id) handoffData.template_id = template_id
    if (summary) handoffData.summary = summary

    // Ensure content is a valid JSON object
    if (content) {
      if (typeof content === 'string') {
        try {
          handoffData.content = JSON.parse(content)
        } catch {
          handoffData.content = {}
        }
      } else if (typeof content === 'object') {
        handoffData.content = content
      } else {
        handoffData.content = {}
      }
    } else {
      handoffData.content = {}
    }

    logger.info(
      {
        handoffData: {
          ...handoffData,
          handoff_time: finalHandoffTime,
          content:
            typeof handoffData.content === 'object'
              ? JSON.stringify(handoffData.content).substring(0, 200)
              : handoffData.content,
        },
        userId: user.id,
        originalHandoffTime: handoff_time,
        finalHandoffTime,
      },
      'Creating handoff'
    )

    const { data: handoff, error: createError } = await supabase
      .from('handoffs')
      .insert(handoffData)
      .select()
      .single()

    if (createError || !handoff) {
      logger.error(
        {
          error: createError,
          errorCode: createError?.code,
          errorMessage: createError?.message,
          errorDetails: createError?.details,
          errorHint: createError?.hint,
          handoffData: {
            ...handoffData,
            handoff_time: finalHandoffTime,
            content:
              typeof handoffData.content === 'object'
                ? JSON.stringify(handoffData.content).substring(0, 200)
                : handoffData.content,
          },
          userId: user.id,
        },
        'Failed to create handoff'
      )
      return NextResponse.json(
        {
          error: 'Failed to create handoff',
          details: createError?.message || 'Unknown error',
          code: createError?.code,
          hint: createError?.hint,
        },
        { status: 500 }
      )
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
        logger.error(
          { error: patientsError, handoffId: handoff.id },
          'Failed to add patients to handoff'
        )
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
        logger.error(
          { error: checklistError, handoffId: handoff.id },
          'Failed to add checklist items'
        )
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
