/**
 * Sticky Notes API - Single Note Operations
 * GET /api/sticky-notes/[id] - Get a single sticky note with details
 * PATCH /api/sticky-notes/[id] - Update a sticky note
 * DELETE /api/sticky-notes/[id] - Delete (soft delete) a sticky note
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateStickyNoteRequest } from '@/types/sticky-notes.types'

// ============================================
// GET - Get single sticky note
// ============================================
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch note
    const { data: note, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Fetch related data separately
    const authorId = note.author_id
    const noteId = note.id

    // Fetch author
    const { data: author } = authorId
      ? await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', authorId)
          .single()
      : { data: null }

    // Fetch mentions
    const { data: mentions } = await supabase
      .from('note_mentions')
      .select('*, mentioned_user_id')
      .eq('note_id', noteId)

    // Fetch mentioned user profiles
    const mentionedUserIds = [
      ...new Set((mentions || []).map((m) => m.mentioned_user_id).filter(Boolean)),
    ]
    const { data: mentionedUsers } =
      mentionedUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', mentionedUserIds)
        : { data: null }

    // Fetch reactions
    const { data: reactions } = await supabase
      .from('note_reactions')
      .select('*, user_id')
      .eq('note_id', noteId)

    // Fetch reaction user profiles
    const reactionUserIds = [...new Set((reactions || []).map((r) => r.user_id).filter(Boolean))]
    const { data: reactionUsers } =
      reactionUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', reactionUserIds)
        : { data: null }

    // Fetch replies
    const { data: replies } = await supabase
      .from('sticky_notes')
      .select('*, author_id')
      .eq('parent_id', noteId)
      .is('deleted_at', null)

    // Fetch reply authors
    const replyAuthorIds = [...new Set((replies || []).map((r) => r.author_id).filter(Boolean))]
    const { data: replyAuthors } =
      replyAuthorIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', replyAuthorIds)
        : { data: null }

    // Create maps
    const mentionedUserMap = new Map((mentionedUsers || []).map((u) => [u.id, u]))
    const reactionUserMap = new Map((reactionUsers || []).map((u) => [u.id, u]))
    const replyAuthorMap = new Map((replyAuthors || []).map((a) => [a.id, a]))

    // Combine data
    const noteMentions = (mentions || []).map((m) => ({
      ...m,
      mentioned_user: mentionedUserMap.get(m.mentioned_user_id) || null,
    }))

    const noteReactions = (reactions || []).map((r) => ({
      ...r,
      user: reactionUserMap.get(r.user_id) || null,
    }))

    const noteReplies = (replies || []).map((r) => ({
      ...r,
      author: replyAuthorMap.get(r.author_id) || null,
    }))

    // Add replies_count
    const noteWithCount = {
      ...note,
      author: author || null,
      mentions: noteMentions,
      reactions: noteReactions,
      replies: noteReplies,
      replies_count: noteReplies.length,
    }

    return NextResponse.json(noteWithCount)
  } catch (error) {
    console.error('Error in GET /api/sticky-notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// PATCH - Update sticky note
// ============================================
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: UpdateStickyNoteRequest = await request.json()

    // Fetch existing note to check ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('sticky_notes')
      .select('*, workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Check if user can update (author or workspace admin)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingNote.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const canUpdate =
      existingNote.author_id === user.id ||
      membership?.role === 'owner' ||
      membership?.role === 'admin' ||
      membership?.role === 'senior_doctor'

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update this note' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: Partial<{
      content: string
      note_type: string
      color: string
      is_pinned: boolean
      position_x: number
      position_y: number
    }> = {}

    if (body.content !== undefined) {
      if (body.content.length < 1 || body.content.length > 5000) {
        return NextResponse.json(
          { error: 'Content must be between 1 and 5000 characters' },
          { status: 400 }
        )
      }
      updateData.content = body.content
    }

    if (body.note_type !== undefined) updateData.note_type = body.note_type
    if (body.color !== undefined) updateData.color = body.color
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned
    if (body.position_x !== undefined) updateData.position_x = body.position_x
    if (body.position_y !== undefined) updateData.position_y = body.position_y
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

    if (body.is_resolved !== undefined) {
      updateData.is_resolved = body.is_resolved
      if (body.is_resolved) {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = user.id
      } else {
        updateData.resolved_at = null
        updateData.resolved_by = null
      }
    }

    // Update note
    const { data: updatedNote, error: updateError } = await supabase
      .from('sticky_notes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating sticky note:', updateError)
      return NextResponse.json({ error: 'Failed to update sticky note' }, { status: 500 })
    }

    // Fetch author profile
    const { data: author } = updatedNote.author_id
      ? await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', updatedNote.author_id)
          .single()
      : { data: null }

    return NextResponse.json({
      ...updatedNote,
      author: author || null,
    })
  } catch (error) {
    console.error('Error in PATCH /api/sticky-notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// DELETE - Soft delete sticky note
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch existing note to check ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('sticky_notes')
      .select('*, workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Check if user can delete (author or workspace admin)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingNote.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const canDelete =
      existingNote.author_id === user.id ||
      membership?.role === 'owner' ||
      membership?.role === 'admin' ||
      membership?.role === 'senior_doctor'

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this note' },
        { status: 403 }
      )
    }

    // Soft delete the note
    const { error: deleteError } = await supabase
      .from('sticky_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting sticky note:', deleteError)
      return NextResponse.json({ error: 'Failed to delete sticky note' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Note deleted' })
  } catch (error) {
    console.error('Error in DELETE /api/sticky-notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
