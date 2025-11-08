/**
 * Dynamic Chart Components - Bundle size optimizasyonu için
 * Chart'ları sadece ihtiyaç olduğunda yükler
 */

'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Chart Skeleton Loader
const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded-lg"></div>
  </div>
)

// Dynamic Patient Status Chart
export const PatientStatusChart = dynamic(
  () => import('@/components/charts/PatientStatusChart'),
  {
    loading: ChartSkeleton,
    ssr: false, // Chart'lar client-side'de render edilmeli
  }
)

// Dynamic Test Type Chart
export const TestTypeChart = dynamic(
  () => import('@/components/charts/TestTypeChart'),
  {
    loading: ChartSkeleton,
    ssr: false,
  }
)

// Dynamic Activity Trend Chart
export const ActivityTrendChart = dynamic(
  () => import('@/components/charts/ActivityTrendChart'),
  {
    loading: ChartSkeleton,
    ssr: false,
  }
)

// Dynamic Data Entry Chart
export const DataEntryChart = dynamic(
  () => import('@/components/charts/DataEntryChart'),
  {
    loading: ChartSkeleton,
    ssr: false,
  }
)

// Analytics Dashboard - Tüm chart'ları dynamic olarak yükler
export const AnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AnalyticsDashboard'),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ChartSkeleton />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ChartSkeleton />
        </div>
      </div>
    ),
    ssr: false,
  }
)

// PDF Export Button - Dynamic import
export const PDFExportButton = dynamic(
  () => import('@/components/patients/PDFExportButton'),
  {
    loading: () => (
      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        PDF Hazırlanıyor...
      </button>
    ),
    ssr: false,
  }
)

// Image Upload Component - Dynamic import
export const ImageUploadComponent = dynamic(
  () => import('@/components/ui/ImageUpload'),
  {
    loading: () => (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Yükleme hazırlanıyor...</p>
      </div>
    ),
    ssr: false,
  }
)

// Chat Component - Dynamic import
export const PatientChatComponent = dynamic(
  () => import('@/components/patients/PatientChat'),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Advanced Filters Component - Dynamic import
export const AdvancedFilters = dynamic(
  () => import('@/components/patients/AdvancedFilters'),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Bulk Actions Component - Dynamic import
export const BulkActions = dynamic(
  () => import('@/components/patients/BulkActions'),
  {
    loading: () => (
      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg opacity-50">
        İşlemler Yükleniyor...
      </div>
    ),
    ssr: false,
  }
)