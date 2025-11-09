import { createClient } from '@/lib/supabase/server'
import { chatWithAI, PatientContext } from '@/lib/ai/openai'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { chatMessageSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting kontrolü
    const identifier = getClientIdentifier(request, user.id)
    const rateLimit = await checkRateLimit(identifier, 'chat')

    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.remaining, rateLimit.reset)
    }

    // Input validation
    const body = await request.json()
    const validation = chatMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Geçersiz veri' },
        { status: 400 }
      )
    }

    const { patientId, message, sessionId } = validation.data

    // Workspace erişim kontrolü
    const { requirePatientWorkspaceAccess } = await import('@/lib/permissions/workspace-helpers')
    const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patientId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.error || 'Hasta bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      )
    }

    // Hastayı al (workspace kontrolü ile)
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('workspace_id', accessResult.workspaceId!)
      .is('deleted_at', null)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }

    // Session yönetimi
    let currentSessionId = sessionId

    if (!currentSessionId) {
      // Yeni session oluştur
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          patient_id: patientId,
          user_id: user.id,
          title: 'Yeni Konuşma',
        })
        .select()
        .single()

      if (sessionError || !newSession) {
        console.error('Session creation error:', sessionError)
        return NextResponse.json({ error: 'Session oluşturulamadı' }, { status: 500 })
      }

      currentSessionId = newSession.id
    }

    // Önceki mesajları al (ilgili session'dan, son 20 mesaj)
    const { data: previousMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Hasta context'ini oluştur
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('*')
      .eq('patient_id', patientId)

    const { data: tests } = await supabase
      .from('patient_tests')
      .select('*')
      .eq('patient_id', patientId)

    const { data: analyses } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Context oluştur
    const context: PatientContext = {
      demographics: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
      },
    }

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
        }
      })
    }

    if (tests && tests.length > 0) {
      context.tests = tests.map((test) => ({
        type: test.test_type,
        results: test.results,
        date: test.created_at,
      }))
    }

    if (analyses && analyses.length > 0) {
      context.previousAnalyses = analyses.map((analysis) => ({
        type: analysis.analysis_type,
        response: analysis.ai_response,
        date: analysis.created_at,
      }))
    }

    // Mesaj geçmişini oluştur
    const messages = [
      ...(previousMessages || []).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ]

    // AI'dan yanıt al
    console.log('Chat AI yanıtı alınıyor...')
    const aiResponse = await chatWithAI(messages, context)

    // Kullanıcı mesajını kaydet
    await supabase.from('chat_messages').insert({
      patient_id: patientId,
      user_id: user.id,
      session_id: currentSessionId,
      role: 'user',
      content: message,
    })

    // AI yanıtını kaydet
    await supabase.from('chat_messages').insert({
      patient_id: patientId,
      user_id: user.id,
      session_id: currentSessionId,
      role: 'assistant',
      content: aiResponse,
    })

    return NextResponse.json({
      success: true,
      message: aiResponse,
      sessionId: currentSessionId,
    })
  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Chat yanıtı alınırken hata oluştu'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
