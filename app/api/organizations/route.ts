import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateOrganizationInput } from '@/types'

// GET /api/organizations - Get user's organizations
export async function GET() {
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

    // Get organizations from organization_members (yeni iki seviyeli sistem)
    const { data: orgMemberships, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (orgMemberError) {
      console.error('[GET /api/organizations] Error fetching organization memberships:', {
        error: orgMemberError,
        code: orgMemberError.code,
        message: orgMemberError.message,
        details: orgMemberError.details,
        hint: orgMemberError.hint,
      })
      // Hata olsa bile devam et (backward compatibility için)
    }

    // Extract organization IDs
    const orgIds = new Set<string>()
    if (orgMemberships && orgMemberships.length > 0) {
      orgMemberships.forEach((m) => {
        if (m.organization_id) {
          orgIds.add(m.organization_id)
        }
      })
    }

    // Also check profile for backward compatibility
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.current_organization_id) {
      orgIds.add(profile.current_organization_id)
    }

    // If no organizations found, return empty array
    if (orgIds.size === 0) {
      console.log('[GET /api/organizations] No organizations found for user')
      return NextResponse.json({ organizations: [] })
    }

    // Get organizations
    const orgIdsArray = Array.from(orgIds)
    console.log('[GET /api/organizations] Fetching organizations:', orgIdsArray)

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIdsArray)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/organizations] Error fetching organizations:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          error: 'Failed to fetch organizations',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    console.log('[GET /api/organizations] Found organizations:', organizations?.length || 0)
    return NextResponse.json({ organizations: organizations || [] })
  } catch (error) {
    console.error('[GET /api/organizations] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/organizations] Starting organization creation')
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[POST /api/organizations] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[POST /api/organizations] User authenticated:', user.id)

    const body = (await request.json()) as CreateOrganizationInput
    console.log('[POST /api/organizations] Request body:', body)

    // Validate required fields
    if (!body.name || !body.slug) {
      console.error('[POST /api/organizations] Validation error: name or slug missing')
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      console.error('[POST /api/organizations] Validation error: invalid slug format')
      return NextResponse.json(
        { error: 'Slug sadece küçük harf, rakam ve tire içerebilir' },
        { status: 400 }
      )
    }

    // Create organization (created_by ekleniyor - RLS policy için gerekli)
    const insertData = {
      name: body.name,
      slug: body.slug,
      type: body.type || 'clinic',
      logo_url: body.logo_url || null,
      settings: body.settings || {
        timezone: 'Europe/Istanbul',
        language: 'tr',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      },
      subscription_tier: body.subscription_tier || 'free',
      subscription_status: 'active' as const,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      address: body.address || null,
      created_by: user.id, // RLS policy için gerekli - kullanıcı sadece kendi organization'ını oluşturabilir
    }

    console.log('[POST /api/organizations] Inserting organization:', insertData)

    // INSERT işlemi - select() ile birlikte kullanarak INSERT sonrası veriyi al
    const { data: organization, error: createError } = await supabase
      .from('organizations')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('[POST /api/organizations] Error creating organization:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        fullError: JSON.stringify(createError, null, 2),
      })

      // RLS policy hatası kontrolü
      if (
        createError.message?.includes('policy') ||
        createError.message?.includes('permission') ||
        createError.code === '42501'
      ) {
        console.error(
          '[POST /api/organizations] RLS POLICY ERROR - Organizations INSERT/SELECT policy sorunu!'
        )
        return NextResponse.json(
          {
            error: 'Organizasyon oluşturma yetkisi yok. RLS policy hatası.',
            details: createError.message,
            hint: "RLS policy'leri kontrol edildi ve güncellendi. Lütfen tekrar deneyin.",
          },
          { status: 403 }
        )
      }

      if (createError.code === '23505') {
        // Unique violation
        return NextResponse.json(
          { error: 'Bu slug zaten kullanılıyor. Lütfen farklı bir slug seçin.' },
          { status: 409 }
        )
      }

      if (createError.code === '23503') {
        // Foreign key violation
        return NextResponse.json(
          { error: 'Geçersiz referans hatası. Lütfen tekrar deneyin.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Organizasyon oluşturulamadı',
          details: createError.message,
          code: createError.code,
        },
        { status: 500 }
      )
    }

    if (!organization) {
      console.error('[POST /api/organizations] Organization created but data is null')
      // INSERT başarılı ama SELECT başarısız - RLS policy sorunu olabilir
      // Organization ID'yi insertData'dan alarak tekrar sorgula
      console.log(
        '[POST /api/organizations] Attempting to fetch organization by slug:',
        insertData.slug
      )

      const { data: fetchedOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', insertData.slug)
        .single()

      if (fetchError || !fetchedOrg) {
        console.error(
          '[POST /api/organizations] Failed to fetch organization after insert:',
          fetchError
        )
        return NextResponse.json(
          {
            error: 'Organizasyon oluşturuldu ancak veri alınamadı',
            details: 'RLS policy sorunu olabilir. Lütfen tekrar deneyin.',
          },
          { status: 500 }
        )
      }

      console.log('[POST /api/organizations] Organization fetched successfully:', fetchedOrg.id)
      // fetchedOrg'u organization olarak kullan
      const finalOrg = fetchedOrg

      // Profile'ı güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_organization_id: finalOrg.id })
        .eq('user_id', user.id)

      if (profileError) {
        console.warn('[POST /api/organizations] Warning: Failed to update profile:', profileError)
      }

      return NextResponse.json({ organization: finalOrg }, { status: 201 })
    }

    console.log('[POST /api/organizations] Organization created successfully:', organization.id)

    // Update user's profile to set current organization (SELECT policy için gerekli)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ current_organization_id: organization.id })
      .eq('user_id', user.id)

    if (profileError) {
      console.warn('[POST /api/organizations] Warning: Failed to update profile:', profileError)
      // Profile update başarısız olsa bile organization'ı döndür
      // Çünkü INSERT başarılı oldu ve organization oluşturuldu
    } else {
      console.log(
        '[POST /api/organizations] Profile updated with current_organization_id:',
        organization.id
      )
    }

    // Organization'ı tekrar sorgula (SELECT policy'nin çalışması için)
    // Bu gerekli çünkü INSERT sonrası SELECT policy henüz profile güncellenmeden çalışmış olabilir
    const { data: finalOrganization, error: refetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization.id)
      .single()

    if (refetchError) {
      console.warn(
        '[POST /api/organizations] Warning: Failed to refetch organization:',
        refetchError
      )
      // Refetch başarısız olsa bile INSERT sonrası dönen organization'ı kullan
      return NextResponse.json({ organization }, { status: 201 })
    }

    console.log(
      '[POST /api/organizations] Final organization:',
      finalOrganization?.id || organization.id
    )
    return NextResponse.json({ organization: finalOrganization || organization }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/organizations] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
