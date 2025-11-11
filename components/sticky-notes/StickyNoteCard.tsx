'use client';

/**
 * Sticky Note Card Component
 * Displays a single sticky note with actions, reactions, and replies
 */

import { useState } from 'react';
import { StickyNoteWithDetails, NOTE_TYPE_CONFIG } from '@/types/sticky-notes.types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  MessageSquare,
  Pin,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
} from 'lucide-react';
import EmojiReactions from './EmojiReactions';

interface StickyNoteCardProps {
  note: StickyNoteWithDetails;
  onReply?: (noteId: string) => void;
  onEdit?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onTogglePin?: (noteId: string, isPinned: boolean) => void;
  onToggleResolve?: (noteId: string, isResolved: boolean) => void;
  onReaction?: (noteId: string, emoji: string) => void;
  onRemoveReaction?: (noteId: string, emoji: string) => void;
  currentUserId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  showReplies?: boolean;
  className?: string;
}

export default function StickyNoteCard({
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
  const [showActions, setShowActions] = useState(false);

  const config = NOTE_TYPE_CONFIG[note.note_type];
  const isAuthor = note.author_id === currentUserId;
  const canModify = canEdit || isAuthor;
  const canRemove = canDelete || isAuthor;

  // Format created date
  const createdAt = formatDistanceToNow(new Date(note.created_at), {
    addSuffix: true,
    locale: tr,
  });

  // Render content with mentions highlighted
  const renderContent = (html: string) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div
      className={`sticky-note-card ${note.is_resolved ? 'resolved' : ''} ${className}`}
      style={{ borderLeftColor: config.color }}
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
              <img src={note.author.avatar_url} alt={note.author.full_name || 'User'} className="author-avatar" />
            ) : (
              <div className="author-avatar-placeholder">
                {note.author?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="author-name">{note.author?.full_name || 'Unknown'}</div>
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
              onClick={() => setShowActions(!showActions)}
              className="note-actions-button"
              title="İşlemler"
            >
              <MoreVertical size={18} />
            </button>

            {showActions && (
              <div className="note-actions-dropdown">
                {onTogglePin && (
                  <button onClick={() => onTogglePin(note.id, !note.is_pinned)}>
                    <Pin size={16} />
                    {note.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                  </button>
                )}
                {onToggleResolve && (
                  <button onClick={() => onToggleResolve(note.id, !note.is_resolved)}>
                    <Check size={16} />
                    {note.is_resolved ? 'Yeniden Aç' : 'Çözüldü Olarak İşaretle'}
                  </button>
                )}
                {canModify && onEdit && (
                  <button onClick={() => onEdit(note.id)}>
                    <Edit2 size={16} />
                    Düzenle
                  </button>
                )}
                {canRemove && onDelete && (
                  <button onClick={() => onDelete(note.id)} className="danger">
                    <Trash2 size={16} />
                    Sil
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sticky-note-content">
        {renderContent(note.content)}
      </div>

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
      {note.mentions && note.mentions.length > 0 && (
        <div className="note-mentions-indicator">
          <span>👥 </span>
          <span>
            {note.mentions.map((m) => m.mentioned_user?.full_name).filter(Boolean).join(', ')} etiketlendi
          </span>
        </div>
      )}
    </div>
  );
}
