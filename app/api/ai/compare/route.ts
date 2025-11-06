import { createClient } from '@/lib/supabase/server'
import { compareImages } from '@/lib/ai/gemini'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { image1Url, image2Url, image1Base64, image2Base64, comparisonType, patientId, context } = await request.json()

    if ((!image1Url && !image1Base64) || (!image2Url && !image2Base64)) {
      return NextResponse.json(
        { error: 'İki görsel gerekli' },
        { status: 400 }
      )
    }

    if (!comparisonType) {
      return NextResponse.json(
        { error: 'Karşılaştırma tipi gerekli (ekg, xray, other)' },
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

    // Görselleri base64'e çevir
    const fetchAndConvert = async (url?: string, base64?: string) => {
      if (base64) return base64

      if (url) {
        try {
          const response = await fetch(url)
          const buffer = await response.arrayBuffer()
          const b64 = Buffer.from(buffer).toString('base64')
          return `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${b64}`
        } catch (error) {
          throw new Error('Görsel indirilemedi')
        }
      }

      throw new Error('Görsel bulunamadı')
    }

    const base64Image1 = await fetchAndConvert(image1Url, image1Base64)
    const base64Image2 = await fetchAndConvert(image2Url, image2Base64)

    // Gemini ile karşılaştırma yap
    console.log('Gemini görsel karşılaştırması başlatılıyor...')
    const comparison = await compareImages(
      base64Image1,
      base64Image2,
      comparisonType as 'ekg' | 'xray' | 'other',
      context
    )

    // Eğer patientId varsa, sonucu kaydet
    if (patientId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .eq('user_id', user.id)
        .single()

      if (patient) {
        await supabase.from('patient_tests').insert({
          patient_id: patientId,
          test_type: 'comparison',
          results: {
            type: comparisonType,
            comparison,
            image1: image1Url,
            image2: image2Url,
          },
          images: [image1Url, image2Url].filter(Boolean) as string[],
        })
      }
    }

    return NextResponse.json({
      success: true,
      comparison,
    })
  } catch (error: any) {
    console.error('Comparison API error:', error)
    return NextResponse.json(
      { error: error.message || 'Karşılaştırma yapılırken hata oluştu' },
      { status: 500 }
    )
  }
}
