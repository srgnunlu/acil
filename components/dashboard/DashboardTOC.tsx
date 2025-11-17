'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TOCSection {
  id: string
  title: string
  icon?: string
  subsections?: { id: string; title: string }[]
}

interface DashboardTOCProps {
  sections: TOCSection[]
}

export function DashboardTOC({ sections }: DashboardTOCProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Scrollspy - aktif section'ı tespit et
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Viewport'un üst %20'si ile alt %70'i arası
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Tüm section'ları gözlemle
    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        observer.observe(element)
      }

      // Subsection'ları da gözlemle
      section.subsections?.forEach((subsection) => {
        const subElement = document.getElementById(subsection.id)
        if (subElement) {
          observer.observe(subElement)
        }
      })
    })

    return () => observer.disconnect()
  }, [sections])

  // Smooth scroll
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const yOffset = -80 // Header yüksekliği için offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(sectionId)
      setIsMobileOpen(false) // Mobilde menüyü kapat
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen])

  return (
    <>
      {/* Mobile Toggle Button - Fixed Bottom Right */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-24 right-6 z-40 lg:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="İçindekiler menüsü"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* TOC Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '3rem' : '16rem',
          x: isMobileOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed left-0 top-20 h-[calc(100vh-5rem)] z-50
          bg-white border-r border-gray-200 shadow-sm
          overflow-hidden
          lg:translate-x-0 lg:z-30
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-semibold text-gray-900"
              >
                İçindekiler
              </motion.h2>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={isCollapsed ? 'Genişlet' : 'Daralt'}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {sections.map((section) => {
                const isActive = activeSection === section.id
                const hasActiveSubsection = section.subsections?.some(
                  (sub) => sub.id === activeSection
                )

                return (
                  <li key={section.id}>
                    {/* Main Section */}
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      title={isCollapsed ? section.title : undefined}
                    >
                      {section.icon && (
                        <span className="text-lg flex-shrink-0">{section.icon}</span>
                      )}
                      {!isCollapsed && <span className="truncate">{section.title}</span>}
                      {!isCollapsed && isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 bg-blue-600 rounded-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>

                    {/* Subsections */}
                    {!isCollapsed && section.subsections && (isActive || hasActiveSubsection) && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200"
                      >
                        {section.subsections.map((subsection) => {
                          const isSubActive = activeSection === subsection.id
                          return (
                            <li key={subsection.id}>
                              <button
                                onClick={() => scrollToSection(subsection.id)}
                                className={`
                                  w-full text-left px-3 py-1.5 text-xs rounded-r-lg
                                  transition-colors
                                  ${
                                    isSubActive
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                  }
                                `}
                              >
                                {subsection.title}
                              </button>
                            </li>
                          )
                        })}
                      </motion.ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Klavye: <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">↑</kbd>{' '}
                <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">↓</kbd> ile gezin
              </p>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Spacer (Desktop only) */}
      <div
        className={`hidden lg:block transition-all duration-300 ${
          isCollapsed ? 'lg:w-12' : 'lg:w-64'
        }`}
        aria-hidden="true"
      />
    </>
  )
}

// Utility component: TOC Section Container
export function TOCSection({
  id,
  title,
  children,
  className = '',
}: {
  id: string
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`scroll-mt-20 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          {title}
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
        </h2>
      )}
      {children}
    </section>
  )
}
