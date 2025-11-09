import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserWorkspaceIds, requireWorkspaceAccess } from '@/lib/permissions/workspace-helpers'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Kullanıcı authentication kontrolü
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { patientIds, action, value } = await request.json()

    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return NextResponse.json({ error: 'Patient IDs are required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Kullanıcının erişebildiği workspace'leri al
    const userWorkspaceIds = await getUserWorkspaceIds(supabase, user.id)
    if (userWorkspaceIds.length === 0) {
      return NextResponse.json({ error: 'No workspace access found' }, { status: 403 })
    }

    // Hasta bilgilerini al ve workspace kontrolü yap
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, workspace_id, deleted_at')
      .in('id', patientIds)
      .in('workspace_id', userWorkspaceIds)
      .is('deleted_at', null)

    if (patientsError || !patients || patients.length === 0) {
      return NextResponse.json({ error: 'No patients found or access denied' }, { status: 403 })
    }

    // Tüm hastaların kullanıcının workspace'lerinde olduğunu kontrol et
    if (patients.length !== patientIds.length) {
      return NextResponse.json(
        { error: 'Some patients not found or access denied' },
        { status: 403 }
      )
    }

    // Her hasta için workspace erişimini doğrula
    for (const patient of patients) {
      if (!patient.workspace_id) {
        return NextResponse.json({ error: 'Invalid patient workspace' }, { status: 403 })
      }
      const accessResult = await requireWorkspaceAccess(supabase, user.id, patient.workspace_id)
      if (!accessResult.hasAccess) {
        return NextResponse.json(
          { error: `Access denied for patient ${patient.id}` },
          { status: 403 }
        )
      }
    }

    // Workspace'leri topla
    const workspaceIds = [...new Set(patients.map((p) => p.workspace_id).filter(Boolean))]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateData: { category_id: string } | null = null
    let successMessage = ''

    // Kategorileri al
    const { data: categories } = await supabase
      .from('patient_categories')
      .select('id, slug, workspace_id')
      .in('workspace_id', workspaceIds)
      .in('slug', ['active', 'discharged', 'consultation'])
      .is('deleted_at', null)

    const getCategoryId = (slug: string, workspaceId: string | null): string | null => {
      if (!workspaceId) return null
      const category = categories?.find((c) => c.slug === slug && c.workspace_id === workspaceId)
      return category?.id || null
    }

    switch (action) {
      case 'update_status':
        if (!value || !['active', 'discharged', 'consultation'].includes(value)) {
          return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
        }
        // Her hasta için workspace'ine göre kategori bul
        const updates = await Promise.all(
          patients.map(async (patient) => {
            const categoryId = getCategoryId(value, patient.workspace_id)
            if (!categoryId) {
              return { id: patient.id, error: 'Category not found' }
            }
            return { id: patient.id, categoryId }
          })
        )

        // Her hastayı ayrı ayrı güncelle
        for (const update of updates) {
          if ('error' in update) continue
          await supabase
            .from('patients')
            .update({ category_id: update.categoryId })
            .eq('id', update.id)
        }

        successMessage = `${patientIds.length} hasta durumu güncellendi`
        return NextResponse.json({
          success: true,
          message: successMessage,
          updatedCount: patientIds.length,
        })

      case 'discharge':
        // Her hasta için workspace'ine göre discharged kategori bul
        for (const patient of patients) {
          const categoryId = getCategoryId('discharged', patient.workspace_id)
          if (categoryId) {
            await supabase.from('patients').update({ category_id: categoryId }).eq('id', patient.id)
          }
        }
        successMessage = `${patientIds.length} hasta taburcu edildi`
        return NextResponse.json({
          success: true,
          message: successMessage,
          updatedCount: patientIds.length,
        })

      case 'set_consultation':
        // Her hasta için workspace'ine göre consultation kategori bul
        for (const patient of patients) {
          const categoryId = getCategoryId('consultation', patient.workspace_id)
          if (categoryId) {
            await supabase.from('patients').update({ category_id: categoryId }).eq('id', patient.id)
          }
        }
        successMessage = `${patientIds.length} hasta konsültasyona gönderildi`
        return NextResponse.json({
          success: true,
          message: successMessage,
          updatedCount: patientIds.length,
        })

      case 'activate':
        // Her hasta için workspace'ine göre active kategori bul
        for (const patient of patients) {
          const categoryId = getCategoryId('active', patient.workspace_id)
          if (categoryId) {
            await supabase.from('patients').update({ category_id: categoryId }).eq('id', patient.id)
          }
        }
        successMessage = `${patientIds.length} hasta aktif edildi`
        return NextResponse.json({
          success: true,
          message: successMessage,
          updatedCount: patientIds.length,
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
