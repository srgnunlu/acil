'use client'

/**
 * NotificationCenter Component
 * Phase 6: Comprehensive Notification System
 *
 * A comprehensive notification center with:
 * - Real-time notifications
 * - Filtering by type and severity
 * - Mark as read/unread
 * - Delete notifications
 * - Notification stats
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications'
import {
  getNotificationIcon,
  getSeverityBadgeClass,
  formatNotificationTime,
} from '@/lib/notifications/notification-helpers'
import { NotificationService } from '@/lib/notifications/notification-service'
import type { Notification, NotificationSeverity, NotificationType } from '@/types/notification.types'
import toast from 'react-hot-toast'

interface NotificationCenterProps {
  userId: string
  enabled?: boolean
}

type FilterType = 'all' | 'unread' | NotificationSeverity | NotificationType

export function NotificationCenter({ userId, enabled = true }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const router = useRouter()

  const { notifications, unreadCount, status, error, markAsRead, markAllAsRead, clearNotifications } =
    useRealtimeNotifications({
      userId,
      enabled,
      onNotification: (notification) => {
        // Show toast for new notifications
        const icon = getNotificationIcon(notification.type)
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{notification.title}</p>
                {notification.message && (
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  handleNotificationClick(notification)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
              >
                Görüntüle →
              </button>
            </div>
          ),
          {
            duration: notification.severity === 'critical' ? 10000 : 5000,
            position: 'top-right',
            className:
              notification.severity === 'critical'
                ? 'border-l-4 border-red-500'
                : notification.severity === 'high'
                  ? 'border-l-4 border-orange-500'
                  : '',
          }
        )
      },
    })

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url)
      setIsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('Tüm bildirimler okundu olarak işaretlendi')
    } catch (error) {
      toast.error('Bildirimler işaretlenirken hata oluştu')
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Tüm bildirimleri silmek istediğinize emin misiniz?')) {
      try {
        await NotificationService.clearAll()
        clearNotifications()
        toast.success('Tüm bildirimler silindi')
      } catch (error) {
        toast.error('Bildirimler silinirken hata oluştu')
      }
    }
  }

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await NotificationService.deleteNotification(notificationId)
      clearNotifications()
      // Refresh notifications
      const result = await NotificationService.getNotifications()
      if (result.success && result.data) {
        // Update local state would happen via realtime
      }
      toast.success('Bildirim silindi')
    } catch (error) {
      toast.error('Bildirim silinirken hata oluştu')
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.is_read
    if (['critical', 'high', 'medium', 'low', 'info'].includes(filter)) {
      return n.severity === filter
    }
    return n.type === filter
  })

  // Get severity counts
  const severityCounts = {
    critical: notifications.filter((n) => n.severity === 'critical' && !n.is_read).length,
    high: notifications.filter((n) => n.severity === 'high' && !n.is_read).length,
    medium: notifications.filter((n) => n.severity === 'medium' && !n.is_read).length,
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Status indicator */}
        {status === 'connecting' && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        )}
        {status === 'error' && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Bildirimler</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    {unreadCount} okunmamış
                  </span>
                )}
              </div>

              {/* Quick severity filters */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tümü ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Okunmamış ({unreadCount})
                </button>
                {severityCounts.critical > 0 && (
                  <button
                    onClick={() => setFilter('critical')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      filter === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    🔴 {severityCounts.critical}
                  </button>
                )}
              </div>

              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Tümünü okundu işaretle
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-800 font-medium ml-auto"
                  >
                    Tümünü sil
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {error && (
                <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">Bildirimler yüklenirken hata oluştu</p>
                </div>
              )}

              {!error && filteredNotifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-5xl mb-3">🔔</div>
                  <p className="font-medium">
                    {filter === 'all' ? 'Henüz bildirim yok' : 'Bu filtreye uygun bildirim yok'}
                  </p>
                </div>
              )}

              {!error && filteredNotifications.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className={`text-sm font-medium ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>

                          {notification.message && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatNotificationTime(notification.created_at)}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityBadgeClass(notification.severity)}`}
                              >
                                {notification.severity}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="text-gray-400 hover:text-red-600 transition"
                              aria-label="Sil"
                            >
                              <svg
                                className="w-4 h-4"
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    router.push('/dashboard/notifications')
                    setIsOpen(false)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tüm bildirimleri görüntüle →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
