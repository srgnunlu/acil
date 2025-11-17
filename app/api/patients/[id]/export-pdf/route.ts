import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { PatientReportDocument } from '@/lib/pdf/PatientReportDocument'

type Params = {
  id: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    const supabase = await createClient()
    const params = await context.params

    // Kullanıcı authentication kontrolü
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = params.id

    // Workspace erişim kontrolü
    const { requirePatientWorkspaceAccess } = await import('@/lib/permissions/workspace-helpers')
    const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patientId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.error || 'Patient not found or access denied' },
        { status: 404 }
      )
    }

    // Hasta bilgilerini al (category bilgisiyle)
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*, category:patient_categories(slug, name)')
      .eq('id', patientId)
      .eq('workspace_id', accessResult.workspaceId!)
      .is('deleted_at', null)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Hasta verilerini al
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    // Testleri al
    const { data: tests } = await supabase
      .from('tests')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    // AI analizlerini al
    const { data: aiAnalyses } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    // Chat geçmişini al
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true })

    // Rapor verilerini hazırla
    const reportData = {
      generated_at: new Date().toISOString(),
      patient: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        status: patient.workflow_state || 'unknown',
        category: (patient.category as { slug?: string; name?: string })?.name || 'Bilinmiyor',
        admission_date: patient.admission_date,
      },
      data: {
        patient_data: patientData || [],
        tests: tests || [],
        ai_analyses: aiAnalyses || [],
        chat_history: chatHistory || [],
      },
      summary: {
        total_data_entries: patientData?.length || 0,
        total_tests: tests?.length || 0,
        total_ai_analyses: aiAnalyses?.length || 0,
        total_chat_messages: chatHistory?.length || 0,
      },
    }

    // PDF oluştur
    const stream = await renderToStream(PatientReportDocument({ data: reportData }))

    // Stream'i Response'a dönüştür
    const chunks: Uint8Array[] = []

    return new Promise<NextResponse>((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk)
      })

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const response = new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="patient_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        })
        resolve(response)
      })

      stream.on('error', (error) => {
        console.error('PDF generation error:', error)
        reject(NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 }))
      })
    })
  } catch (error) {
    console.error('Export PDF error:', error)
    return NextResponse.json({ error: 'Failed to export patient data' }, { status: 500 })
  }
}
