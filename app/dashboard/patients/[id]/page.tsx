import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { ExportButton } from '@/components/patients/ExportButton'
import { PatientActions } from '@/components/patients/PatientActions'

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

  // Kullanıcının aktif workspace'ini bul (WorkspaceContext'ten almak yerine direkt sorgu)
  // Önce hastanın workspace'ini bul, sonra kullanıcının o workspace'te üye olup olmadığını kontrol et
  const { data: patientCheck, error: patientCheckError } = await supabase
    .from('patients')
    .select('workspace_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (patientCheckError || !patientCheck) {
    console.error('[PatientDetailPage] Error checking patient:', {
      code: patientCheckError?.code,
      message: patientCheckError?.message,
      details: patientCheckError?.details,
    })
    notFound()
  }

  // Kullanıcının bu workspace'te üye olup olmadığını kontrol et
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', patientCheck.workspace_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (membershipError || !membership) {
    console.error('[PatientDetailPage] User is not a member of patient workspace:', {
      workspaceId: patientCheck.workspace_id,
      userId: user.id,
      error: membershipError,
    })
    notFound()
  }

  // Hastayı al (category join'i olmadan önce deneyelim)
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', membership.workspace_id)
    .is('deleted_at', null)
    .single()

  if (error || !patient) {
    console.error('[PatientDetailPage] Error fetching patient:', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      patientId: id,
      workspaceId: membership.workspace_id,
    })
    notFound()
  }

  // Category bilgisini ayrı bir query ile çek (RLS policy sorunlarını önlemek için)
  let category = null
  if (patient.category_id) {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('patient_categories')
        .select('slug, name, color')
        .eq('id', patient.category_id)
        .eq('workspace_id', membership.workspace_id)
        .single()

      if (!categoryError && categoryData) {
        category = categoryData
      } else if (categoryError) {
        console.warn(
          '[PatientDetailPage] Category fetch error (non-critical):',
          categoryError.message
        )
      }
    } catch (categoryErr) {
      console.warn('[PatientDetailPage] Category fetch exception (non-critical):', categoryErr)
    }
  }

  // Category slug'ını al
  const categorySlug = (category as { slug?: string })?.slug || 'active'

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

  const getStatusBadge = (slug: string) => {
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
          badges[slug as keyof typeof badges] || badges.active
        }`}
      >
        {labels[slug as keyof typeof labels] || slug}
      </span>
    )
  }

  // Hasta adının baş harflerini al (Avatar için)
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Yatış süresini hesapla
  const getAdmissionDuration = (createdAt: string) => {
    const now = new Date()
    const admission = new Date(createdAt)
    const diffMs = now.getTime() - admission.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24)
      return `${days} gün ${diffHours % 24} saat`
    }
    return `${diffHours} saat ${diffMins} dakika`
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition">
            Ana Sayfa
          </Link>
          <span>›</span>
          <Link href="/dashboard/patients" className="hover:text-blue-600 transition">
            Hastalar
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{patient.name}</span>
        </nav>
      </div>

      {/* Enhanced Patient Header Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          {/* Left Section: Avatar & Info */}
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials(patient.name)}
              </div>
              {/* Live Status Indicator */}
              {categorySlug === 'active' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse"></div>
              )}
            </div>

            {/* Patient Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
                {getStatusBadge(categorySlug)}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {/* Age & Gender */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">
                    {patient.age || '-'} yaş · {patient.gender || '-'}
                  </span>
                </div>

                {/* Admission Date */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-500">Kayıt Tarihi</div>
                    <div className="font-medium">
                      {new Date(patient.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-500">Yatış Süresi</div>
                    <div className="font-medium">{getAdmissionDuration(patient.created_at)}</div>
                  </div>
                </div>

                {/* Data Count */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-500">Toplam Kayıt</div>
                    <div className="font-medium">
                      {(patientData?.length || 0) + (tests?.length || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex items-center space-x-3">
            <ExportButton patientId={patient.id} patientName={patient.name} />
            <PatientActions patientId={patient.id} patientName={patient.name} />
          </div>
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
