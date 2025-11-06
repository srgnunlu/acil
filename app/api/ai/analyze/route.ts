import { createClient } from '@/lib/supabase/server'
import { analyzePatient, PatientContext } from '@/lib/ai/openai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { patientId, analysisType } = await request.json()

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID gerekli' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Kullanıcı kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hastanın kullanıcıya ait olduğunu kontrol et
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', user.id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }

    // Hasta verilerini topla
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    const { data: tests } = await supabase
      .from('patient_tests')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    const { data: previousAnalyses } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Patient context oluştur
    const context: PatientContext = {
      demographics: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
      },
    }

    // Verileri kategorilere ayır
    if (patientData && patientData.length > 0) {
      patientData.forEach((data) => {
        switch (data.data_type) {
          case 'anamnesis':
            context.anamnesis = data.content
            break
          case 'medications':
            if (!context.medications) context.medications = []
            context.medications.push(data.content)
            break
          case 'vital_signs':
            context.vitalSigns = data.content
            break
          case 'history':
            context.history = data.content
            break
          case 'demographics':
            context.demographics = {
              ...context.demographics,
              ...(data.content as any),
            }
            break
        }
      })
    }

    // Tetkik sonuçlarını ekle
    if (tests && tests.length > 0) {
      context.tests = tests.map((test) => ({
        type: test.test_type,
        results: test.results,
        date: test.created_at,
      }))
    }

    // Önceki analizleri ekle
    if (previousAnalyses && previousAnalyses.length > 0) {
      context.previousAnalyses = previousAnalyses.map((analysis) => ({
        type: analysis.analysis_type,
        response: analysis.ai_response,
        date: analysis.created_at,
      }))
    }

    // AI analizi yap
    console.log('AI analizi başlatılıyor...')
    const aiResponse = await analyzePatient(
      context,
      analysisType || 'initial'
    )

    // Analizi kaydet
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        patient_id: patientId,
        analysis_type: analysisType || 'initial',
        input_data: context,
        ai_response: aiResponse,
        references: aiResponse.references || null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Analiz kaydetme hatası:', saveError)
      throw saveError
    }

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
    })
  } catch (error: any) {
    console.error('AI analiz hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Analiz yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
