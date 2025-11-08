'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ChatSession {
  id: string
  title: string
  last_message_at: string
  created_at: string
}

interface ChatHistorySidebarProps {
  patientId: string
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  isOpen: boolean
  onClose: () => void
}

export function ChatHistorySidebar({
  patientId,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  isOpen,
  onClose,
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('last_message_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [patientId, supabase])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Bu konuşmayı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId)

      if (error) throw error

      setSessions(sessions.filter((s) => s.id !== sessionId))

      if (currentSessionId === sessionId) {
        onNewChat()
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Konuşma silinirken hata oluştu')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay for mobile */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

      {/* Sidebar */}
      <div
        className={`
        fixed lg:relative
        top-0 left-0 h-full
        w-80 bg-white border-r border-gray-200
        shadow-xl lg:shadow-none
        z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                Konuşma Geçmişi
              </h3>
              <button
                onClick={onClose}
                className="lg:hidden p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={() => {
                onNewChat()
                onClose()
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Yeni Konuşma</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">Henüz konuşma yok</p>
                <p className="text-gray-400 text-xs mt-1">Yeni bir konuşma başlatın</p>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSessionSelect(session.id)
                    onClose()
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all
                    ${
                      currentSessionId === session.id
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4
                      className={`font-medium text-sm line-clamp-2 flex-1 ${
                        currentSessionId === session.id ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {session.title}
                    </h4>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="ml-2 p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                      title="Sil"
                    >
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <p
                    className={`text-xs ${
                      currentSessionId === session.id ? 'text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    {formatDistanceToNow(new Date(session.last_message_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">Toplam {sessions.length} konuşma</p>
          </div>
        </div>
      </div>
    </>
  )
}
