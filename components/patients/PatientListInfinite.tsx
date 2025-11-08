'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useInfinitePatients, usePrefetchNextPage } from '@/lib/hooks/useInfinitePatients'
import { PatientCard } from './PatientCard'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import type { Patient } from '@/types'

interface PatientListInfiniteProps {
  initialFilters?: {
    status?: string
    search?: string
  }
}

/**
 * Infinite scroll ile hasta listesi component'i
 */
export function PatientListInfinite({ initialFilters = {} }: PatientListInfiniteProps) {
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.search || '')
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    error,
  } = useInfinitePatients(filters)

  const prefetchNextPage = usePrefetchNextPage()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  const lastPatientRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        {
          threshold: 0.1,
          rootMargin: '100px', // 100px önce yükle
        }
      )

      if (node) observerRef.current.observe(node)
    },
    [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }))
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchInput])

  // Prefetch sonraki sayfa
  useEffect(() => {
    if (data?.pages.length && hasNextPage) {
      const lastPage = data.pages[data.pages.length - 1]
      if (lastPage.patients.length >= 10) {
        prefetchNextPage(filters, data.pages.length - 1)
      }
    }
  }, [data, hasNextPage, filters, prefetchNextPage])

  // Tüm hastaları birleştir
  const allPatients = data?.pages.flatMap(page => page.patients) || []

  // Hasta eklendiğinde listeyi güncelle
  const handlePatientAdded = useCallback((newPatient: Patient) => {
    // Query cache'ini güncelle
    setFilters(prev => ({ ...prev })) // Force refetch
  }, [])

  // Hasta güncellendiğinde listeyi güncelle
  const handlePatientUpdated = useCallback((patientId: string, updates: Partial<Patient>) => {
    // Query cache'ini güncelle
    setFilters(prev => ({ ...prev })) // Force refetch
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Hastalar yüklenemedi</div>
        <div className="text-red-500 text-sm">{error.message}</div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search ve Filtreler */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Hasta ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="discharged">Taburcu</option>
            <option value="consultation">Konsültasyon</option>
          </select>
        </div>
      </div>

      {/* Hasta Listesi */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allPatients.map((patient, index) => {
          // Son eleman için ref
          const isLast = index === allPatients.length - 1
          
          return (
            <div
              key={patient.id}
              ref={isLast ? lastPatientRef : null}
            >
              <PatientCard
                patient={patient}
                onUpdate={handlePatientUpdated}
                onAdd={handlePatientAdded}
              />
            </div>
          )
        })}
      </div>

      {/* Loading States */}
      {(isLoading || isRefetching) && allPatients.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Hastalar yükleniyor...</span>
          </div>
        </div>
      )}

      {/* Load More Button (fallback) */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Button
            ref={loadMoreRef as any}
            onClick={() => fetchNextPage()}
            variant="outline"
            className="min-w-32"
          >
            Daha Fazla Yükle
          </Button>
        </div>
      )}

      {/* Loading More Indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Daha fazla yükleniyor...</span>
          </div>
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && allPatients.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Tüm hastalar gösteriliyor</div>
          <div className="text-xs mt-1">Toplam {allPatients.length} hasta</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isRefetching && allPatients.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filters.search ? 'Sonuç bulunamadı' : 'Henüz hasta eklemediniz'}
          </h3>
          <p className="text-gray-600 mb-6">
            {filters.search 
              ? 'Arama kriterlerinize uygun hasta bulunamadı' 
              : 'İlk hastanızı ekleyerek AI destekli hasta takibine başlayın'
            }
          </p>
          {!filters.search && (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              İlk Hasta Ekle
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Skeleton loader
export function PatientListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}