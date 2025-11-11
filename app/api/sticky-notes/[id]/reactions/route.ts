/**
 * Note Reactions API
 * GET /api/sticky-notes/[id]/reactions - Get reactions for a note (grouped)
 * POST /api/sticky-notes/[id]/reactions - Add a reaction to a note
 * DELETE /api/sticky-notes/[id]/reactions - Remove a reaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReactionGroup } from '@/types/sticky-notes.types';

// ============================================
// GET - Get reactions for a note (grouped by emoji)
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

    // Fetch reactions with user details
    const { data: reactions, error } = await supabase
      .from('note_reactions')
      .select(
        `
        *,
        user:profiles!note_reactions_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq('note_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching reactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      );
    }

    // Group reactions by emoji
    const grouped: Record<string, ReactionGroup> = {};

    (reactions || []).forEach((reaction) => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          user_reacted: false,
        };
      }

      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push({
        id: reaction.user.id,
        full_name: reaction.user.full_name,
        avatar_url: reaction.user.avatar_url,
      });

      if (reaction.user_id === user.id) {
        grouped[reaction.emoji].user_reacted = true;
      }
    });

    // Convert to array and sort by count
    const groupedArray = Object.values(grouped).sort(
      (a, b) => b.count - a.count
    );

    return NextResponse.json(groupedArray);
  } catch (error) {
    console.error('Error in GET /api/sticky-notes/[id]/reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Add a reaction to a note
// ============================================
export async function POST(
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
    const { emoji }: { emoji: string } = await request.json();

    if (!emoji || typeof emoji !== 'string' || emoji.length > 10) {
      return NextResponse.json(
        { error: 'Valid emoji is required (max 10 characters)' },
        { status: 400 }
      );
    }

    // Check if note exists and user has access
    const { data: note, error: noteError } = await supabase
      .from('sticky_notes')
      .select('*, workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', note.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      );
    }

    // Check if user already reacted with this emoji
    const { data: existingReaction } = await supabase
      .from('note_reactions')
      .select('*')
      .eq('note_id', id)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      return NextResponse.json(
        { error: 'You already reacted with this emoji' },
        { status: 400 }
      );
    }

    // Add reaction
    const { data: reaction, error: insertError } = await supabase
      .from('note_reactions')
      .insert({
        note_id: id,
        user_id: user.id,
        emoji,
      })
      .select(
        `
        *,
        user:profiles!note_reactions_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (insertError) {
      console.error('Error creating reaction:', insertError);
      return NextResponse.json(
        { error: 'Failed to create reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sticky-notes/[id]/reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Remove a reaction
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

    // Parse query parameter for emoji
    const searchParams = request.nextUrl.searchParams;
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return NextResponse.json(
        { error: 'emoji query parameter is required' },
        { status: 400 }
      );
    }

    // Delete reaction
    const { error: deleteError } = await supabase
      .from('note_reactions')
      .delete()
      .eq('note_id', id)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (deleteError) {
      console.error('Error deleting reaction:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sticky-notes/[id]/reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
