import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get('note_id')
    const workspaceId = searchParams.get('workspace_id')
    const patientId = searchParams.get('patient_id')
    const authorId = searchParams.get('author_id')
    const noteType = searchParams.get('note_type')
    const isPinned = searchParams.get('is_pinned')
    const isResolved = searchParams.get('is_resolved')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single note
    if (noteId) {
      const { data: note, error } = await supabase
        .from('sticky_notes')
        .select(
          `
          *,
          author:profiles!sticky_notes_author_id_fkey(user_id, full_name, avatar_url),
          patient:patients(id, name),
          workspace:workspaces(id, name, slug),
          mentions:note_mentions(mentioned_user_id, profiles:profiles!note_mentions_mentioned_user_id_fkey(user_id, full_name))
        `
        )
        .eq('id', noteId)
        .is('deleted_at', null)
        .single()

      if (error) {
        logger.error({ error, noteId }, 'Failed to fetch sticky note')
        return NextResponse.json({ error: 'Failed to fetch sticky note' }, { status: 500 })
      }

      return NextResponse.json(note)
    }

    // List all sticky notes
    let query = supabase
      .from('sticky_notes')
      .select(
        `
        *,
        author:profiles!sticky_notes_author_id_fkey(user_id, full_name, avatar_url),
        patient:patients(id, name),
        workspace:workspaces(id, name, slug)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    if (noteType) {
      query = query.eq('note_type', noteType)
    }

    if (isPinned !== null && isPinned !== undefined) {
      query = query.eq('is_pinned', isPinned === 'true')
    }

    if (isResolved !== null && isResolved !== undefined) {
      query = query.eq('is_resolved', isResolved === 'true')
    }

    const { data: notes, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch sticky notes')
      return NextResponse.json({ error: 'Failed to fetch sticky notes' }, { status: 500 })
    }

    // Get statistics
    const { count: totalNotes } = await supabase
      .from('sticky_notes')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    const { count: pinnedNotes } = await supabase
      .from('sticky_notes')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_pinned', true)

    const { count: resolvedNotes } = await supabase
      .from('sticky_notes')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_resolved', true)

    const { count: activeNotes } = await supabase
      .from('sticky_notes')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_resolved', false)

    // Get notes by type
    const { data: typeData } = await supabase
      .from('sticky_notes')
      .select('note_type')
      .is('deleted_at', null)

    const byType: Record<string, number> = {
      urgent: 0,
      important: 0,
      info: 0,
      routine: 0,
      question: 0,
    }

    typeData?.forEach((note) => {
      if (note.note_type in byType) {
        byType[note.note_type]++
      }
    })

    return NextResponse.json({
      sticky_notes: notes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        total: totalNotes || 0,
        pinned: pinnedNotes || 0,
        resolved: resolvedNotes || 0,
        active: activeNotes || 0,
        by_type: byType,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin sticky-notes API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get('note_id')

    if (!noteId) {
      return NextResponse.json({ error: 'note_id required' }, { status: 400 })
    }

    // Soft delete sticky note
    const { error } = await supabase
      .from('sticky_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId)

    if (error) {
      logger.error({ error, noteId }, 'Failed to delete sticky note')
      return NextResponse.json({ error: 'Failed to delete sticky note' }, { status: 500 })
    }

    logger.info({ noteId, deletedBy: authResult.user!.id }, 'Sticky note deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin sticky-notes DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

