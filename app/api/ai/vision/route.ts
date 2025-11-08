import { createClient } from '@/lib/supabase/server'
import { analyzeImage } from '@/lib/ai/gemini'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageUrl, imageBase64, analysisType, patientId, context } = await request.json()

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'Görsel URL veya Base64 gerekli' }, { status: 400 })
    }

    if (!analysisType) {
      return NextResponse.json(
        { error: 'Analiz tipi gerekli (ekg, skin_lesion, xray, lab_results, other)' },
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

    // Eğer imageUrl varsa, resmi fetch et ve base64'e çevir
    let base64Image = imageBase64

    if (imageUrl && !imageBase64) {
      try {
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        base64Image = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${base64}`
      } catch (error) {
        console.error('Image fetch error:', error)
        return NextResponse.json({ error: 'Görsel indirilemedi' }, { status: 400 })
      }
    }

    if (!base64Image) {
      return NextResponse.json({ error: 'Base64 görsel oluşturulamadı' }, { status: 400 })
    }

    // Gemini Vision API ile analiz yap
    console.log('Gemini Vision analizi başlatılıyor...')
    const analysis = await analyzeImage(
      base64Image,
      analysisType as 'ekg' | 'skin_lesion' | 'xray' | 'lab_results' | 'other',
      context
    )

    // Eğer patientId varsa, sonucu kaydet
    if (patientId) {
      // Hastanın kullanıcıya ait olduğunu kontrol et
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .eq('user_id', user.id)
        .single()

      if (patient) {
        // Test sonucu olarak kaydet
        await supabase.from('patient_tests').insert({
          patient_id: patientId,
          test_type: analysisType === 'ekg' ? 'ekg' : analysisType === 'xray' ? 'xray' : 'other',
          results: analysis,
          images: imageUrl ? [imageUrl] : [],
        })
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Vision API error:', error)
    return NextResponse.json(
      { error: err.message || 'Görsel analizi yapılırken hata oluştu' },
      { status: 500 }
    )
  }
}
