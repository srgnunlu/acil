'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Brain,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PatientStatusBadge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type PatientStatus = 'active' | 'discharged' | 'consultation' | 'critical'

interface Patient {
  id: string
  name: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  status: PatientStatus
  riskScore?: number // 0-100
  admissionDate: string
  lastActivity?: string
  hasAIAnalysis?: boolean
  hasChatMessages?: boolean
  urgency?: 'low' | 'medium' | 'high' | 'critical'
}

interface PatientQuickGridProps {
  patients: Patient[]
  maxDisplay?: number
  onPatientClick?: (patientId: string) => void
}

type FilterOption = 'all' | 'critical' | 'active' | 'recent'

export function PatientQuickGrid({
  patients,
  maxDisplay = 6,
  onPatientClick,
}: PatientQuickGridProps) {
  const [filter, setFilter] = useState<FilterOption>('all')

  // Apply filters
  const filteredPatients = patients.filter((patient) => {
    if (filter === 'all') return true
    if (filter === 'critical') return patient.urgency === 'critical' || patient.riskScore! > 70
    if (filter === 'active') return patient.status === 'active'
    if (filter === 'recent') {
      const admissionDate = new Date(patient.admissionDate)
      const daysSinceAdmission =
        (Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceAdmission < 1
    }
    return true
  })

  const displayedPatients = filteredPatients.slice(0, maxDisplay)

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get avatar color based on risk score
  const getAvatarColor = (riskScore?: number) => {
    if (!riskScore) return 'bg-blue-100 text-blue-700'
    if (riskScore > 70) return 'bg-red-100 text-red-700'
    if (riskScore > 40) return 'bg-amber-100 text-amber-700'
    return 'bg-green-100 text-green-700'
  }

  // Get risk badge
  const getRiskBadge = (riskScore?: number) => {
    if (!riskScore) return null
    if (riskScore > 70)
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
          Yüksek Risk
        </span>
      )
    if (riskScore > 40)
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
          Orta Risk
        </span>
      )
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
        Düşük Risk
      </span>
    )
  }

  if (patients.length === 0) {
    return (
      <Card variant="elevated" className="bg-gray-50">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium">Henüz hasta eklenmedi</p>
          <p className="text-sm mt-1">Yeni hasta eklemek için butona tıklayın</p>
          <Link href="/dashboard/patients">
            <Button variant="default" size="sm" className="mt-4">
              Hasta Ekle
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all' as FilterOption, label: 'Tümü', count: patients.length },
          {
            value: 'critical' as FilterOption,
            label: 'Kritik',
            count: patients.filter((p) => p.urgency === 'critical' || p.riskScore! > 70).length,
          },
          {
            value: 'active' as FilterOption,
            label: 'Aktif',
            count: patients.filter((p) => p.status === 'active').length,
          },
          {
            value: 'recent' as FilterOption,
            label: 'Bugün',
            count: patients.filter((p) => {
              const daysSince = (Date.now() - new Date(p.admissionDate).getTime()) / (1000 * 60 * 60 * 24)
              return daysSince < 1
            }).length,
          },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
              transition-all
              ${
                filter === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {tab.label}
            <span className="ml-2 opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Patient Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {displayedPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card
                variant="elevated"
                interactive
                className="group relative overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => onPatientClick?.(patient.id)}
              >
                {/* Risk indicator bar */}
                {patient.riskScore && patient.riskScore > 40 && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      patient.riskScore > 70
                        ? 'bg-red-500'
                        : patient.riskScore > 40
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                  />
                )}

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getAvatarColor(patient.riskScore)}`}
                    >
                      {getInitials(patient.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {patient.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {patient.age && `${patient.age} yaş`}
                        {patient.gender && patient.age && ' • '}
                        {patient.gender &&
                          (patient.gender === 'male'
                            ? 'Erkek'
                            : patient.gender === 'female'
                              ? 'Kadın'
                              : 'Diğer')}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <PatientStatusBadge
                      status={patient.status as any}
                      compact
                    />
                  </div>

                  {/* Risk Score */}
                  {patient.riskScore !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">AI Risk Skoru</span>
                        <span className="font-bold text-gray-900">{patient.riskScore}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${patient.riskScore}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className={`h-full rounded-full ${
                            patient.riskScore > 70
                              ? 'bg-red-500'
                              : patient.riskScore > 40
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(new Date(patient.admissionDate), 'dd MMM', { locale: tr })}
                      </span>
                    </div>
                    {patient.lastActivity && (
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>
                          {format(new Date(patient.lastActivity), 'HH:mm', { locale: tr })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ExternalLink className="w-3 h-3" />}
                        className="w-full text-xs"
                      >
                        Aç
                      </Button>
                    </Link>
                    {patient.hasAIAnalysis && (
                      <button
                        className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        title="AI Analizi Mevcut"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/dashboard/patients/${patient.id}#ai-analysis`
                        }}
                      >
                        <Brain className="w-4 h-4 text-purple-600" />
                      </button>
                    )}
                    {patient.hasChatMessages && (
                      <button
                        className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Mesajlar"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/dashboard/patients/${patient.id}#chat`
                        }}
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Link */}
      {filteredPatients.length > maxDisplay && (
        <div className="text-center pt-2">
          <Link href="/dashboard/patients">
            <Button variant="outline" size="sm" rightIcon={<TrendingUp className="w-4 h-4" />}>
              {filteredPatients.length - maxDisplay} Hasta Daha Göster
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
