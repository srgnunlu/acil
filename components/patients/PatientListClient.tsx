'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCurrentWorkspace } from '@/contexts/WorkspaceContext'
import { PatientListWithBulk } from '@/components/patients/PatientListWithBulk'
import { Loader2 } from 'lucide-react'
import type { Patient } from '@/types'

interface PatientListClientProps {
  initialPatients: Patient[]
}

export function PatientListClient({ initialPatients }: PatientListClientProps) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [loading, setLoading] = useState(false)
  const currentWorkspace = useCurrentWorkspace()
  const router = useRouter()

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadWorkspacePatients()
    }
  }, [currentWorkspace?.id])

  const loadWorkspacePatients = async () => {
    if (!currentWorkspace?.id) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPatients(data || [])
    } catch (error) {
      console.error('Error loading workspace patients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800">
          Hastaları görüntülemek için lütfen sol üstten bir workspace seçin.
        </p>
      </div>
    )
  }

  return <PatientListWithBulk patients={patients} />
}
