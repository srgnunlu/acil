import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupContent } from './SetupContent'

export default async function SetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Kullanıcının workspace'i var mı kontrol et
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single()

  // Workspace varsa dashboard'a yönlendir
  if (membership) {
    redirect('/dashboard/patients')
  }

  return <SetupContent />
}
