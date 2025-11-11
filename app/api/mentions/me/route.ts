/**
 * User Mentions API - Get current user's mentions
 * GET /api/mentions/me - Get all mentions for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const is_read = searchParams.get('is_read');
    const workspace_id = searchParams.get('workspace_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for mentions
    let query = supabase
      .from('note_mentions')
      .select(
        `
        *,
        note:sticky_notes!note_mentions_note_id_fkey(
          *,
          author:profiles!sticky_notes_author_id_fkey(
            id,
            full_name,
            avatar_url,
            email
          ),
          patient:patients(
            id,
            full_name
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('mentioned_user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (is_read !== null && is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    // Filter by workspace if provided
    if (workspace_id) {
      // We need to filter by workspace_id through the note relation
      query = query.eq('note.workspace_id', workspace_id);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: mentions, error, count } = await query;

    if (error) {
      console.error('Error fetching user mentions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mentions' },
        { status: 500 }
      );
    }

    // Filter out mentions where note is deleted
    const validMentions =
      mentions?.filter((m) => m.note && !m.note.deleted_at) || [];

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('note_mentions')
      .select('*', { count: 'exact', head: true })
      .eq('mentioned_user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      mentions: validMentions,
      total: count || 0,
      unread_count: unreadCount || 0,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Error in GET /api/mentions/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
