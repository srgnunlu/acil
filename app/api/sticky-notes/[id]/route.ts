/**
 * Sticky Notes API - Single Note Operations
 * GET /api/sticky-notes/[id] - Get a single sticky note with details
 * PATCH /api/sticky-notes/[id] - Update a sticky note
 * DELETE /api/sticky-notes/[id] - Delete (soft delete) a sticky note
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateStickyNoteRequest } from '@/types/sticky-notes.types';

// ============================================
// GET - Get single sticky note
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch note with all relations
    const { data: note, error } = await supabase
      .from('sticky_notes')
      .select(
        `
        *,
        author:profiles!sticky_notes_author_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        ),
        mentions:note_mentions(
          *,
          mentioned_user:profiles!note_mentions_mentioned_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        ),
        reactions:note_reactions(
          *,
          user:profiles!note_reactions_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        ),
        replies:sticky_notes!sticky_notes_parent_id_fkey(
          *,
          author:profiles!sticky_notes_author_id_fkey(
            id,
            full_name,
            avatar_url,
            email
          )
        )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Add replies_count
    const noteWithCount = {
      ...note,
      replies_count: note.replies?.length || 0,
    };

    return NextResponse.json(noteWithCount);
  } catch (error) {
    console.error('Error in GET /api/sticky-notes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update sticky note
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: UpdateStickyNoteRequest = await request.json();

    // Fetch existing note to check ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('sticky_notes')
      .select('*, workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user can update (author or workspace admin)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingNote.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const canUpdate =
      existingNote.author_id === user.id ||
      membership?.role === 'owner' ||
      membership?.role === 'admin' ||
      membership?.role === 'senior_doctor';

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update this note' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.content !== undefined) {
      if (body.content.length < 1 || body.content.length > 5000) {
        return NextResponse.json(
          { error: 'Content must be between 1 and 5000 characters' },
          { status: 400 }
        );
      }
      updateData.content = body.content;
    }

    if (body.note_type !== undefined) updateData.note_type = body.note_type;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned;
    if (body.position_x !== undefined) updateData.position_x = body.position_x;
    if (body.position_y !== undefined) updateData.position_y = body.position_y;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    if (body.is_resolved !== undefined) {
      updateData.is_resolved = body.is_resolved;
      if (body.is_resolved) {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      } else {
        updateData.resolved_at = null;
        updateData.resolved_by = null;
      }
    }

    // Update note
    const { data: updatedNote, error: updateError } = await supabase
      .from('sticky_notes')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        author:profiles!sticky_notes_author_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating sticky note:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sticky note' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error in PATCH /api/sticky-notes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch existing note to check ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('sticky_notes')
      .select('*, workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user can delete (author or workspace admin)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingNote.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const canDelete =
      existingNote.author_id === user.id ||
      membership?.role === 'owner' ||
      membership?.role === 'admin' ||
      membership?.role === 'senior_doctor';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this note' },
        { status: 403 }
      );
    }

    // Soft delete the note
    const { error: deleteError } = await supabase
      .from('sticky_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting sticky note:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete sticky note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/sticky-notes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
