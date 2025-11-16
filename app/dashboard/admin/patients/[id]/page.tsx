import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
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

  const { id } = await params

  // Fetch patient
  const { data: patient, error } = await supabase
    .from('patients')
    .select(
      `
      *,
      category:patient_categories(id, name, color, icon),
      workspace:workspaces(id, name, slug),
      organization:organizations(id, name, slug)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !patient) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/patients"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
          <p className="mt-1 text-gray-600">
            {patient.age && `${patient.age} yaş`} {patient.gender && `• ${patient.gender}`}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hasta Bilgileri</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Workspace</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(patient as any).workspace?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Kategori</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(patient as any).category?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Durum</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.workflow_state || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Yatış Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {patient.admission_date
                ? new Date(patient.admission_date).toLocaleDateString('tr-TR')
                : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Taburcu Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {patient.discharge_date ? new Date(patient.discharge_date).toLocaleDateString('tr-TR') : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(patient.created_at).toLocaleDateString('tr-TR')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/patients/${id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Hasta Detayına Git
        </Link>
      </div>
    </div>
  )
}

