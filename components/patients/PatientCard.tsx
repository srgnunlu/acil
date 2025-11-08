'use client'

import { memo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MoreHorizontal, Calendar, User } from 'lucide-react'
import type { Patient } from '@/types'

interface PatientCardProps {
  patient: Patient
  onUpdate?: (patientId: string, updates: Partial<Patient>) => void
  onAdd?: (patient: Patient) => void
}

/**
 * Memoized patient card component
 */
export const PatientCard = memo<PatientCardProps>(({ patient, onUpdate, onAdd }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'discharged':
        return 'bg-gray-100 text-gray-800'
      case 'consultation':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'discharged':
        return 'Taburcu'
      case 'consultation':
        return 'Konsültasyon'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link
            href={`/dashboard/patients/${patient.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {patient.name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {patient.age} yaş, {patient.gender}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
            {getStatusText(patient.status)}
          </span>
          
          {/* Actions dropdown */}
          <div className="relative group">
            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Detayları Gör
              </Link>
              <button
                onClick={() => onUpdate?.(patient.id, { status: 'consultation' })}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Konsültasyona Gönder
              </button>
              <button
                onClick={() => onUpdate?.(patient.id, { status: 'discharged' })}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Taburcu Et
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes - Patient interface'de notes yok, kaldırıldı */}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(patient.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
        </div>
        
        {/* Quick stats - Gelecekte eklenebilir */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Kayıtlı
          </span>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.patient.id === nextProps.patient.id &&
    prevProps.patient.name === nextProps.patient.name &&
    prevProps.patient.status === nextProps.patient.status &&
    prevProps.patient.updated_at === nextProps.patient.updated_at
  )
})

PatientCard.displayName = 'PatientCard'

// Default export da ekleyelim TypeScript için
export default PatientCard