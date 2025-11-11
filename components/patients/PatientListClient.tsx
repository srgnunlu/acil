'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentWorkspace } from '@/contexts/WorkspaceContext'
import { PatientListWithBulk } from '@/components/patients/PatientListWithBulk'
import { Loader2 } from 'lucide-react'
import type { Patient } from '@/types'
import { useRealtimePatients } from '@/lib/hooks/useRealtimePatients'

interface PatientListClientProps {
  initialPatients: Patient[]
}

export function PatientListClient({ initialPatients }: PatientListClientProps) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [loading, setLoading] = useState(false)
  const currentWorkspace = useCurrentWorkspace()

  // Real-time patient updates
  useRealtimePatients({
    workspaceId: currentWorkspace?.id || '',
    enabled: !!currentWorkspace,
    onInsert: (patient) => {
      // Yeni hasta eklendiğinde listeye ekle
      setPatients((prev) => [patient, ...prev])
    },
    onUpdate: (patient) => {
      // Hasta güncellendiğinde listeyi güncelle
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)))
    },
    onDelete: (patientId) => {
      // Hasta silindiğinde listeden çıkar
      setPatients((prev) => prev.filter((p) => p.id !== patientId))
    },
  })

  const loadWorkspacePatients = useCallback(async () => {
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
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadWorkspacePatients()
    }
  }, [currentWorkspace?.id, loadWorkspacePatients])

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
