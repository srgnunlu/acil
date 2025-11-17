/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceInput } from '../useVoiceInput'

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  maxAlternatives = 1

  onresult: any = null
  onerror: any = null
  onend: any = null
  onstart: any = null

  start = vi.fn(() => {
    this.onstart?.()
  })

  stop = vi.fn(() => {
    this.onend?.()
  })

  abort = vi.fn()

  // Helper to simulate recognition results
  simulateResult(transcript: string, isFinal: boolean) {
    if (this.onresult) {
      const event = {
        results: [
          {
            0: { transcript, confidence: 0.95 },
            isFinal,
            length: 1,
          },
        ],
        resultIndex: 0,
      }
      this.onresult(event)
    }
  }

  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({ error, message: error })
    }
  }
}

describe('useVoiceInput Hook', () => {
  let mockRecognition: MockSpeechRecognition

  beforeEach(() => {
    mockRecognition = new MockSpeechRecognition()

    // @ts-ignore
    global.window.SpeechRecognition = vi.fn(() => mockRecognition)
    // @ts-ignore
    global.window.webkitSpeechRecognition = undefined
  })

  afterEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    delete global.window.SpeechRecognition
    // @ts-ignore
    delete global.window.webkitSpeechRecognition
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(true)
    expect(result.current.isListening).toBe(false)
    expect(result.current.transcript).toBe('')
    expect(result.current.interimTranscript).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('should detect when speech recognition is not supported', () => {
    // @ts-ignore
    delete global.window.SpeechRecognition

    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(false)
  })

  it('should use webkitSpeechRecognition as fallback', () => {
    // @ts-ignore
    delete global.window.SpeechRecognition
    // @ts-ignore
    global.window.webkitSpeechRecognition = vi.fn(() => mockRecognition)

    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(true)
  })

  it('should start listening', () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    expect(result.current.isListening).toBe(true)
    expect(mockRecognition.start).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('should stop listening', () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    expect(result.current.isListening).toBe(true)

    act(() => {
      result.current.stopListening()
    })

    expect(mockRecognition.stop).toHaveBeenCalled()
  })

  it('should handle final transcription results', async () => {
    const onResult = vi.fn()
    const { result } = renderHook(() => useVoiceInput({ onResult }))

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello world', true)
    })

    await waitFor(() => {
      expect(result.current.transcript).toBe('Hello world')
      expect(onResult).toHaveBeenCalledWith('Hello world', true)
    })
  })

  it('should handle interim results', async () => {
    const onResult = vi.fn()
    const { result } = renderHook(() => useVoiceInput({ onResult }))

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello', false)
    })

    await waitFor(() => {
      expect(result.current.interimTranscript).toBe('Hello')
      expect(onResult).toHaveBeenCalledWith('Hello', false)
    })
  })

  it('should accumulate final transcripts', async () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello', true)
    })

    await waitFor(() => {
      expect(result.current.transcript).toBe('Hello')
    })

    act(() => {
      mockRecognition.simulateResult(' world', true)
    })

    await waitFor(() => {
      expect(result.current.transcript).toBe('Hello world')
    })
  })

  it('should handle recognition errors', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useVoiceInput({ onError }))

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateError('no-speech')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('no-speech')
      expect(result.current.isListening).toBe(false)
      expect(onError).toHaveBeenCalledWith('no-speech')
    })
  })

  it('should reset transcript', () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello world', true)
    })

    act(() => {
      result.current.resetTranscript()
    })

    expect(result.current.transcript).toBe('')
    expect(result.current.interimTranscript).toBe('')
  })

  it('should configure language', () => {
    renderHook(() => useVoiceInput({ lang: 'tr-TR' }))

    expect(mockRecognition.lang).toBe('tr-TR')
  })

  it('should configure continuous mode', () => {
    renderHook(() => useVoiceInput({ continuous: true }))

    expect(mockRecognition.continuous).toBe(true)
  })

  it('should configure interim results', () => {
    renderHook(() => useVoiceInput({ interimResults: false }))

    expect(mockRecognition.interimResults).toBe(false)
  })

  it('should handle start listening when not supported', () => {
    // @ts-ignore
    delete global.window.SpeechRecognition

    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    expect(result.current.error).toBe('Ses tanıma desteklenmiyor')
    expect(result.current.isListening).toBe(false)
  })

  it('should clear interim transcript on end', async () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello', false)
    })

    expect(result.current.interimTranscript).toBe('Hello')

    act(() => {
      mockRecognition.stop()
    })

    await waitFor(() => {
      expect(result.current.interimTranscript).toBe('')
      expect(result.current.isListening).toBe(false)
    })
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useVoiceInput())

    unmount()

    expect(mockRecognition.stop).toHaveBeenCalled()
  })
})
