/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCamera } from '../useCamera'

// Mock MediaStream
class MockMediaStream {
  id = 'mock-stream-id'
  active = true
  tracks: MediaStreamTrack[] = []

  getTracks() {
    return this.tracks
  }

  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track)
  }
}

class MockMediaStreamTrack {
  id = 'mock-track-id'
  kind = 'video'
  label = 'Mock Camera'
  enabled = true
  muted = false
  readyState: MediaStreamTrackState = 'live'

  stop = vi.fn()
  getCapabilities = vi.fn()
  getConstraints = vi.fn()
  getSettings = vi.fn()
  applyConstraints = vi.fn()
  clone = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
}

describe('useCamera Hook', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>
  let mockStream: MockMediaStream

  beforeEach(() => {
    mockStream = new MockMediaStream()
    const mockTrack = new MockMediaStreamTrack()
    mockStream.addTrack(mockTrack as unknown as MediaStreamTrack)

    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream)

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    })

    // Mock HTMLVideoElement
    Object.defineProperty(HTMLVideoElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with inactive camera', () => {
    const { result } = renderHook(() => useCamera())

    expect(result.current.isActive).toBe(false)
    expect(result.current.stream).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.capturedImage).toBeNull()
  })

  it('should start camera successfully', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    await waitFor(() => {
      expect(result.current.isActive).toBe(true)
      expect(result.current.stream).toBeTruthy()
      expect(result.current.error).toBeNull()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })
  })

  it('should use front camera when specified', async () => {
    const { result } = renderHook(() => useCamera({ facingMode: 'user' }))

    await act(async () => {
      await result.current.startCamera()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })
  })

  it('should use custom resolution', async () => {
    const { result } = renderHook(() => useCamera({ width: 1920, height: 1080 }))

    await act(async () => {
      await result.current.startCamera()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
  })

  it('should handle camera permission denied', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    await waitFor(() => {
      expect(result.current.isActive).toBe(false)
      expect(result.current.error).toBe('Permission denied')
    })
  })

  it('should stop camera and cleanup stream', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    await waitFor(() => {
      expect(result.current.isActive).toBe(true)
    })

    act(() => {
      result.current.stopCamera()
    })

    expect(result.current.isActive).toBe(false)
    expect(result.current.stream).toBeNull()
    expect(mockStream.tracks[0].stop).toHaveBeenCalled()
  })

  it('should capture photo from video stream', async () => {
    const { result } = renderHook(() => useCamera())

    // Mock canvas and context
    const mockCanvas = document.createElement('canvas')
    const mockContext = {
      drawImage: vi.fn(),
    }

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any)
    vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,mockimage')

    // Mock video element with dimensions
    Object.defineProperty(result.current.videoRef, 'current', {
      writable: true,
      value: {
        videoWidth: 1280,
        videoHeight: 720,
        srcObject: mockStream,
      },
    })

    await act(async () => {
      await result.current.startCamera()
    })

    let capturedDataUrl: string | null = null

    act(() => {
      capturedDataUrl = result.current.capturePhoto()
    })

    expect(capturedDataUrl).toBe('data:image/jpeg;base64,mockimage')
    expect(result.current.capturedImage).toBe('data:image/jpeg;base64,mockimage')
    expect(mockContext.drawImage).toHaveBeenCalled()
  })

  it('should handle capture error when camera not active', () => {
    const { result } = renderHook(() => useCamera())

    const capturedDataUrl = result.current.capturePhoto()

    expect(capturedDataUrl).toBeNull()
    expect(result.current.error).toBe('Kamera aktif değil')
  })

  it('should clear captured image', async () => {
    const { result } = renderHook(() => useCamera())

    // Mock capture process
    Object.defineProperty(result.current.videoRef, 'current', {
      writable: true,
      value: {
        videoWidth: 1280,
        videoHeight: 720,
        srcObject: mockStream,
      },
    })

    const mockCanvas = document.createElement('canvas')
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue({ drawImage: vi.fn() } as any)
    vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,mockimage')

    await act(async () => {
      await result.current.startCamera()
    })

    act(() => {
      result.current.capturePhoto()
    })

    expect(result.current.capturedImage).toBeTruthy()

    act(() => {
      result.current.clearCapturedImage()
    })

    expect(result.current.capturedImage).toBeNull()
  })

  it('should convert data URL to File', () => {
    const { result } = renderHook(() => useCamera())

    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=='
    const file = result.current.dataURLtoFile(dataUrl, 'test.png')

    expect(file).toBeInstanceOf(File)
    expect(file?.name).toBe('test.png')
    expect(file?.type).toBe('image/png')
  })

  it('should handle invalid data URL in conversion', () => {
    const { result } = renderHook(() => useCamera())

    const invalidDataUrl = 'invalid-data-url'
    const file = result.current.dataURLtoFile(invalidDataUrl, 'test.png')

    expect(file).toBeNull()
  })

  it('should handle missing mediaDevices API', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Kameranız desteklenmiyor')
      expect(result.current.isActive).toBe(false)
    })
  })
})
