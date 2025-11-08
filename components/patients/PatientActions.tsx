'use client'

import { useState } from 'react'
import { ReminderForm } from './ReminderForm'

interface PatientActionsProps {
  patientId: string
  patientName: string
}

export function PatientActions({ patientId, patientName }: PatientActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)

  const actions = [
    {
      id: 'reminder',
      label: 'Hatırlatma Oluştur',
      description: 'Hasta için hatırlatma ekle',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
      action: () => {
        setShowReminderForm(true)
        setShowMenu(false)
      }
    },
    {
      id: 'note',
      label: 'Hızlı Not',
      description: 'Kısa not ekle',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
      action: () => {
        // TODO: Implement quick note
        setShowMenu(false)
      }
    },
    {
      id: 'consult',
      label: 'Konsültasyon İste',
      description: 'Uzman görüşü talep et',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
      action: () => {
        // TODO: Implement consultation request
        setShowMenu(false)
      }
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="group px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-gray-900 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center space-x-2"
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
        <span>İşlemler</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 z-20 animate-fadeIn">
            <div className="px-3 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Hızlı İşlemler
              </p>
            </div>
            <div className="py-1">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showReminderForm && (
        <ReminderForm
          patientId={patientId}
          patientName={patientName}
          onClose={() => setShowReminderForm(false)}
        />
      )}
    </div>
  )
}
