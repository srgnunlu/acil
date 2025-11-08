/**
 * Next.js Dynamic Import Type Definitions
 * Dynamic import'lar için type tanımlamaları
 */

declare module 'next/dynamic' {
  export interface DynamicOptions<T = {}> {
    loading?: React.ComponentType<any, any> | React.LazyExoticComponent<any, any> | { readonly default: React.ComponentType<any, any> } | null
    ssr?: boolean
    /**
     * @deprecated Use `loading` instead.
     */
    loadingComponent?: React.ComponentType<any, any> | React.LazyExoticComponent<any, any> | { readonly default: React.ComponentType<any, any> } | null
  }
  
  export default function dynamic<T = {}>(
    importer: () => Promise<T>,
    options?: DynamicOptions<T>
  ): React.ComponentType<any, any>
}

declare module '*.svg' {
  import React = 'react'
  
  export interface ReactSVGProps {
    [key: string]: any
  }
  
  const ReactSVG: React.FC<ReactSVGProps> = ({
    ...props
  }) => {
    return null // SVG component'leri için placeholder
  }
  
  export default ReactSVG
}

declare module '*.png' {
  const content: any
  export default content
}

declare module '*.jpg' {
  const content: any
  export default content
}

declare module '*.jpeg' {
  const content: any
  export default content
}

declare module '*.webp' {
  const content: any
  export default content
}

declare module '*.gif' {
  const content: any
  export default content
}

declare module '*.ico' {
  const content: any
  export default content
}

declare module '*.woff' {
  const content: any
  export default content
}

declare module '*.woff2' {
  const content: any
  export default content
}

// Performance API type'ları
declare global {
  interface Performance {
    getEntriesByType?: (type: PerformanceEntryType) => PerformanceEntry[]
    mark?: (name?: string) => void
    measure?: (name?: string, startMark?: string) => void
    navigation?: (type?: PerformanceNavigationTimingType) => PerformanceNavigationTiming
    resource?: (options?: PerformanceResourceTimingOptions) => PerformanceResourceTiming
  }
  
  interface PerformanceObserver {
    observe(target: PerformanceObserverTarget, options?: PerformanceObserverInit): void
    disconnect(): void
    takeRecords(): PerformanceObserverEntryList
  }
  
  interface PerformanceObserverEntryList {
    getEntries(): PerformanceObserverEntry[]
  }
  
  interface PerformanceObserverEntry {
    entryType: string
    startTime: number
    duration: number
    name: string
  }
  
  interface PerformanceObserverInit {
    entryTypes: PerformanceEntryType[]
  buffered?: boolean
  durationThreshold?: number
  }
  
  const enum PerformanceEntryType {
    mark = 0
    measure = 1
    navigation = 2
    resource = 3
    longtask = 4
  }
  
  interface PerformanceNavigationTimingType {
    start: string
    type: string
  }
  
  interface PerformanceResourceTimingOptions {
    initiatorType?: string
    buffered?: boolean
  }
  
  interface PerformanceObserverTarget {
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void
    dispatchEvent(event: Event): void
  }
  
  interface EventListenerOrEventListenerObject {
    handleEvent: EventListener
    capture?: boolean
    passive?: boolean
    once?: boolean
  }
  
  interface AddEventListenerOptions {
    capture?: boolean
    once?: boolean
    passive?: boolean
  }
  
  interface Event {
    type: string
    target: EventTarget
    currentTarget: EventTarget
    bubbles: boolean
    cancelable: boolean
    defaultPrevented: boolean
    timeStamp: number
  }
  
  interface EventListener {
    (evt: Event): void
  }
  
  interface EventTarget {
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void
    dispatchEvent(event: Event): void
  }
  
  interface UIEvent {
    type: string
    target: EventTarget
    currentTarget: EventTarget
    bubbles: boolean
    cancelable: boolean
    defaultPrevented: boolean
    timeStamp: number
    view: UIEventView
    detail: any
    which?: number
  }
  
  interface UIEventView {
    detail: any
  }
  
  interface CustomEvent {
    type: string
    target: EventTarget
    currentTarget: EventTarget
    bubbles: boolean
    cancelable: boolean
    defaultPrevented: boolean
    timeStamp: number
    view: UIEventView
    detail: any
    which?: number
    initCustomEvent(
      type: string,
      canBubble: boolean,
      cancelable: boolean,
      detail?: any
    ): void
  }
  
  interface ErrorEvent {
    colno?: number
    error?: any
    filename?: string
    lineno?: number
    message?: string
  }
  
  interface ProgressEvent {
    lengthComputable: boolean
    loaded: number
    total: number
  }
  
  interface StorageEvent {
    key?: string
    newValue?: string
    oldValue?: string
    storageArea?: string
    url?: string
  }
  
  interface HashChangeEvent {
    newURL: string
    oldURL: string
  }
  
  interface MessageEvent {
    data: any
    lastEventId?: string
    origin: string
    ports?: ReadonlyArray<number>
    source: MessageEventSource
  }
  
  interface MessageEventSource {
    close(): void
    dispatchEvent(event: MessageEvent): void
    url: string
    readyState: number
    withCredentials: boolean
  }
  
  interface PopStateEvent {
    state: any
  }
  
  interface PageTransitionEvent {
    persisted: boolean
  }
  
  interface PromiseRejectionEvent {
    promise: Promise<any>
    reason: any
  }
  
  interface TouchEvent {
    altKey: boolean
    changedTouches: TouchList
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    targetTouches: TouchList
    timeStamp: number
    touches: TouchList
    type: string
  }
  
  interface Touch {
    clientX: number
    clientY: number
    force: number
    identifier: number
    pageX: number
    pageY: number
    radiusX: number
    radiusY: number
    rotationAngle: number
    screenX: number
    screenY: number
    target: EventTarget
  }
  
  interface TouchList {
    length: number
    item(index: number): Touch
    identifiedTouch(): Touch | null
  }
  
  interface WheelEvent {
    deltaMode: number
    deltaX: number
    deltaY: number
    deltaZ: number
    deltaMode: string
  }
  
  interface AnimationEvent {
    animationName: string
    elapsedTime: number
    pseudoElement: string
  }
  
  interface TransitionEvent {
    elapsedTime: number
    propertyName: string
    pseudoElement: string
  }
  
  interface DragEvent {
    dataTransfer: DataTransfer
  }
  
  interface ClipboardEvent {
    clipboardData: DataTransfer
  }
  
  interface FocusEvent {
    relatedTarget: EventTarget
  }
  
  interface KeyboardEvent {
    altKey: boolean
    charCode: number
    code: string
    ctrlKey: boolean
    key: string
    location: number
    metaKey: boolean
    repeat: boolean
    shiftKey: boolean
    which: number
  }
  
  interface MouseEvent {
    altKey: boolean
    button: number
    buttons: number
    clientX: number
    clientY: number
    ctrlKey: boolean
    metaKey: boolean
    movementX: number
    movementY: number
    offsetX: number
    offsetY: number
    pageX: number
    pageY: number
    relatedTarget: EventTarget
    screenX: number
    screenY: number
    shiftKey: boolean
    which: number
  }
  
  interface PointerEvent {
    height: number
    isPrimary: boolean
    pointerId: number
    pointerType: string
    pressure: number
    tiltX: number
    tiltY: number
    width: number
  }
  
  interface UIEventInit {
    bubbles?: boolean
    cancelable?: boolean
    detail?: any
  }
  
  interface CustomEventInit {
    bubbles?: boolean
    cancelable?: boolean
    detail?: any
  }
}

