import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Organization, CreateOrganizationInput } from '@/types'

// GET /api/organizations - Get user's organizations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organizations user has access to (through workspaces)
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        workspaces!inner (
          id,
          workspace_members!inner (
            user_id
          )
        )
      `
      )
      .eq('workspaces.workspace_members.user_id', user.id)
      .eq('workspaces.workspace_members.status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    // Remove workspace details from response (we only needed them for filtering)
    const cleanedOrgs = organizations?.map(({ workspaces, ...org }) => org) || []

    return NextResponse.json({ organizations: cleanedOrgs })
  } catch (error) {
    console.error('Error in GET /api/organizations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateOrganizationInput

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Create organization
    const { data: organization, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        slug: body.slug,
        type: body.type || 'clinic',
        logo_url: body.logo_url,
        settings: body.settings || {
          timezone: 'Europe/Istanbul',
          language: 'tr',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
        },
        subscription_tier: body.subscription_tier || 'free',
        subscription_status: 'active',
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        address: body.address,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating organization:', createError)
      if (createError.code === '23505') {
        // Unique violation
        return NextResponse.json({ error: 'Organization slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Update user's profile to set current organization
    await supabase.from('profiles').update({ current_organization_id: organization.id }).eq('user_id', user.id)

    return NextResponse.json({ organization }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/organizations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
