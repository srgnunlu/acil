'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, User, Bot } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'

interface PatientChatProps {
  patientId: string
  patientName: string
}

/**
 * Patient Chat Component
 */
export function PatientChat({ patientId, patientName }: PatientChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [patientId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
      patient_id: patientId,
      user_id: (await supabase.auth.getUser()).data.user?.id || '',
      role: 'user',
      content: input.trim(),
    }

    setIsLoading(true)
    setInput('')

    try {
      // Insert user message
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert(userMessage)
        .select()
        .single()

      if (insertError) throw insertError

      // Get AI response
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          message: input.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('AI response failed')
      }

      const aiResponse = await response.json()

      // Insert AI message
      const { error: aiInsertError } = await supabase
        .from('chat_messages')
        .insert({
          patient_id: patientId,
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          role: 'assistant',
          content: aiResponse.message,
        })
        .select()
        .single()

      if (aiInsertError) throw aiInsertError

      // Refresh messages
      await loadMessages()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Mesaj gönderilemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedQuestions = [
    'Bu hastanın mevcut risk faktörleri nelerdir?',
    'Hangi tetkikleri önerirsiniz?',
    'Tedavi algoritması nasıl olmalı?',
    'Konsültasyon gerekli mi?',
    'Hastayı taburcu edebilir miyiz?',
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">{patientName} - AI Asistan</h3>
            <p className="text-sm opacity-90">Hasta verileriyle entegre sohbet</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Henüz mesaj yok</p>
            <p className="text-sm">AI asistanına hastayla ilgili sorular sorun</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>

              {/* Message */}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                
                {/* Timestamp */}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Örnek Sorular:
          </p>
          <div className="space-y-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hastayla ilgili sorunuzu yazın..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="sr-only">Yükleniyor...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="sr-only">Gönder</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scroll to bottom indicator */}
      <div ref={messagesEndRef} />
    </div>
  )
}
