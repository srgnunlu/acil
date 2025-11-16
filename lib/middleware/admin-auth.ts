import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Admin yetkilendirme kontrolü
 * Kullanıcının admin veya owner rolüne sahip olup olmadığını kontrol eder
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    logger.warn({ error: authError }, 'Admin auth failed: No user')
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  // Check if user is admin/owner in any workspace
  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role, workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])

  if (membershipError) {
    logger.error({ error: membershipError, userId: user.id }, 'Failed to check admin membership')
    return {
      error: NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 }),
      user: null,
    }
  }

  if (!memberships || memberships.length === 0) {
    logger.warn({ userId: user.id }, 'Admin auth failed: User is not admin/owner')
    return {
      error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
      user: null,
    }
  }

  return {
    error: null,
    user,
    memberships,
  }
}

/**
 * Admin yetkilendirme wrapper
 * API route handler'larında kullanılır
 */
export async function withAdminAuth<T>(
  handler: (user: { id: string; email?: string }, memberships: Array<{ role: string; workspace_id: string }>) => Promise<T>
): Promise<T | NextResponse> {
  const authResult = await requireAdmin()

  if (authResult.error) {
    return authResult.error
  }

  if (!authResult.user || !authResult.memberships) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return handler(
    {
      id: authResult.user.id,
      email: authResult.user.email,
    },
    authResult.memberships
  )
}

