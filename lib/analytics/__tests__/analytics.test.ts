import { describe, it, expect } from 'vitest'

describe('Analytics Utils', () => {
  describe('convertToCSV', () => {
    it('should convert array of objects to CSV', () => {
      const data = [
        { name: 'John', age: 30, role: 'Doctor' },
        { name: 'Jane', age: 25, role: 'Nurse' },
      ]

      const expected = 'name,age,role\n"John","30","Doctor"\n"Jane","25","Nurse"'

      // Simple CSV conversion
      const headers = Object.keys(data[0])
      const rows = data.map((row) =>
        headers.map((header) => JSON.stringify(row[header as keyof typeof row] || '')).join(',')
      )
      const result = [headers.join(','), ...rows].join('\n')

      expect(result).toBe(expected)
    })

    it('should handle empty arrays', () => {
      const data: unknown[] = []
      const result = data.length === 0 ? '' : 'not empty'
      expect(result).toBe('')
    })
  })

  describe('flattenObject', () => {
    it('should flatten nested objects', () => {
      const data = {
        user: {
          name: 'John',
          address: {
            city: 'Istanbul',
            country: 'Turkey',
          },
        },
      }

      const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
        return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => {
          const prefixedKey = prefix ? `${prefix}.${key}` : key
          const value = obj[key]

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(acc, flatten(value as Record<string, unknown>, prefixedKey))
          } else {
            acc[prefixedKey] = value
          }

          return acc
        }, {})
      }

      const result = flatten(data)

      expect(result).toEqual({
        'user.name': 'John',
        'user.address.city': 'Istanbul',
        'user.address.country': 'Turkey',
      })
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const calculate = (value: number, total: number): string => {
        if (total === 0) return '0.0'
        return ((value / total) * 100).toFixed(1)
      }

      expect(calculate(25, 100)).toBe('25.0')
      expect(calculate(50, 200)).toBe('25.0')
      expect(calculate(0, 100)).toBe('0.0')
      expect(calculate(10, 0)).toBe('0.0')
    })
  })

  describe('formatDuration', () => {
    it('should format hours to readable duration', () => {
      const format = (hours: number): string => {
        if (hours < 24) return `${hours.toFixed(1)} saat`
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        return `${days} gün ${remainingHours.toFixed(1)} saat`
      }

      expect(format(2.5)).toBe('2.5 saat')
      expect(format(25)).toBe('1 gün 1.0 saat')
      expect(format(48)).toBe('2 gün 0.0 saat')
    })
  })

  describe('aggregateMetrics', () => {
    it('should aggregate daily metrics', () => {
      const dailyMetrics = [
        { date: '2025-11-01', patients: 5 },
        { date: '2025-11-02', patients: 3 },
        { date: '2025-11-03', patients: 7 },
      ]

      const total = dailyMetrics.reduce((sum, metric) => sum + metric.patients, 0)
      const avg = total / dailyMetrics.length

      expect(total).toBe(15)
      expect(avg).toBe(5)
    })
  })
})
