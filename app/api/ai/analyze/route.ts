import { createClient } from '@/lib/supabase/server'
import { analyzePatient } from '@/lib/ai/openai'
import { buildPatientContext } from '@/lib/patients/context-builder'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { aiAnalysisRequestSchema } from '@/lib/validation/schemas'

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
    const rateLimit = await checkRateLimit(identifier, 'ai')

    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.remaining, rateLimit.reset)
    }

    // Input validation
    const body = await request.json()
    const validation = aiAnalysisRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Geçersiz veri' },
        { status: 400 }
      )
    }

    const { patientId, analysisType } = validation.data

    // Workspace erişim kontrolü
    const { requirePatientWorkspaceAccess } = await import('@/lib/permissions/workspace-helpers')
    const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patientId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.error || 'Hasta bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      )
    }

    // Build patient context using shared utility (eliminates duplicate code)
    // Workspace access already verified by requirePatientWorkspaceAccess above
    const result = await buildPatientContext(supabase, patientId, user.id)

    if (!result) {
      return NextResponse.json(
        { error: 'Hasta bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      )
    }

    const { context } = result

    // AI analizi yap
    const aiResponse = await analyzePatient(context, analysisType)

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
  } catch (error: unknown) {
    console.error('AI analiz hatası:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Analiz yapılırken bir hata oluştu',
      },
      { status: 500 }
    )
  }
}
