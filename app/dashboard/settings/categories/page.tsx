import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import CategoryList from '@/components/categories/CategoryList'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Cookie'den current workspace ID'yi al
  const cookieStore = await cookies()
  const cookieWorkspaceId = cookieStore.get('currentWorkspaceId')?.value

  // Kullanıcının workspace'lerini al
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (!memberships || memberships.length === 0) {
    redirect('/setup')
  }

  const workspaceIds = memberships.map((m) => m.workspace_id)
  const currentWorkspaceId =
    cookieWorkspaceId && workspaceIds.includes(cookieWorkspaceId)
      ? cookieWorkspaceId
      : workspaceIds[0]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hasta Kategorileri</h1>
        <p className="text-gray-600 mt-2">
          Workspace&apos;iniz için hasta kategorilerini yönetin. Kategoriler hastaları organize
          etmenize yardımcı olur.
        </p>
      </div>

      <CategoryList workspaceId={currentWorkspaceId} />
    </div>
  )
}
