import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')
    const workspaceId = searchParams.get('workspace_id')
    const organizationId = searchParams.get('organization_id')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single category
    if (categoryId) {
      const { data: category, error } = await supabase
        .from('patient_categories')
        .select(
          `
          *,
          workspace:workspaces(id, name, slug),
          organization:organizations(id, name, slug),
          patients(count)
        `
        )
        .eq('id', categoryId)
        .is('deleted_at', null)
        .single()

      if (error) {
        logger.error({ error, categoryId }, 'Failed to fetch category')
        return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
      }

      // Get patient count
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .is('deleted_at', null)

      return NextResponse.json({
        ...category,
        patient_count: patientCount || 0,
      })
    }

    // List all categories
    let query = supabase
      .from('patient_categories')
      .select(
        `
        *,
        workspace:workspaces(id, name, slug),
        organization:organizations(id, name, slug)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (organizationId) {
      // Get workspace IDs for this organization
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (workspaces && workspaces.length > 0) {
        const workspaceIds = workspaces.map((w) => w.id)
        query = query.in('workspace_id', workspaceIds)
      } else {
        // No workspaces, return empty
        return NextResponse.json({
          categories: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: categories, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch categories')
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get patient counts for each category
    if (categories && categories.length > 0) {
      const categoryIds = categories.map((c) => c.id)
      const { data: patientCounts } = await supabase
        .from('patients')
        .select('category_id')
        .in('category_id', categoryIds)
        .is('deleted_at', null)

      const countMap = new Map<string, number>()
      patientCounts?.forEach((p) => {
        if (p.category_id) {
          countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1)
        }
      })

      // Attach counts to categories
      categories.forEach((category) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(category as any).patient_count = countMap.get(category.id) || 0
      })
    }

    return NextResponse.json({
      categories: categories || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin categories API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const body = await request.json()
    const { workspace_id, name, slug, color, icon, description, is_default, sort_order } = body

    if (!workspace_id || !name || !slug) {
      return NextResponse.json(
        { error: 'workspace_id, name, and slug are required' },
        { status: 400 }
      )
    }

    // Verify workspace exists
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if slug already exists for this workspace
    const { data: existing } = await supabase
      .from('patient_categories')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this slug already exists in this workspace' },
        { status: 400 }
      )
    }

    // Get max sort_order if not provided
    let finalSortOrder = sort_order
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const { data: maxCategory } = await supabase
        .from('patient_categories')
        .select('sort_order')
        .eq('workspace_id', workspace_id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      finalSortOrder = maxCategory ? (maxCategory.sort_order || 0) + 1 : 1
    }

    // Create category
    const { data: category, error } = await supabase
      .from('patient_categories')
      .insert({
        workspace_id,
        name,
        slug,
        color: color || '#6b7280',
        icon: icon || '📋',
        description: description || null,
        is_default: is_default || false,
        sort_order: finalSortOrder,
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, body }, 'Failed to create category')
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    logger.info({ categoryId: category.id, name, createdBy: authResult.user!.id }, 'Category created by admin')

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Admin categories POST error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const body = await request.json()
    const { category_id, ...updates } = body

    if (!category_id) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 })
    }

    // If slug is being updated, check for conflicts
    if (updates.slug) {
      const { data: category } = await supabase
        .from('patient_categories')
        .select('workspace_id')
        .eq('id', category_id)
        .single()

      if (category) {
        const { data: existing } = await supabase
          .from('patient_categories')
          .select('id')
          .eq('workspace_id', category.workspace_id)
          .eq('slug', updates.slug)
          .neq('id', category_id)
          .is('deleted_at', null)
          .single()

        if (existing) {
          return NextResponse.json(
            { error: 'Category with this slug already exists in this workspace' },
            { status: 400 }
          )
        }
      }
    }

    // Update category
    const { data, error } = await supabase
      .from('patient_categories')
      .update(updates)
      .eq('id', category_id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      logger.error({ error, category_id, updates }, 'Failed to update category')
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    logger.info({ category_id, updates, updatedBy: authResult.user!.id }, 'Category updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin categories PATCH error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')

    if (!categoryId) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 })
    }

    // Check if category is in use
    const { count: patientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null)

    if (patientCount && patientCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${patientCount} patients are using this category` },
        { status: 400 }
      )
    }

    // Soft delete category
    const { error } = await supabase
      .from('patient_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId)

    if (error) {
      logger.error({ error, categoryId }, 'Failed to delete category')
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    logger.info({ categoryId, deletedBy: authResult.user!.id }, 'Category deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin categories DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

