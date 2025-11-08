'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import {
  Copy,
  Check,
  RefreshCw,
  Download,
  Search,
  X,
  Sparkles,
  MessageCircle,
  Send,
  Loader2,
} from 'lucide-react'

interface PatientChatProps {
  patientId: string
  patientName: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function PatientChat({ patientId, patientName }: PatientChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage, scrollToBottom])

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Arama aç
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      // Escape: Arama kapat veya input temizle
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false)
          setSearchQuery('')
        } else if (input) {
          setInput('')
        }
      }
      // Ctrl/Cmd + /: Input'a focus
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, input])

  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (error) throw error

        setMessages(data || [])
        setCurrentSessionId(sessionId)
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    },
    [supabase]
  )

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      loadSessionMessages(sessionId)
    },
    [loadSessionMessages]
  )

  const handleNewChat = useCallback(() => {
    setMessages([])
    setCurrentSessionId(null)
    setStreamingMessage('')
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent, messageToSend?: string) => {
      e.preventDefault()

      const userMessage = messageToSend || input.trim()
      if (!userMessage || loading) return

      setInput('')
      setLoading(true)
      setStreamingMessage('')

      // Optimistic UI update
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, tempUserMessage])

      try {
        const response = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId,
            message: userMessage,
            sessionId: currentSessionId,
          }),
        })

        if (!response.ok) {
          throw new Error('Yanıt alınamadı')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulatedResponse = ''
        let newSessionId = currentSessionId

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.type === 'session') {
                    newSessionId = parsed.sessionId
                    if (!currentSessionId) {
                      setCurrentSessionId(newSessionId)
                    }
                  } else if (parsed.type === 'content') {
                    accumulatedResponse += parsed.content
                    setStreamingMessage(accumulatedResponse)
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }

        // AI yanıtını messages'a ekle
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: accumulatedResponse,
          created_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
        setStreamingMessage('')
      } catch (error: unknown) {
        const errorText = error instanceof Error ? error.message : 'Bir hata oluştu'
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Hata: ${errorText}`,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setStreamingMessage('')
      } finally {
        setLoading(false)
      }
    },
    [input, loading, patientId, currentSessionId]
  )

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }, [])

  const handleRegenerate = useCallback(
    (messageIndex: number) => {
      if (messageIndex < 1) return

      // Son AI yanıtını sil ve önceki kullanıcı mesajını tekrar gönder
      const userMessage = messages[messageIndex - 1]
      if (userMessage && userMessage.role === 'user') {
        setMessages((prev) => prev.slice(0, messageIndex))
        handleSubmit(new Event('submit') as any, userMessage.content)
      }
    },
    [messages, handleSubmit]
  )

  const handleExport = useCallback(() => {
    const content = messages
      .map((msg) => {
        const timestamp = format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: tr })
        const role = msg.role === 'user' ? 'Kullanıcı' : 'AI Asistan'
        return `[${timestamp}] ${role}:\n${msg.content}\n`
      })
      .join('\n---\n\n')

    const blob = new Blob([`${patientName} - Konuşma Geçmişi\n\n${content}`], {
      type: 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${patientName}-konusma-${format(new Date(), 'dd-MM-yyyy')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [messages, patientName])

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    return messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [messages, searchQuery])

  const suggestedQuestions = useMemo(
    () => [
      {
        text: 'Bu hastanın mevcut risk faktörleri nelerdir?',
        icon: <Sparkles className="w-4 h-4" />,
      },
      {
        text: 'Hangi tetkikler öncelikli olarak istenmeli?',
        icon: <MessageCircle className="w-4 h-4" />,
      },
      {
        text: 'Ayırıcı tanılarda nelere dikkat etmeliyim?',
        icon: <Sparkles className="w-4 h-4" />,
      },
      {
        text: 'Tedavi planında hangi ilaçları önerirsin?',
        icon: <MessageCircle className="w-4 h-4" />,
      },
      {
        text: 'Konsültasyon gerekli mi?',
        icon: <Sparkles className="w-4 h-4" />,
      },
    ],
    []
  )

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden backdrop-blur-sm">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        patientId={patientId}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-4 flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95"
                title="Konuşma Geçmişi"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg truncate">AI Klinik Asistan</h3>
                <p className="text-xs text-blue-100 truncate">Hasta: {patientName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 active:scale-95"
                title="Ara (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={handleExport}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 active:scale-95"
                  title="Konuşmayı İndir"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <span className="hidden sm:flex px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-semibold items-center shadow-md">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                Aktif
              </span>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="mt-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mesajlarda ara..."
                className="w-full px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {filteredMessages.length === 0 && !streamingMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {patientName} için AI Asistan
              </h3>
              <p className="text-slate-600 mb-8 max-w-md text-sm md:text-base">
                Bu hasta hakkında soru sorabilir, tanı ve tedavi önerileri alabilirsiniz. AI asistan
                hasta verilerinizi analiz ederek size yardımcı olur.
              </p>

              <div className="w-full max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-700 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                    Hızlı Başlangıç Soruları
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(question.text)}
                      className="group text-left px-4 py-3 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl text-sm text-slate-700 transition-all border border-slate-200 hover:border-blue-300 hover:shadow-lg flex items-center space-x-3 h-fit"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                        {question.icon}
                      </div>
                      <span className="flex-1 break-words line-clamp-3 font-medium">
                        {question.text}
                      </span>
                      <svg
                        className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {filteredMessages.map((message, idx) => (
                <div
                  key={message.id || idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`group relative max-w-[85%] md:max-w-[75%] rounded-2xl shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white'
                        : 'bg-white border border-slate-200/50 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start space-x-3 px-5 py-4">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                          message.role === 'user'
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <svg
                            className="w-5 h-5 text-white"
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
                        ) : (
                          <Sparkles className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {message.role === 'assistant' ? (
                          <MarkdownMessage content={message.content} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm md:text-base">
                            {message.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                          <p
                            className={`text-xs ${message.role === 'user' ? 'text-white/70' : 'text-slate-500'}`}
                            title={format(new Date(message.created_at), 'dd MMMM yyyy, HH:mm', {
                              locale: tr,
                            })}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </p>
                          <div className="flex items-center space-x-2">
                            {message.role === 'assistant' && (
                              <>
                                <button
                                  onClick={() => handleCopy(message.content, message.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-lg"
                                  title="Kopyala"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-slate-500" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRegenerate(idx)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-lg"
                                  title="Yeniden Oluştur"
                                >
                                  <RefreshCw className="w-4 h-4 text-slate-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {streamingMessage && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="group relative max-w-[85%] md:max-w-[75%] rounded-2xl shadow-lg bg-white border border-slate-200/50 text-slate-900">
                    <div className="flex items-start space-x-3 px-5 py-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <MarkdownMessage content={streamingMessage} />
                        <div className="flex items-center mt-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="ml-2 text-xs text-slate-500">AI yazıyor...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading && !streamingMessage && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-5 py-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-600 font-medium">AI düşünüyor...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-blue-200/50 bg-white/80 backdrop-blur-md p-3 md:p-4 flex-shrink-0 shadow-lg">
          <form onSubmit={handleSubmit} className="flex space-x-2 md:space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hastanız hakkında bir soru sorun... (Shift+Enter: yeni satır)"
              disabled={loading}
              className="flex-1 min-w-0 px-4 py-3 md:py-3.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 md:px-7 py-3 md:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center space-x-2 flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span className="hidden md:inline">Gönderiliyor</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden md:inline">Gönder</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <svg
              className="w-4 h-4 text-amber-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-center">
              AI asistanı hasta verilerinizi kullanarak size yardımcı olur. Nihai kararlar hekim
              sorumluluğundadır.
            </p>
          </div>

          <div className="mt-2 text-center text-xs text-slate-400">
            Kısayollar: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Ctrl+K</kbd> Ara ·{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Esc</kbd> Temizle ·{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Ctrl+/</kbd> Odaklan
          </div>
        </div>
      </div>
    </div>
  )
}
