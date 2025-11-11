/**
 * Sticky Notes API - List and Create
 * GET /api/sticky-notes - List sticky notes with filters
 * POST /api/sticky-notes - Create a new sticky note
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateStickyNoteRequest, StickyNoteWithDetails } from '@/types/sticky-notes.types'

// ============================================
// GET - List sticky notes
// ============================================
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
    const workspace_id = searchParams.get('workspace_id')
    const patient_id = searchParams.get('patient_id')
    const note_type = searchParams.get('note_type')
    const is_pinned = searchParams.get('is_pinned')
    const is_resolved = searchParams.get('is_resolved')
    const author_id = searchParams.get('author_id')
    const parent_id = searchParams.get('parent_id')
    const search = searchParams.get('search')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200) // Max 200, default 100
    const offset = parseInt(searchParams.get('offset') || '0')

    // Workspace ID is required
    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Build query - simplified without foreign key joins
    let query = supabase
      .from('sticky_notes')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id)
      .is('deleted_at', null)

    // Apply filters
    if (patient_id !== null) {
      if (patient_id === 'null' || patient_id === '') {
        query = query.is('patient_id', null)
      } else {
        query = query.eq('patient_id', patient_id)
      }
    }

    if (note_type) {
      query = query.eq('note_type', note_type)
    }

    if (is_pinned !== null) {
      query = query.eq('is_pinned', is_pinned === 'true')
    }

    if (is_resolved !== null) {
      query = query.eq('is_resolved', is_resolved === 'true')
    }

    if (author_id) {
      query = query.eq('author_id', author_id)
    }

    if (parent_id !== null) {
      if (parent_id === 'null' || parent_id === '') {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parent_id)
      }
    }

    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: notes, error, count } = await query

    if (error) {
      console.error('Error fetching sticky notes:', error)
      return NextResponse.json({ error: 'Failed to fetch sticky notes' }, { status: 500 })
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({
        notes: [],
        total: count || 0,
        has_more: false,
      })
    }

    // Fetch related data separately
    const authorUserIds = [...new Set(notes.map((n) => n.author_id).filter(Boolean))]
    const noteIds = notes.map((n) => n.id)

    // Fetch authors - author_id is user_id, so we need to match by user_id
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_id')
      .in('user_id', authorUserIds)

    // Try to fetch emails from auth.users using service role (if available)
    const emailMap = new Map<string, string>()
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        const userIds = [...new Set(authors?.map((a) => a.user_id).filter(Boolean) || [])]
        if (userIds.length > 0) {
          const {
            data: { users },
            error: usersError,
          } = await supabaseAdmin.auth.admin.listUsers()

          if (!usersError && users) {
            users.forEach((u) => {
              if (u.email && userIds.includes(u.id)) {
                emailMap.set(u.id, u.email)
              }
            })
          }
        }
      }
    } catch {
      // Silently ignore email fetch errors - non-critical
    }

    // Add email to authors
    const authorsWithEmail = (authors || []).map((author) => ({
      ...author,
      email: emailMap.get(author.user_id) || null,
    }))

    // Fetch mentions
    const { data: mentions } = await supabase
      .from('note_mentions')
      .select('*, mentioned_user_id')
      .in('note_id', noteIds)

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
      .in('note_id', noteIds)

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
      .in('parent_id', noteIds)
      .is('deleted_at', null)

    // Fetch reply authors (author_id is user_id)
    const replyAuthorUserIds = [...new Set((replies || []).map((r) => r.author_id).filter(Boolean))]
    const { data: replyAuthors } =
      replyAuthorUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, user_id')
            .in('user_id', replyAuthorUserIds)
        : { data: null }

    // Try to fetch emails for reply authors
    const replyEmailMap = new Map<string, string>()
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL && replyAuthorUserIds.length > 0) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        const {
          data: { users },
          error: usersError,
        } = await supabaseAdmin.auth.admin.listUsers()

        if (!usersError && users) {
          users.forEach((u) => {
            if (u.email && replyAuthorUserIds.includes(u.id)) {
              replyEmailMap.set(u.id, u.email)
            }
          })
        }
      }
    } catch (emailError) {
      // Silently ignore email fetch errors
    }

    // Add email to reply authors
    const replyAuthorsWithEmail = (replyAuthors || []).map((author) => ({
      ...author,
      email: replyEmailMap.get(author.user_id) || null,
    }))

    // Create maps for quick lookup - use user_id as key since author_id is user_id
    const authorMap = new Map((authorsWithEmail || []).map((a) => [a.user_id, a]))
    const replyAuthorMap = new Map((replyAuthorsWithEmail || []).map((a) => [a.user_id, a]))
    const mentionedUserMap = new Map((mentionedUsers || []).map((u) => [u.id, u]))
    const reactionUserMap = new Map((reactionUsers || []).map((u) => [u.id, u]))
    const repliesMap = new Map<
      string,
      Array<{ id: string; parent_id: string; [key: string]: unknown }>
    >()
    ;(replies || []).forEach((reply) => {
      if (!repliesMap.has(reply.parent_id)) {
        repliesMap.set(reply.parent_id, [])
      }
      const replyWithAuthor = {
        ...reply,
        author: replyAuthorMap.get(reply.author_id) || null,
      }
      repliesMap.get(reply.parent_id)!.push(replyWithAuthor)
    })

    // Combine data
    const notesWithCount = notes.map((note) => {
      const noteMentions = (mentions || [])
        .filter((m) => m.note_id === note.id)
        .map((m) => ({
          ...m,
          mentioned_user: mentionedUserMap.get(m.mentioned_user_id) || null,
        }))

      const noteReactions = (reactions || [])
        .filter((r) => r.note_id === note.id)
        .map((r) => ({
          ...r,
          user: reactionUserMap.get(r.user_id) || null,
        }))

      const noteReplies = repliesMap.get(note.id) || []

      return {
        ...note,
        author: authorMap.get(note.author_id) || null,
        mentions: noteMentions,
        reactions: noteReactions,
        replies: noteReplies,
        replies_count: noteReplies.length,
      }
    }) as StickyNoteWithDetails[]

    return NextResponse.json({
      notes: notesWithCount,
      total: count || 0,
      has_more: (count || 0) > offset + limit,
    })
  } catch (error) {
    console.error('Error in GET /api/sticky-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST - Create sticky note
// ============================================
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateStickyNoteRequest = await request.json()

    const { workspace_id, patient_id, content, note_type, color, parent_id, mentions } = body

    // Validate required fields
    if (!workspace_id || !content || !note_type) {
      return NextResponse.json(
        { error: 'workspace_id, content, and note_type are required' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length < 1 || content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 5000 characters' },
        { status: 400 }
      )
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
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
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating sticky note:', createError)
      return NextResponse.json({ error: 'Failed to create sticky note' }, { status: 500 })
    }

    // Fetch author profile - author_id is user_id, so we match by user_id
    const { data: author } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_id')
      .eq('user_id', user.id)
      .single()

    // Try to fetch email from auth.users
    let authorEmail: string | null = null
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL && author?.user_id) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(author.user_id)
        authorEmail = authUser?.user?.email || null
      }
    } catch (emailError) {
      // Silently ignore email fetch errors
    }

    // Add email to author
    const authorWithEmail = author
      ? {
          ...author,
          email: authorEmail,
        }
      : null

    // Create mentions if provided
    if (mentions && mentions.length > 0) {
      const mentionsToInsert = mentions
        .filter((userId) => userId !== user.id) // Don't mention yourself
        .map((userId) => ({
          note_id: note.id,
          mentioned_user_id: userId,
        }))

      if (mentionsToInsert.length > 0) {
        const { error: mentionsError } = await supabase
          .from('note_mentions')
          .insert(mentionsToInsert)

        if (mentionsError) {
          console.error('Error creating mentions:', mentionsError)
          // Don't fail the request if mentions fail
        }
      }
    }

    // Return note with author
    return NextResponse.json(
      {
        ...note,
        author: authorWithEmail || null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/sticky-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
