import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { noteId } = await context.params
    const { note } = await request.json()

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Not içeriği boş olamaz' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('analysis_notes')
      .update({ note: note.trim() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Not güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { noteId } = await context.params
    const supabase = await createClient()

    const { error } = await supabase
      .from('analysis_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Not silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