// Web Vitals type'ları
interface WebVitalsMetrics {
  id: string
  name: string
  value: number
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

interface CLSMetric extends WebVitalsMetrics {
  name: 'CLS'
}

interface FIDMetric extends WebVitalsMetrics {
  name: 'FID'
}

interface FCPMetric extends WebVitalsMetrics {
  name: 'FCP'
}

interface LCPMetric extends WebVitalsMetrics {
  name: 'LCP'
}

interface TTFBMetric extends WebVitalsMetrics {
  name: 'TTFB'
}

// Cache type'ları
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number
  key?: string
  vary?: string[]
  revalidate?: string
}

// API Response type'ları
interface APIMetrics {
  endpoint: string
  method: string
  status: number
  duration: number
  cacheHit: boolean
  timestamp: number
  userId?: string
}

// Export type'ları
export type {
  DynamicOptions,
  PerformanceEntry,
  PerformanceObserver,
  PerformanceObserverEntry,
  PerformanceObserverInit,
  PerformanceNavigationTimingType,
  PerformanceResourceTimingOptions,
  PerformanceObserverTarget,
  EventListener,
  AddEventListenerOptions,
  Event,
  EventTarget,
  UIEvent,
  CustomEvent,
  ErrorEvent,
  ProgressEvent,
  StorageEvent,
  HashChangeEvent,
  MessageEvent,
  MessageEventSource,
  PopStateEvent,
  PromiseRejectionEvent,
  TouchEvent,
  Touch,
  TouchList,
  WheelEvent,
  AnimationEvent,
  TransitionEvent,
  DragEvent,
  ClipboardEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  UIEventInit,
  CustomEventInit,
  WebVitalsMetrics,
  CLSMetric,
  FIDMetric,
  FCPMetric,
  LCPMetric,
  TTFBMetric,
  CacheEntry,
  CacheOptions,
  APIMetrics,
}