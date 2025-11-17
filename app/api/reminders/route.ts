import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kullanıcının bildirimlerini al (RLS döngüsünü önlemek için JOIN yapmıyoruz)
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'sent'])
      .order('scheduled_time', { ascending: true })

    if (error) throw error

    // Patient bilgilerini ayrı olarak al (RLS döngüsü önlemek için)
    let enrichedReminders = reminders || []
    if (enrichedReminders.length > 0) {
      const patientIds = [...new Set(enrichedReminders.map((r) => r.patient_id).filter(Boolean))]

      if (patientIds.length > 0) {
        const { data: patients } = await supabase
          .from('patients')
          .select('id, name')
          .in('id', patientIds)

        // Reminder'lara patient bilgilerini ekle
        enrichedReminders = enrichedReminders.map((reminder) => ({
          ...reminder,
          patients: patients?.find((p) => p.id === reminder.patient_id) || null,
        }))
      }
    }

    return NextResponse.json({
      success: true,
      reminders: enrichedReminders,
    })
  } catch (error: unknown) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bildirimler alınamadı' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { patientId, reminderType, scheduledTime, message } = await request.json()

    if (!patientId || !reminderType || !scheduledTime) {
      return NextResponse.json(
        { error: 'Patient ID, reminder type ve scheduled time gerekli' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hastanın kullanıcının workspace'inde olduğunu kontrol et
    const { data: patient } = await supabase
      .from('patients')
      .select('id, workspace_id')
      .eq('id', patientId)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }

    // Kullanıcının bu workspace'te üye olduğunu kontrol et
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', patient.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Bu workspace'e erişim yetkiniz yok" }, { status: 403 })
    }

    // Hatırlatma oluştur
    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        reminder_type: reminderType,
        scheduled_time: scheduledTime,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      reminder,
    })
  } catch (error: unknown) {
    console.error('Create reminder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hatırlatma oluşturulamadı' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { reminderId, status } = await request.json()

    if (!reminderId || !status) {
      return NextResponse.json({ error: 'Reminder ID ve status gerekli' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hatırlatmayı güncelle
    const { data: reminder, error } = await supabase
      .from('reminders')
      .update({ status })
      .eq('id', reminderId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      reminder,
    })
  } catch (error: unknown) {
    console.error('Update reminder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hatırlatma güncellenemedi' },
      { status: 500 }
    )
  }
}
