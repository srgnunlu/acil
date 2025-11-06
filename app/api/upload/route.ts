import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patientId') as string

    if (!file) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
    }

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID gerekli' },
        { status: 400 }
      )
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

    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya boyutu 10MB\'dan küçük olmalı' },
        { status: 400 }
      )
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece resim dosyaları (JPEG, PNG, WebP) yüklenebilir' },
        { status: 400 }
      )
    }

    // Dosyayı buffer'a dönüştür
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Benzersiz dosya adı oluştur
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${patientId}/${timestamp}.${fileExt}`

    // Supabase Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medical-images')
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Dosya yüklenirken hata oluştu' },
        { status: 500 }
      )
    }

    // Public URL al
    const {
      data: { publicUrl },
    } = supabase.storage.from('medical-images').getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: fileName,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Dosya yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}
