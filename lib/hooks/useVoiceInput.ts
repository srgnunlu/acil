'use client'

// Voice Input Hook (Speech Recognition)
// Phase 12 - PWA Enhancement - Mobile Features

import { useState, useCallback, useRef, useEffect } from 'react'

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition?: {
      new (): SpeechRecognition
    }
  }
}

export interface VoiceInputOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export function useVoiceInput(options: VoiceInputOptions = {}) {
  const {
    lang = 'tr-TR',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Speech Recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = lang
        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.maxAlternatives = 1

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimText = ''
          let finalText = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcriptText = result[0].transcript

            if (result.isFinal) {
              finalText += transcriptText
            } else {
              interimText += transcriptText
            }
          }

          if (finalText) {
            setTranscript((prev) => prev + finalText)
            onResult?.(finalText, true)
          }

          if (interimText) {
            setInterimTranscript(interimText)
            onResult?.(interimText, false)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errorMessage = event.error || 'Ses tanıma hatası'
          setError(errorMessage)
          onError?.(errorMessage)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimTranscript('')
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [lang, continuous, interimResults, onResult, onError])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Ses tanıma desteklenmiyor')
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ses tanıma başlatılamadı'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      setInterimTranscript('')
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
