import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { CreateCategoryInput, UpdateCategoryInput } from '@/types'

// GET /api/workspaces/[id]/categories - Get patient categories
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access
    const { data: access } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!access) {
      return NextResponse.json({ error: 'Forbidden - Workspace access required' }, { status: 403 })
    }

    // Get all categories
    const { data: categories, error } = await supabase
      .from('patient_categories')
      .select('*')
      .eq('workspace_id', id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get patient count for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .is('deleted_at', null)

        return {
          ...category,
          patient_count: count || 0,
        }
      })
    )

    return NextResponse.json({ categories: categoriesWithCounts })
  } catch (error) {
    console.error('Error in GET /api/workspaces/[id]/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/categories - Create new category
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission (admin or senior_doctor)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin', 'senior_doctor'])
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden - Admin or senior doctor access required' }, { status: 403 })
    }

    const body = (await request.json()) as CreateCategoryInput

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (body.is_default) {
      await supabase
        .from('patient_categories')
        .update({ is_default: false })
        .eq('workspace_id', id)
        .is('deleted_at', null)
    }

    // Get max sort_order
    const { data: lastCategory } = await supabase
      .from('patient_categories')
      .select('sort_order')
      .eq('workspace_id', id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (lastCategory?.sort_order || 0) + 1

    // Create category
    const { data: category, error: createError } = await supabase
      .from('patient_categories')
      .insert({
        workspace_id: id,
        name: body.name,
        slug: body.slug,
        color: body.color || '#6b7280',
        icon: body.icon,
        description: body.description,
        sort_order: body.sort_order !== undefined ? body.sort_order : nextSortOrder,
        is_default: body.is_default || false,
        is_system: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating category:', createError)
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Category slug already exists in this workspace' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/workspaces/[id]/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/workspaces/[id]/categories - Update category (by query param ?category_id=xxx)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    if (!categoryId) {
      return NextResponse.json({ error: 'category_id query parameter is required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin', 'senior_doctor'])
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden - Admin or senior doctor access required' }, { status: 403 })
    }

    // Check if category is system category
    const { data: existingCategory } = await supabase
      .from('patient_categories')
      .select('is_system')
      .eq('id', categoryId)
      .eq('workspace_id', id)
      .single()

    if (existingCategory?.is_system) {
      return NextResponse.json({ error: 'Cannot modify system categories' }, { status: 400 })
    }

    const body = (await request.json()) as UpdateCategoryInput

    // If setting as default, unset other defaults
    if (body.is_default) {
      await supabase.from('patient_categories').update({ is_default: false }).eq('workspace_id', id).is('deleted_at', null)
    }

    // Build update object
    const updates: Partial<UpdateCategoryInput> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.color !== undefined) updates.color = body.color
    if (body.icon !== undefined) updates.icon = body.icon
    if (body.description !== undefined) updates.description = body.description
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order
    if (body.is_default !== undefined) updates.is_default = body.is_default

    // Update category
    const { data: category, error: updateError } = await supabase
      .from('patient_categories')
      .update(updates)
      .eq('id', categoryId)
      .eq('workspace_id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating category:', updateError)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error in PUT /api/workspaces/[id]/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/categories - Soft delete category (by query param ?category_id=xxx)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    if (!categoryId) {
      return NextResponse.json({ error: 'category_id query parameter is required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin', 'senior_doctor'])
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden - Admin or senior doctor access required' }, { status: 403 })
    }

    // Check if category is system category
    const { data: category } = await supabase
      .from('patient_categories')
      .select('is_system')
      .eq('id', categoryId)
      .eq('workspace_id', id)
      .single()

    if (category?.is_system) {
      return NextResponse.json({ error: 'Cannot delete system categories' }, { status: 400 })
    }

    // Check if category has patients
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${count} active patients. Move them first.` },
        { status: 400 }
      )
    }

    // Soft delete category
    const { error: deleteError } = await supabase
      .from('patient_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId)
      .eq('workspace_id', id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[id]/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
