'use client'

/**
 * Sticky Note Card Component
 * Displays a single sticky note with actions, reactions, and replies
 */

import { useState, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNoteWithDetails, NOTE_TYPE_CONFIG } from '@/types/sticky-notes.types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MessageSquare, Pin, Check, MoreVertical, Edit2, Trash2, Reply } from 'lucide-react'
import EmojiReactions from './EmojiReactions'

interface StickyNoteCardProps {
  note: StickyNoteWithDetails
  onReply?: (noteId: string) => void
  onEdit?: (noteId: string) => void
  onDelete?: (noteId: string) => void
  onTogglePin?: (noteId: string, isPinned: boolean) => void
  onToggleResolve?: (noteId: string, isResolved: boolean) => void
  onReaction?: (noteId: string, emoji: string) => void
  onRemoveReaction?: (noteId: string, emoji: string) => void
  currentUserId: string
  canEdit?: boolean
  canDelete?: boolean
  showReplies?: boolean
  className?: string
}

function StickyNoteCard({
  note,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleResolve,
  onReaction,
  onRemoveReaction,
  currentUserId,
  canEdit = false,
  canDelete = false,
  showReplies = true,
  className = '',
}: StickyNoteCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')

  // Memoize expensive calculations
  const config = useMemo(() => NOTE_TYPE_CONFIG[note.note_type], [note.note_type])
  const isAuthor = useMemo(() => note.author_id === currentUserId, [note.author_id, currentUserId])
  const canModify = useMemo(() => canEdit || isAuthor, [canEdit, isAuthor])
  const canRemove = useMemo(() => canDelete || isAuthor, [canDelete, isAuthor])

  // Format created date - memoize to avoid recalculation
  const createdAt = useMemo(
    () =>
      formatDistanceToNow(new Date(note.created_at), {
        addSuffix: true,
        locale: tr,
      }),
    [note.created_at]
  )

  // Memoize author display name
  const authorDisplayName = useMemo(
    () => note.author?.full_name || note.author?.email || 'Bilinmeyen Kullanıcı',
    [note.author?.full_name, note.author?.email]
  )

  // Memoize avatar initial
  const avatarInitial = useMemo(
    () => (note.author?.full_name?.charAt(0) || note.author?.email?.charAt(0) || 'U').toUpperCase(),
    [note.author?.full_name, note.author?.email]
  )

  // Memoize mentions display
  const mentionsDisplay = useMemo(
    () =>
      note.mentions && note.mentions.length > 0
        ? note.mentions
            .map((m) => m.mentioned_user?.full_name)
            .filter(Boolean)
            .join(', ')
        : null,
    [note.mentions]
  )

  // Render content with mentions highlighted
  const renderContent = (html: string) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <motion.div
      className={`sticky-note-card ${note.is_resolved ? 'resolved' : ''} ${className}`}
      style={{ borderLeftColor: config.color }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      layout
    >
      {/* Header */}
      <div className="sticky-note-header">
        <div className="sticky-note-type-badge" style={{ backgroundColor: config.bgColor }}>
          <span className="note-icon">{config.icon}</span>
          <span className="note-type-label" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>

        <div className="sticky-note-meta">
          <div className="author-info">
            {note.author?.avatar_url ? (
              <img src={note.author.avatar_url} alt={authorDisplayName} className="author-avatar" />
            ) : (
              <div className="author-avatar-placeholder">{avatarInitial}</div>
            )}
            <div>
              <div className="author-name">{authorDisplayName}</div>
              <div className="note-time">{createdAt}</div>
            </div>
          </div>

          <div className="note-badges">
            {note.is_pinned && (
              <div className="note-badge pinned" title="Sabitlenmiş">
                <Pin size={14} />
              </div>
            )}
            {note.is_resolved && (
              <div className="note-badge resolved" title="Çözüldü">
                <Check size={14} />
              </div>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        {canModify && (
          <div className="note-actions-container">
            <button
              onClick={(e) => {
                const button = e.currentTarget
                const rect = button.getBoundingClientRect()
                const spaceBelow = window.innerHeight - rect.bottom
                const spaceAbove = rect.top
                const dropdownHeight = 200 // Approximate dropdown height

                // If not enough space below but enough above, open upward
                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                  setDropdownPosition('top')
                } else {
                  setDropdownPosition('bottom')
                }
                setShowActions(!showActions)
              }}
              className="note-actions-button"
              title="İşlemler"
              type="button"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  className={`note-actions-dropdown ${dropdownPosition === 'top' ? 'dropdown-top' : ''}`}
                  initial={{ opacity: 0, y: dropdownPosition === 'top' ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: dropdownPosition === 'top' ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {onTogglePin && (
                    <button onClick={() => onTogglePin(note.id, !note.is_pinned)}>
                      <Pin size={14} />
                      {note.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                    </button>
                  )}
                  {onToggleResolve && (
                    <button onClick={() => onToggleResolve(note.id, !note.is_resolved)}>
                      <Check size={14} />
                      {note.is_resolved ? 'Yeniden Aç' : 'Çözüldü Olarak İşaretle'}
                    </button>
                  )}
                  {canModify && onEdit && (
                    <button onClick={() => onEdit(note.id)}>
                      <Edit2 size={14} />
                      Düzenle
                    </button>
                  )}
                  {canRemove && onDelete && (
                    <button onClick={() => onDelete(note.id)} className="danger">
                      <Trash2 size={14} />
                      Sil
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sticky-note-content">{renderContent(note.content)}</div>

      {/* Footer: Reactions & Actions */}
      <div className="sticky-note-footer">
        <EmojiReactions
          noteId={note.id}
          reactions={note.reactions || []}
          currentUserId={currentUserId}
          onReaction={onReaction}
          onRemoveReaction={onRemoveReaction}
        />

        <div className="note-footer-actions">
          {showReplies && note.replies_count > 0 && (
            <button className="note-reply-count" onClick={() => onReply?.(note.id)}>
              <MessageSquare size={16} />
              <span>{note.replies_count} yanıt</span>
            </button>
          )}
          {onReply && (
            <button className="note-reply-button" onClick={() => onReply(note.id)}>
              <Reply size={16} />
              <span>Yanıtla</span>
            </button>
          )}
        </div>
      </div>

      {/* Mentions indicator */}
      {mentionsDisplay && (
        <div className="note-mentions-indicator">
          <span>👥 </span>
          <span>{mentionsDisplay} etiketlendi</span>
        </div>
      )}
    </motion.div>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(StickyNoteCard, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.is_pinned === nextProps.note.is_pinned &&
    prevProps.note.is_resolved === nextProps.note.is_resolved &&
    prevProps.note.replies_count === nextProps.note.replies_count &&
    prevProps.note.reactions?.length === nextProps.note.reactions?.length &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.canEdit === nextProps.canEdit &&
    prevProps.canDelete === nextProps.canDelete &&
    prevProps.showReplies === nextProps.showReplies &&
    prevProps.className === nextProps.className
  )
})
