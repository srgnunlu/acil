// ============================================
// SET CURRENT WORKSPACE/ORGANIZATION API
// ============================================
// POST: Set current workspace/organization via cookie
// This ensures cookie is set server-side before page refresh

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, organizationId } = body

    const cookieStore = await cookies()

    if (workspaceId) {
      cookieStore.set('currentWorkspaceId', workspaceId, {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
        httpOnly: false, // Client-side'da da erişilebilir olmalı
      })
    }

    if (organizationId) {
      cookieStore.set('currentOrganizationId', organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
        httpOnly: false,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/workspace/set-current] Error:', error)
    return NextResponse.json({ error: 'Failed to set workspace' }, { status: 500 })
  }
}
