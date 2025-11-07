import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Params {
  id: string
}

export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hasta bilgilerini al
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }

    // Hasta verilerini al
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: true })

    // Tetkikleri al
    const { data: tests } = await supabase
      .from('patient_tests')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: true })

    // AI analizlerini al
    const { data: analyses } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: true })

    // Chat mesajlarını al
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: true })

    // Profil bilgilerini al
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Rapor oluştur
    const report = {
      generated_at: new Date().toISOString(),
      generated_by: {
        name: profile?.full_name || user.email,
        specialty: profile?.specialty,
        institution: profile?.institution,
      },
      patient: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        status: patient.status,
        admission_date: patient.created_at,
        last_updated: patient.updated_at,
      },
      data: {
        patient_data: patientData || [],
        tests: tests || [],
        ai_analyses: analyses || [],
        chat_history: chatMessages || [],
      },
      summary: {
        total_data_entries: (patientData || []).length,
        total_tests: (tests || []).length,
        total_ai_analyses: (analyses || []).length,
        total_chat_messages: (chatMessages || []).length,
      },
    }

    // JSON olarak döndür
    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        headers: {
          'Content-Disposition': `attachment; filename="patient_${patient.name}_${new Date().toISOString().split('T')[0]}.json"`,
        },
      }
    )
  } catch (error: unknown) {
    console.error('Export error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Export yapılırken hata oluştu'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
