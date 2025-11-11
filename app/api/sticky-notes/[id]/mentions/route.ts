/**
 * Note Mentions API
 * GET /api/sticky-notes/[id]/mentions - Get mentions for a note
 * POST /api/sticky-notes/[id]/mentions - Add mentions to a note
 * PATCH /api/sticky-notes/[id]/mentions - Mark mentions as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================
// GET - Get mentions for a note
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

    // Fetch mentions with user details
    const { data: mentions, error } = await supabase
      .from('note_mentions')
      .select(
        `
        *,
        mentioned_user:profiles!note_mentions_mentioned_user_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        )
      `
      )
      .eq('note_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mentions' },
        { status: 500 }
      );
    }

    return NextResponse.json(mentions || []);
  } catch (error) {
    console.error('Error in GET /api/sticky-notes/[id]/mentions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Add mentions to a note
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
    const { user_ids }: { user_ids: string[] } = await request.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'user_ids array is required' },
        { status: 400 }
      );
    }

    // Validate max mentions (10)
    if (user_ids.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 mentions allowed' },
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

    // Prepare mentions data (filter out self-mentions)
    const mentionsToInsert = user_ids
      .filter((userId) => userId !== user.id)
      .map((userId) => ({
        note_id: id,
        mentioned_user_id: userId,
      }));

    if (mentionsToInsert.length === 0) {
      return NextResponse.json({ mentions: [] });
    }

    // Insert mentions (on conflict do nothing)
    const { data: mentions, error: insertError } = await supabase
      .from('note_mentions')
      .upsert(mentionsToInsert, {
        onConflict: 'note_id,mentioned_user_id',
        ignoreDuplicates: true,
      })
      .select(
        `
        *,
        mentioned_user:profiles!note_mentions_mentioned_user_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        )
      `
      );

    if (insertError) {
      console.error('Error creating mentions:', insertError);
      return NextResponse.json(
        { error: 'Failed to create mentions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ mentions: mentions || [] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sticky-notes/[id]/mentions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mark mentions as read
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

    // Mark all user's mentions in this note as read
    const { error: updateError } = await supabase
      .from('note_mentions')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('note_id', id)
      .eq('mentioned_user_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking mentions as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark mentions as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/sticky-notes/[id]/mentions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
