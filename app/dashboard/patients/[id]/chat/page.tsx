import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PatientChat } from '@/components/patients/PatientChat'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientChatPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Hastayı al
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !patient) {
    notFound()
  }

  // Chat mesajlarını al
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {patient.name} - AI Chat Asistanı
        </h1>
        <p className="text-gray-600">
          Bu hasta hakkında sorular sorun ve anlık yanıtlar alın
        </p>
      </div>

      <PatientChat
        patientId={patient.id}
        patientName={patient.name}
        initialMessages={messages || []}
      />
    </div>
  )
}
