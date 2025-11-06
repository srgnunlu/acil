'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard/patients')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const specialty = formData.get('specialty') as string
  const institution = formData.get('institution') as string

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  // Profil otomatik oluşturulacak (trigger sayesinde)
  // Ama ek bilgileri güncelleyelim
  if (authData.user) {
    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        specialty: specialty,
        institution: institution,
      })
      .eq('user_id', authData.user.id)
  }

  redirect('/dashboard/patients')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
