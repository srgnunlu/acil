import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: notes, error } = await supabase
      .from('analysis_notes')
      .select('*')
      .eq('analysis_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Notlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { note } = await request.json()

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Not içeriği boş olamaz' },
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

    const { data, error } = await supabase
      .from('analysis_notes')
      .insert({
        analysis_id: id,
        user_id: user.id,
        note: note.trim(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Not eklenirken hata oluştu' },
      { status: 500 }
    )
  }
}
