import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminStickyNotesPage({
  searchParams,
}: {
  searchParams: { workspace_id?: string; patient_id?: string; page?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin access
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])

  if (!memberships || memberships.length === 0) {
    redirect('/dashboard')
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Fetch sticky notes
  let query = supabase
    .from('sticky_notes')
    .select(
      `
      *,
      author:profiles!sticky_notes_author_id_fkey(user_id, full_name),
      patient:patients(id, name),
      workspace:workspaces(id, name, slug)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.workspace_id) {
    query = query.eq('workspace_id', searchParams.workspace_id)
  }

  if (searchParams.patient_id) {
    query = query.eq('patient_id', searchParams.patient_id)
  }

  const { data: notes, count } = await query

  // Get statistics
  const { count: totalNotes } = await supabase
    .from('sticky_notes')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: pinnedNotes } = await supabase
    .from('sticky_notes')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('is_pinned', true)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sticky Notes Yönetimi</h1>
        <p className="mt-2 text-gray-600">Tüm sticky notes'ları görüntüleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Note</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalNotes || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Sabitlenmiş</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{pinnedNotes || 0}</p>
        </div>
      </div>

      {/* Notes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İçerik
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yazar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hasta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <tr key={note.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-2">{note.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(note as any).author?.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(note as any).patient?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {note.note_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Note bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

