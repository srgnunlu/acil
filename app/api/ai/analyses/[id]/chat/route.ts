import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { question, messages } = await request.json()

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Soru gerekli' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulaması gerekli' },
        { status: 401 }
      )
    }

    // Get the analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analiz bulunamadı' },
        { status: 404 }
      )
    }

    // Get patient data for context
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('*')
      .eq('patient_id', analysis.patient_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get test results for context
    const { data: tests } = await supabase
      .from('patient_tests')
      .select('*')
      .eq('patient_id', analysis.patient_id)
      .order('test_date', { ascending: false })

    // Build context from analysis
    const analysisContext = buildAnalysisContext(analysis, patientData, tests || [])

    // Prepare system prompt
    const systemPrompt = `Sen bir acil tıp asistanısın. Kullanıcıya aşağıdaki hasta analizi hakkında sorularına yardımcı olacaksın.

HASTA ANALİZİ:
${analysisContext}

ÖNEMLİ KURALLAR:
1. Sadece verilen analiz ve hasta bilgileri kapsamında cevap ver
2. Kesin tanı koyma, sadece AI analizini açıkla
3. Tıbbi terimler kullanırken açıklamalarını da ekle
4. Kısa, net ve anlaşılır cevaplar ver
5. Eğer sorulan bilgi analizde yoksa bunu belirt
6. Hasta güvenliğini her zaman önceliklendir
7. Türkçe cevap ver

Kullanıcının sorusu: ${question}`

    // Determine which AI provider to use
    const useGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0
    const useOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0

    let model
    if (useGemini) {
      model = google('gemini-2.0-flash-exp')
    } else if (useOpenAI) {
      model = openai('gpt-4o-mini')
    } else {
      return NextResponse.json(
        { error: 'AI servisi yapılandırılmamış' },
        { status: 500 }
      )
    }

    // Stream the response
    const result = streamText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...(messages || []),
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Chat işlenirken hata oluştu' },
      { status: 500 }
    )
  }
}

function buildAnalysisContext(analysis: any, patientData: any, tests: any[]): string {
  const response = analysis.ai_response
  let context = `Analiz Tipi: ${analysis.analysis_type === 'initial' ? 'İlk Değerlendirme' : 'Güncellenmiş Analiz'}\n`
  context += `Tarih: ${new Date(analysis.created_at).toLocaleString('tr-TR')}\n\n`

  if (patientData) {
    context += `HASTA BİLGİLERİ:\n`
    context += `- Yaş: ${patientData.age || 'Belirtilmemiş'}\n`
    context += `- Cinsiyet: ${patientData.gender || 'Belirtilmemiş'}\n`
    if (patientData.chief_complaint) context += `- Şikayet: ${patientData.chief_complaint}\n`
    if (patientData.symptoms) context += `- Semptomlar: ${patientData.symptoms}\n`
    if (patientData.allergies) context += `- Alerjiler: ${patientData.allergies}\n`
    if (patientData.medications) context += `- İlaçlar: ${patientData.medications}\n`
    if (patientData.medical_history) context += `- Tıbbi Geçmiş: ${patientData.medical_history}\n`
    context += '\n'
  }

  if (tests && tests.length > 0) {
    context += `TETKIK SONUÇLARI:\n`
    tests.forEach((test) => {
      context += `- ${test.test_name}: ${test.result} ${test.unit || ''}\n`
    })
    context += '\n'
  }

  if (response.summary) {
    context += `ÖZET:\n${response.summary}\n\n`
  }

  if (response.differential_diagnosis) {
    context += `AYIRICI TANILAR:\n`
    response.differential_diagnosis.forEach((d: string, i: number) => {
      context += `${i + 1}. ${d}\n`
    })
    context += '\n'
  }

  if (response.red_flags && response.red_flags.length > 0) {
    context += `KRİTİK BULGULAR:\n`
    response.red_flags.forEach((flag: string) => {
      context += `- ${flag}\n`
    })
    context += '\n'
  }

  if (response.recommended_tests) {
    context += `ÖNERİLEN TETKİKLER:\n`
    response.recommended_tests.forEach((test: any) => {
      context += `- ${test.test} (${test.priority})\n`
      if (test.rationale) context += `  → ${test.rationale}\n`
    })
    context += '\n'
  }

  if (response.treatment_algorithm) {
    context += `TEDAVİ ALGORİTMASI:\n`
    if (response.treatment_algorithm.immediate) {
      context += `Acil Müdahale:\n`
      response.treatment_algorithm.immediate.forEach((item: string) => {
        context += `- ${item}\n`
      })
    }
    if (response.treatment_algorithm.medications) {
      context += `İlaçlar:\n`
      response.treatment_algorithm.medications.forEach((item: any) => {
        if (typeof item === 'string') {
          context += `- ${item}\n`
        } else {
          context += `- ${item.name} ${item.dose} - ${item.frequency}\n`
        }
      })
    }
    context += '\n'
  }

  if (response.consultation && response.consultation.required) {
    context += `KONSÜLTASYON: ${response.consultation.urgency === 'urgent' ? 'ACİL' : 'Önerilen'}\n`
    if (response.consultation.departments) {
      context += `Bölümler: ${response.consultation.departments.join(', ')}\n`
    }
    context += '\n'
  }

  if (response.disposition) {
    context += `HASTA YÖNLENDİRME: ${response.disposition.recommendation}\n`
    if (response.disposition.criteria) {
      context += `Kriter: ${response.disposition.criteria}\n`
    }
  }

  return context
}
