'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Reminder {
  id: string
  patient_id: string
  reminder_type: string
  scheduled_time: string
  status: string
  patients: {
    id: string
    name: string
  }
}

export function NotificationBell() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchReminders()
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchReminders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders')
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders || [])
      }
    } catch (error) {
      console.error('Fetch reminders error:', error)
    }
  }

  const dismissReminder = async (reminderId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId,
          status: 'dismissed',
        }),
      })

      if (response.ok) {
        setReminders(reminders.filter((r) => r.id !== reminderId))
      }
    } catch (error) {
      console.error('Dismiss reminder error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPatient = (patientId: string) => {
    router.push(`/dashboard/patients/${patientId}`)
    setIsOpen(false)
  }

  const unreadCount = reminders.filter(
    (r) => new Date(r.scheduled_time) <= new Date()
  ).length

  const getReminderIcon = (type: string) => {
    const icons: Record<string, string> = {
      lab_result: '🔬',
      ekg_result: '❤️',
      xray_result: '🔬',
      consultation: '👨‍⚕️',
      vital_signs: '❤️',
      medication: '💊',
      follow_up: '📋',
    }
    return icons[type] || '🔔'
  }

  const getReminderLabel = (type: string) => {
    const labels: Record<string, string> = {
      lab_result: 'Laboratuvar Sonucu',
      ekg_result: 'EKG Sonucu',
      xray_result: 'Radyoloji Sonucu',
      consultation: 'Konsültasyon',
      vital_signs: 'Vital Bulgular',
      medication: 'İlaç',
      follow_up: 'Takip',
    }
    return labels[type] || type
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Bildirimler {unreadCount > 0 && `(${unreadCount})`}
              </h3>
            </div>

            {reminders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reminders.map((reminder) => {
                  const isPast = new Date(reminder.scheduled_time) <= new Date()
                  return (
                    <div
                      key={reminder.id}
                      className={`p-4 hover:bg-gray-50 transition ${
                        isPast ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">
                          {getReminderIcon(reminder.reminder_type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => goToPatient(reminder.patient_id)}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                          >
                            {reminder.patients.name}
                          </button>
                          <p className="text-sm text-gray-600">
                            {getReminderLabel(reminder.reminder_type)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {isPast ? (
                              <span className="text-red-600 font-medium">
                                {formatDistanceToNow(
                                  new Date(reminder.scheduled_time),
                                  { addSuffix: true, locale: tr }
                                )}
                              </span>
                            ) : (
                              formatDistanceToNow(
                                new Date(reminder.scheduled_time),
                                { addSuffix: true, locale: tr }
                              )
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => dismissReminder(reminder.id)}
                          disabled={loading}
                          className="text-gray-400 hover:text-gray-600 transition"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
