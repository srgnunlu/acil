import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Hasta ownership kontrolü
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .in('id', patientIds)

    if (patientsError || !patients || patients.length !== patientIds.length) {
      return NextResponse.json(
        { error: 'Some patients not found or not authorized' },
        { status: 403 }
      )
    }

    let updateData: { status: string } = { status: '' }
    let successMessage = ''

    switch (action) {
      case 'update_status':
        if (!value || !['active', 'discharged', 'consultation'].includes(value)) {
          return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
        }
        updateData = { status: value }
        successMessage = `${patientIds.length} hasta durumu güncellendi`
        break

      case 'discharge':
        updateData = { status: 'discharged' }
        successMessage = `${patientIds.length} hasta taburcu edildi`
        break

      case 'set_consultation':
        updateData = { status: 'consultation' }
        successMessage = `${patientIds.length} hasta konsültasyona gönderildi`
        break

      case 'activate':
        updateData = { status: 'active' }
        successMessage = `${patientIds.length} hasta aktif edildi`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Toplu güncelleme yap
    const { error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .in('id', patientIds)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Bulk update error:', updateError)
      return NextResponse.json({ error: 'Failed to update patients' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      updatedCount: patientIds.length,
    })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
