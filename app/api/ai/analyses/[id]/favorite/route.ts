import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isFavorite: false })
    }

    const { data, error } = await supabase
      .from('analysis_favorites')
      .select('id')
      .eq('analysis_id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ isFavorite: !!data })
  } catch (error) {
    console.error('Error checking favorite:', error)
    return NextResponse.json({ isFavorite: false })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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
      .from('analysis_favorites')
      .insert({
        analysis_id: id,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Bu analiz zaten favorilerde' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ favorite: data })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'Favori eklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

    const { error } = await supabase
      .from('analysis_favorites')
      .delete()
      .eq('analysis_id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Favori kaldırılırken hata oluştu' },
      { status: 500 }
    )
  }
}
