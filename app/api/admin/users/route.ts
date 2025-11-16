import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    // Get single user
    if (userId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        logger.error({ error, userId }, 'Failed to fetch user')
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
      }

      // Get workspace memberships
      const { data: userMemberships } = await supabase
        .from('workspace_members')
        .select('id, role, status, workspace_id, workspaces(name, organization_id)')
        .eq('user_id', userId)

      return NextResponse.json({ ...profile, workspace_members: userMemberships || [] })
    }

    // List all users (already handled by page)
    return NextResponse.json({ message: 'Use page for listing' })
  } catch (error) {
    logger.error({ error }, 'Admin users API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, ...updates } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      logger.error({ error, user_id, updates }, 'Failed to update user')
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    logger.info({ user_id, updates }, 'User updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin users PATCH error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Don't allow deleting self
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Soft delete: remove from workspaces
    const { error: memberError } = await supabase
      .from('workspace_members')
      .update({ status: 'inactive' })
      .eq('user_id', userId)

    if (memberError) {
      logger.error({ error: memberError, userId }, 'Failed to deactivate user memberships')
    }

    // Note: We don't delete the profile or auth user for data integrity
    // You could add a 'deleted_at' column to profiles if needed

    logger.info({ userId, deletedBy: user.id }, 'User deactivated by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin users DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
