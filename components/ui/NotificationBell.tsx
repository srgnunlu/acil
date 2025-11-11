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

interface Mention {
  id: string
  note_id: string
  mentioned_user_id: string
  is_read: boolean
  created_at: string
  note: {
    id: string
    content: string
    note_type: string
    patient_id: string | null
    author: {
      id: string
      full_name: string
      avatar_url: string | null
    } | null
  }
}

type NotificationTab = 'all' | 'reminders' | 'mentions'

export function NotificationBell() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [mentions, setMentions] = useState<Mention[]>([])
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAllNotifications()
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchAllNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchAllNotifications])

  const fetchAllNotifications = async () => {
    await Promise.all([fetchReminders(), fetchMentions()])
  }

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

  const fetchMentions = async () => {
    try {
      const response = await fetch('/api/mentions/me?is_read=false&limit=10')
      if (response.ok) {
        const data = await response.json()
        setMentions(data.mentions || [])
      }
    } catch (error) {
      console.error('Fetch mentions error:', error)
    }
  }

  const markMentionAsRead = async (mentionId: string, noteId: string) => {
    try {
      const mention = mentions.find((m) => m.id === mentionId)
      const response = await fetch(`/api/sticky-notes/${noteId}/mentions`, {
        method: 'PATCH',
      })
      if (response.ok) {
        // Update local state - mark as read instead of removing
        setMentions(mentions.map((m) => (m.id === mentionId ? { ...m, is_read: true } : m)))
        // Navigate to patient page if patient_id exists
        if (mention?.note.patient_id) {
          router.push(`/dashboard/patients/${mention.note.patient_id}?tab=notes`)
          setIsOpen(false)
        }
      }
    } catch (error) {
      console.error('Mark mention as read error:', error)
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

  const unreadRemindersCount = reminders.filter(
    (r) => new Date(r.scheduled_time) <= new Date()
  ).length
  const unreadMentionsCount = mentions.filter((m) => !m.is_read).length
  const totalUnreadCount = unreadRemindersCount + unreadMentionsCount

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

  const getNoteTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      urgent: '🔴',
      important: '🟡',
      info: '🔵',
      routine: '🟢',
      question: '🟣',
    }
    return icons[type] || '📝'
  }

  // Filter notifications based on active tab
  const filteredReminders = activeTab === 'all' || activeTab === 'reminders' ? reminders : []
  const filteredMentions = activeTab === 'all' || activeTab === 'mentions' ? mentions : []

  const hasNotifications = filteredReminders.length > 0 || filteredMentions.length > 0

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {totalUnreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {totalUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Bildirimler {totalUnreadCount > 0 && `(${totalUnreadCount})`}
              </h3>

              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    activeTab === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tümü ({reminders.length + mentions.length})
                </button>
                {unreadRemindersCount > 0 && (
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      activeTab === 'reminders'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Hatırlatmalar ({unreadRemindersCount})
                  </button>
                )}
                {unreadMentionsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('mentions')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      activeTab === 'mentions'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Etiketlemeler ({unreadMentionsCount})
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!hasNotifications ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔔</div>
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {/* Mentions */}
                  {filteredMentions.map((mention) => (
                    <div
                      key={mention.id}
                      className={`p-4 hover:bg-gray-50 transition ${
                        !mention.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getNoteTypeIcon(mention.note.note_type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {mention.note.author?.avatar_url ? (
                              <img
                                src={mention.note.author.avatar_url}
                                alt={mention.note.author.full_name || ''}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                {mention.note.author?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {mention.note.author?.full_name || 'Bilinmeyen'}
                            </span>
                            <span className="text-xs text-gray-500">sizi etiketledi</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {mention.note.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                            {mention.note.content.length > 100 ? '...' : ''}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(mention.created_at), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </p>
                            {mention.note.patient_id && (
                              <button
                                onClick={() => markMentionAsRead(mention.id, mention.note_id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Hasta sayfasına git →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Reminders */}
                  {filteredReminders.map((reminder) => {
                    const isPast = new Date(reminder.scheduled_time) <= new Date()
                    return (
                      <div
                        key={reminder.id}
                        className={`p-4 hover:bg-gray-50 transition ${isPast ? 'bg-blue-50' : ''}`}
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
                                  {formatDistanceToNow(new Date(reminder.scheduled_time), {
                                    addSuffix: true,
                                    locale: tr,
                                  })}
                                </span>
                              ) : (
                                formatDistanceToNow(new Date(reminder.scheduled_time), {
                                  addSuffix: true,
                                  locale: tr,
                                })
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
          </div>
        </>
      )}
    </div>
  )
}
