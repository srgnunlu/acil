/**
 * Haptic Feedback Utility for PWA Mobile Apps
 *
 * Provides haptic feedback (vibration) for better mobile UX
 * Uses the Vibration API when available
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [30, 100, 30],
  error: [50, 100, 50, 100, 50],
  selection: 5,
}

/**
 * Check if vibration API is supported
 */
export function isHapticSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator
}

/**
 * Trigger haptic feedback
 * @param pattern - Predefined haptic pattern or custom vibration duration/pattern
 */
export function triggerHaptic(pattern: HapticPattern | number | number[] = 'light'): void {
  if (!isHapticSupported()) return

  try {
    const vibrationPattern = typeof pattern === 'string' ? patterns[pattern] : pattern
    navigator.vibrate(vibrationPattern)
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if (!isHapticSupported()) return
  navigator.vibrate(0)
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  const supported = isHapticSupported()

  return {
    supported,
    trigger: triggerHaptic,
    cancel: cancelHaptic,
  }
}

// Convenience functions for common patterns
export const haptic = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  selection: () => triggerHaptic('selection'),
}
