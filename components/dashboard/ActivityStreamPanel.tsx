'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useActivityStream,
  getActivityIcon,
  getActivityColor,
  ActivityType,
} from '@/lib/hooks/useActivityStream'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Filter, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'

interface ActivityStreamPanelProps {
  workspaceId: string | null
  maxDisplay?: number
}

const activityTypeLabels: Record<ActivityType, string> = {
  patient_created: 'Hasta Eklendi',
  patient_updated: 'Hasta Güncellendi',
  ai_analysis_completed: 'AI Analizi',
  test_added: 'Test Eklendi',
  note_created: 'Not Eklendi',
  mention: 'Mention',
  reminder_created: 'Hatırlatma',
  assignment_changed: 'Atama Değişti',
  category_changed: 'Kategori Değişti',
}

export function ActivityStreamPanel({ workspaceId, maxDisplay = 10 }: ActivityStreamPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const { activities, isLoading, refetch } = useActivityStream({
    workspaceId,
    limit: 50,
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
  })

  const displayedActivities = activities.slice(0, maxDisplay)

  const toggleFilter = (type: ActivityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  if (isLoading) {
    return (
      <Card variant="elevated">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="elevated"
      header={
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Canlı Aktivite Akışı</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtre
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => refetch()}
            >
              Yenile
            </Button>
          </div>
        </div>
      }
    >
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 pb-4 border-b border-gray-200"
          >
            <div className="flex flex-wrap gap-2">
              {Object.entries(activityTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type as ActivityType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedTypes.includes(type as ActivityType)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getActivityIcon(type as ActivityType)} {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity List */}
      {displayedActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Henüz aktivite yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedActivities.map((activity, index) => {
              const color = getActivityColor(activity.type)
              const icon = getActivityIcon(activity.type)

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-${color}-100`}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.userName && (
                        <span className="text-xs text-gray-500">{activity.userName}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Link to patient */}
                  {activity.patientId && (
                    <Link
                      href={`/dashboard/patients/${activity.patientId}`}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Görüntüle →
                      </Button>
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Show more */}
      {activities.length > maxDisplay && (
        <div className="text-center pt-4 border-t border-gray-200 mt-4">
          <p className="text-sm text-gray-500">
            {activities.length - maxDisplay} aktivite daha
          </p>
        </div>
      )}
    </Card>
  )
}
