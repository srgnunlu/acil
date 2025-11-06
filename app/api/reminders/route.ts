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

    // Kullanıcının bildirimlerini al
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('scheduled_time', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      reminders: reminders || [],
    })
  } catch (error: any) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: error.message || 'Bildirimler alınamadı' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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

    // Hastanın kullanıcıya ait olduğunu kontrol et
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('user_id', user.id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
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
  } catch (error: any) {
    console.error('Create reminder error:', error)
    return NextResponse.json(
      { error: error.message || 'Hatırlatma oluşturulamadı' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { reminderId, status } = await request.json()

    if (!reminderId || !status) {
      return NextResponse.json(
        { error: 'Reminder ID ve status gerekli' },
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
  } catch (error: any) {
    console.error('Update reminder error:', error)
    return NextResponse.json(
      { error: error.message || 'Hatırlatma güncellenemedi' },
      { status: 500 }
    )
  }
}
