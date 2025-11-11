/**
 * User Mentions API - Get current user's mentions
 * GET /api/mentions/me - Get all mentions for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const is_read = searchParams.get('is_read')
    const workspace_id = searchParams.get('workspace_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for mentions (without foreign key joins)
    let query = supabase
      .from('note_mentions')
      .select('*', { count: 'exact' })
      .eq('mentioned_user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (is_read !== null && is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: mentions, error, count } = await query

    if (error) {
      console.error('Error fetching user mentions:', error)
      return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 })
    }

    if (!mentions || mentions.length === 0) {
      return NextResponse.json({
        mentions: [],
        total: count || 0,
        unread_count: 0,
        has_more: false,
      })
    }

    // Get note IDs
    const noteIds = [...new Set(mentions.map((m) => m.note_id).filter(Boolean))]

    // Fetch notes separately
    let notesQuery = supabase
      .from('sticky_notes')
      .select('*')
      .in('id', noteIds)
      .is('deleted_at', null)

    // Filter by workspace if provided
    if (workspace_id) {
      notesQuery = notesQuery.eq('workspace_id', workspace_id)
    }

    const { data: notes, error: notesError } = await notesQuery

    if (notesError) {
      console.error('Error fetching notes:', notesError)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    // Get author IDs
    const authorIds = [...new Set((notes || []).map((n) => n.author_id).filter(Boolean))]

    // Fetch authors separately
    const { data: authors } =
      authorIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', authorIds)
        : { data: null }

    // Create maps for efficient lookup
    const noteMap = new Map((notes || []).map((n) => [n.id, n]))
    const authorMap = new Map((authors || []).map((a) => [a.id, a]))

    // Combine data
    const validMentions = mentions
      .map((mention) => {
        const note = noteMap.get(mention.note_id)
        if (!note) return null

        // Filter by workspace if provided
        if (workspace_id && note.workspace_id !== workspace_id) {
          return null
        }

        const author = authorMap.get(note.author_id)

        return {
          ...mention,
          note: {
            ...note,
            author: author || null,
          },
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)

    // Get unread count
    // If workspace filter is applied, we need to count mentions for notes in that workspace
    let unreadCount = 0

    if (workspace_id) {
      // Get all unread mention note IDs first
      const { data: unreadMentions } = await supabase
        .from('note_mentions')
        .select('note_id')
        .eq('mentioned_user_id', user.id)
        .eq('is_read', false)

      if (unreadMentions && unreadMentions.length > 0) {
        const unreadNoteIds = unreadMentions.map((m) => m.note_id)
        // Check which notes belong to the workspace
        const { data: workspaceNotes } = await supabase
          .from('sticky_notes')
          .select('id')
          .in('id', unreadNoteIds)
          .eq('workspace_id', workspace_id)
          .is('deleted_at', null)

        unreadCount = workspaceNotes?.length || 0
      }
    } else {
      // No workspace filter, count all unread mentions
      const { count } = await supabase
        .from('note_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('mentioned_user_id', user.id)
        .eq('is_read', false)

      unreadCount = count || 0
    }

    return NextResponse.json({
      mentions: validMentions,
      total: validMentions.length,
      unread_count: unreadCount,
      has_more: validMentions.length >= limit,
    })
  } catch (error) {
    console.error('Error in GET /api/mentions/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
