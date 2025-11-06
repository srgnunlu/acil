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

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center space-x-2"
      >
        <span>İşlemler</span>
        <svg
          className="w-4 h-4"
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
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <button
              onClick={() => {
                setShowReminderForm(true)
                setShowMenu(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center space-x-2"
            >
              <span className="text-xl">⏰</span>
              <span>Hatırlatma Oluştur</span>
            </button>
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
