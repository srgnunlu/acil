/**
 * Handoff Create Modal Component
 * Modal for creating new handoff (manual or AI-generated)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, Users, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { useCreateHandoff, useGenerateHandoff } from '@/lib/hooks/useHandoffs'
import { useHandoffTemplates } from '@/lib/hooks/useHandoffTemplates'
import { useShifts } from '@/lib/hooks/useShifts'
import { toast } from 'react-hot-toast'
import type { CreateHandoffPayload } from '@/types/handoff.types'
// import { useWorkspace } from '@/contexts/WorkspaceContext' // Reserved for future use
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface HandoffCreateModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

export function HandoffCreateModal({ isOpen, onClose, workspaceId }: HandoffCreateModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const [mode, setMode] = useState<'manual' | 'ai'>('ai')
  const [step, setStep] = useState(1)

  // Form state
  const [toUserId, setToUserId] = useState('')
  const [handoffDate, setHandoffDate] = useState(new Date().toISOString().split('T')[0])
  const [handoffTime] = useState(new Date().toISOString())
  const [shiftId, setShiftId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [summary, setSummary] = useState('')
  const [includePendingTasks, setIncludePendingTasks] = useState(true)
  const [includeCriticalAlerts, setIncludeCriticalAlerts] = useState(true)
  const [includeRecentChanges, setIncludeRecentChanges] = useState(true)

  // AI generated content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiContent, setAiContent] = useState<any>(null)

  // Workspace members state
  const [workspaceMembers, setWorkspaceMembers] = useState<
    Array<{ user_id: string; full_name: string | null; role: string }>
  >([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Queries
  const { data: templates } = useHandoffTemplates({ workspace_id: workspaceId })
  const { data: shiftsData } = useShifts({
    workspace_id: workspaceId,
    shift_date_from: handoffDate,
    shift_date_to: handoffDate,
  })

  // Mutations
  const createMutation = useCreateHandoff()
  const generateMutation = useGenerateHandoff()

  // Get current user
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    if (isOpen) {
      getUser()
    }
  }, [isOpen, supabase])

  // Fetch workspace members
  useEffect(() => {
    async function fetchWorkspaceMembers() {
      if (!workspaceId || !isOpen) return

      try {
        setLoadingMembers(true)
        const response = await fetch(`/api/workspaces/${workspaceId}/members`)
        if (!response.ok) {
          throw new Error('Workspace members yüklenemedi')
        }
        const data = await response.json()
        // Filter out current user from the list and map to correct format

        const members = (data.members || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((member: any) => member.user_id !== user?.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((member: any) => ({
            user_id: member.user_id,
            full_name: member.profile?.full_name || null,
            role: member.role,
          }))
        setWorkspaceMembers(members)
        console.log('[HandoffCreateModal] Loaded workspace members:', members)
      } catch (error) {
        console.error('Error fetching workspace members:', error)
        toast.error('Workspace üyeleri yüklenemedi')
      } finally {
        setLoadingMembers(false)
      }
    }

    if (isOpen && workspaceId) {
      fetchWorkspaceMembers()
    }
  }, [isOpen, workspaceId, user?.id])

  if (!isOpen) return null

  const handleGenerateAI = async () => {
    if (!toUserId) {
      toast.error('Lütfen devir alacak kişiyi seçin')
      return
    }

    if (!user?.id) {
      toast.error('Kullanıcı bilgisi alınamadı')
      return
    }

    try {
      const result = await generateMutation.mutateAsync({
        workspace_id: workspaceId,
        from_user_id: user.id,
        to_user_id: toUserId,
        shift_id: shiftId || undefined,
        template_id: templateId || undefined,
        include_pending_tasks: includePendingTasks,
        include_critical_alerts: includeCriticalAlerts,
        include_recent_changes: includeRecentChanges,
      })

      setAiContent(result.content)
      setSummary(result.content.summary)
      setStep(2)
      toast.success('AI devir özeti başarıyla oluşturuldu!')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'AI devir oluşturulurken hata oluştu')
    }
  }

  const handleCreateHandoff = async () => {
    if (!toUserId) {
      toast.error('Lütfen devir alacak kişiyi seçin')
      return
    }

    if (!user?.id) {
      toast.error('Kullanıcı bilgisi alınamadı')
      return
    }

    try {
      const payload: CreateHandoffPayload = {
        workspace_id: workspaceId,
        from_user_id: user.id,
        to_user_id: toUserId,
        handoff_date: handoffDate,
        handoff_time: handoffTime,
        shift_id: shiftId || undefined,
        template_id: templateId || undefined,
        summary,
        content: aiContent || {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patient_ids: aiContent?.patient_summaries?.map((p: any) => p.patient_id) || [],
        checklist_items: aiContent?.checklist_items || [],
      }

      await createMutation.mutateAsync(payload)
      toast.success('Vardiya devri başarıyla oluşturuldu!')
      onClose()
      resetForm()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Devir oluşturulurken hata oluştu')
    }
  }

  const resetForm = () => {
    setMode('ai')
    setStep(1)
    setToUserId('')
    setShiftId('')
    setTemplateId('')
    setSummary('')
    setAiContent(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Yeni Vardiya Devri
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Mode Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('ai')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    mode === 'ai'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Sparkles
                    className={`w-8 h-8 mb-3 ${mode === 'ai' ? 'text-purple-600' : 'text-gray-400'}`}
                  />
                  <h3 className="font-semibold text-gray-900 mb-2">AI Destekli Devir</h3>
                  <p className="text-sm text-gray-600">
                    Hasta verilerine göre otomatik devir özeti oluştur
                  </p>
                </button>

                <button
                  onClick={() => setMode('manual')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    mode === 'manual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <FileText
                    className={`w-8 h-8 mb-3 ${mode === 'manual' ? 'text-blue-600' : 'text-gray-400'}`}
                  />
                  <h3 className="font-semibold text-gray-900 mb-2">Manuel Devir</h3>
                  <p className="text-sm text-gray-600">Devir bilgilerini kendin oluştur</p>
                </button>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Devir Bilgileri
                </h3>

                {/* To User */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Devir Alacak Kişi *
                  </label>
                  <select
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    disabled={loadingMembers}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{loadingMembers ? 'Yükleniyor...' : 'Seçiniz...'}</option>
                    {workspaceMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name || 'İsimsiz Kullanıcı'} ({member.role})
                      </option>
                    ))}
                  </select>
                  {workspaceMembers.length === 0 && !loadingMembers && (
                    <p className="mt-1 text-sm text-gray-500">
                      Bu workspace&apos;te devir alabilecek başka üye bulunmuyor.
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Devir Tarihi *
                  </label>
                  <input
                    type="date"
                    value={handoffDate}
                    onChange={(e) => setHandoffDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Shift */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vardiya (Opsiyonel)
                  </label>
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz...</option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {shiftsData?.shifts?.map((shift: any) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shift_definition?.name} -{' '}
                        {new Date(shift.start_time).toLocaleTimeString('tr-TR')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şablon (Opsiyonel)
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Varsayılan Şablon</option>
                    {templates?.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Options */}
                {mode === 'ai' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">AI Devir Seçenekleri</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includePendingTasks}
                          onChange={(e) => setIncludePendingTasks(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Bekleyen görevleri dahil et</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeCriticalAlerts}
                          onChange={(e) => setIncludeCriticalAlerts(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Kritik uyarıları dahil et</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeRecentChanges}
                          onChange={(e) => setIncludeRecentChanges(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Son değişiklikleri dahil et</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: AI Generated Content Preview */}
          {step === 2 && aiContent && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">AI Devir Özeti Oluşturuldu!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {aiContent.patient_summaries?.length || 0} hasta için devir özeti hazırlandı.
                    İnceleyip düzenleyebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genel Özet</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Statistics */}
              {aiContent.overall_statistics && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {aiContent.overall_statistics.total_patients}
                    </div>
                    <div className="text-xs text-blue-700">Toplam Hasta</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {aiContent.overall_statistics.critical_patients}
                    </div>
                    <div className="text-xs text-red-700">Kritik</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {aiContent.overall_statistics.stable_patients}
                    </div>
                    <div className="text-xs text-green-700">Stabil</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {aiContent.overall_statistics.pending_discharges}
                    </div>
                    <div className="text-xs text-yellow-700">Taburcu Bekleyen</div>
                  </div>
                </div>
              )}

              {/* Critical Alerts */}
              {aiContent.critical_alerts && aiContent.critical_alerts.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Kritik Uyarılar ({aiContent.critical_alerts.length})
                  </h4>
                  <ul className="space-y-1 bg-red-50 border border-red-200 rounded-lg p-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {aiContent.critical_alerts.slice(0, 5).map((alert: any, idx: number) => {
                      // Support both string and object formats
                      const alertText =
                        typeof alert === 'string' ? alert : alert.alert || alert.message || 'Uyarı'
                      const patientName =
                        typeof alert === 'object' && alert.patient_name
                          ? ` (${alert.patient_name})`
                          : ''
                      const severity =
                        typeof alert === 'object' && alert.severity ? alert.severity : 'medium'

                      const severityColors: Record<string, string> = {
                        critical: 'text-red-900 font-semibold',
                        high: 'text-red-800 font-medium',
                        medium: 'text-red-700',
                        low: 'text-red-600',
                      }

                      return (
                        <li
                          key={idx}
                          className={`text-sm ${severityColors[severity] || 'text-red-900'}`}
                        >
                          • {alertText}
                          {patientName}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Geri dön
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            İptal
          </button>

          {step === 1 && mode === 'ai' && (
            <button
              onClick={handleGenerateAI}
              disabled={!toUserId || generateMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI ile Oluştur
                </>
              )}
            </button>
          )}

          {(step === 2 || mode === 'manual') && (
            <button
              onClick={handleCreateHandoff}
              disabled={!toUserId || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Devri Oluştur'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
