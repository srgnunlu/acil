'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { useCreateProtocol } from '@/lib/hooks/useProtocols'
import { useProtocolCategories } from '@/lib/hooks/useProtocolCategories'
import type { ProtocolCreate } from '@/types/protocol.types'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface CreateProtocolModalProps {
  workspaceId: string
  isOpen: boolean
  onClose: () => void
}

export default function CreateProtocolModal({
  workspaceId,
  isOpen,
  onClose,
}: CreateProtocolModalProps) {
  const [formData, setFormData] = useState<Partial<ProtocolCreate>>({
    workspace_id: workspaceId,
    title: '',
    description: '',
    content: '',
    content_type: 'markdown',
    category_id: null,
    tags: [],
    keywords: [],
    status: 'draft',
  })

  const [tagsInput, setTagsInput] = useState('')
  const [keywordsInput, setKeywordsInput] = useState('')

  const { data: categories } = useProtocolCategories(workspaceId)
  const createProtocol = useCreateProtocol()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.content) {
      alert('Başlık ve içerik zorunludur')
      return
    }

    // Parse tags and keywords
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    try {
      await createProtocol.mutateAsync({
        workspace_id: workspaceId,
        title: formData.title,
        description: formData.description || null,
        content: formData.content,
        content_type: formData.content_type || 'markdown',
        category_id: formData.category_id || null,
        tags,
        keywords,
        status: formData.status || 'draft',
      } as ProtocolCreate)

      // Reset form
      setFormData({
        workspace_id: workspaceId,
        title: '',
        description: '',
        content: '',
        content_type: 'markdown',
        category_id: null,
        tags: [],
        keywords: [],
        status: 'draft',
      })
      setTagsInput('')
      setKeywordsInput('')

      onClose()
    } catch (error) {
      console.error('Failed to create protocol:', error)
      alert(error instanceof Error ? error.message : 'Protokol oluşturulamadı')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Protokol Oluştur" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Sepsis Protokolü"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, category_id: e.target.value || null })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Kategori Seçin</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Kısa açıklama..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Markdown veya HTML içerik..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Markdown formatında yazabilirsiniz. Örn: ## Başlık, **kalın**, *italik*
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sepsis, enfeksiyon, acil (virgülle ayırın)"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anahtar Kelimeler</label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sepsis, SIRS, qSOFA (virgülle ayırın)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Arama için kullanılacak anahtar kelimeler
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={formData.status || 'draft'}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayınlanmış</option>
              <option value="archived">Arşivlenmiş</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createProtocol.isPending}
              leftIcon={createProtocol.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {createProtocol.isPending ? 'Oluşturuluyor...' : 'Protokol Oluştur'}
            </Button>
          </div>
        </form>
    </Modal>
  )
}