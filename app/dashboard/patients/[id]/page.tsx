import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PatientTabs } from '@/components/patients/PatientTabs'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

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

  // Hasta verilerini al
  const { data: patientData } = await supabase
    .from('patient_data')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  // Tetkikleri al
  const { data: tests } = await supabase
    .from('patient_tests')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  // AI analizlerini al
  const { data: analyses } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      discharged: 'bg-gray-100 text-gray-800',
      consultation: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      active: 'Aktif',
      discharged: 'Taburcu',
      consultation: 'Konsültasyon',
    }
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/patients"
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
        >
          ← Hasta Listesine Dön
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {patient.name}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              {patient.age && <span>{patient.age} yaş</span>}
              {patient.gender && <span>• {patient.gender}</span>}
              <span>
                • {new Date(patient.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
          <div>{getStatusBadge(patient.status)}</div>
        </div>
      </div>

      {/* Tabs */}
      <PatientTabs
        patientId={patient.id}
        patientName={patient.name}
        patientData={patientData || []}
        tests={tests || []}
        analyses={analyses || []}
      />
    </div>
  )
}
