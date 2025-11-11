/**
 * Sticky Notes API - List and Create
 * GET /api/sticky-notes - List sticky notes with filters
 * POST /api/sticky-notes - Create a new sticky note
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateStickyNoteRequest,
  StickyNotesQuery,
  StickyNoteWithDetails,
} from '@/types/sticky-notes.types';

// ============================================
// GET - List sticky notes
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspace_id = searchParams.get('workspace_id');
    const patient_id = searchParams.get('patient_id');
    const note_type = searchParams.get('note_type');
    const is_pinned = searchParams.get('is_pinned');
    const is_resolved = searchParams.get('is_resolved');
    const author_id = searchParams.get('author_id');
    const parent_id = searchParams.get('parent_id');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Workspace ID is required
    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
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
      `,
        { count: 'exact' }
      )
      .eq('workspace_id', workspace_id)
      .is('deleted_at', null);

    // Apply filters
    if (patient_id !== null) {
      if (patient_id === 'null' || patient_id === '') {
        query = query.is('patient_id', null);
      } else {
        query = query.eq('patient_id', patient_id);
      }
    }

    if (note_type) {
      query = query.eq('note_type', note_type);
    }

    if (is_pinned !== null) {
      query = query.eq('is_pinned', is_pinned === 'true');
    }

    if (is_resolved !== null) {
      query = query.eq('is_resolved', is_resolved === 'true');
    }

    if (author_id) {
      query = query.eq('author_id', author_id);
    }

    if (parent_id !== null) {
      if (parent_id === 'null' || parent_id === '') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parent_id);
      }
    }

    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: notes, error, count } = await query;

    if (error) {
      console.error('Error fetching sticky notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sticky notes' },
        { status: 500 }
      );
    }

    // Add replies_count to each note
    const notesWithCount = (notes || []).map((note) => ({
      ...note,
      replies_count: note.replies?.length || 0,
    })) as StickyNoteWithDetails[];

    return NextResponse.json({
      notes: notesWithCount,
      total: count || 0,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Error in GET /api/sticky-notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create sticky note
// ============================================
export async function POST(request: NextRequest) {
  try {
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
    const body: CreateStickyNoteRequest = await request.json();

    const {
      workspace_id,
      patient_id,
      content,
      note_type,
      color,
      parent_id,
      mentions,
    } = body;

    // Validate required fields
    if (!workspace_id || !content || !note_type) {
      return NextResponse.json(
        { error: 'workspace_id, content, and note_type are required' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 1 || content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 5000 characters' },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Create sticky note
    const { data: note, error: createError } = await supabase
      .from('sticky_notes')
      .insert({
        workspace_id,
        patient_id: patient_id || null,
        content,
        note_type,
        color: color || '#fbbf24',
        parent_id: parent_id || null,
        author_id: user.id,
      })
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

    if (createError) {
      console.error('Error creating sticky note:', createError);
      return NextResponse.json(
        { error: 'Failed to create sticky note' },
        { status: 500 }
      );
    }

    // Create mentions if provided
    if (mentions && mentions.length > 0) {
      const mentionsToInsert = mentions
        .filter((userId) => userId !== user.id) // Don't mention yourself
        .map((userId) => ({
          note_id: note.id,
          mentioned_user_id: userId,
        }));

      if (mentionsToInsert.length > 0) {
        const { error: mentionsError } = await supabase
          .from('note_mentions')
          .insert(mentionsToInsert);

        if (mentionsError) {
          console.error('Error creating mentions:', mentionsError);
          // Don't fail the request if mentions fail
        }
      }
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sticky-notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
