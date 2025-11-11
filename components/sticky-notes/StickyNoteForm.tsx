'use client';

/**
 * Sticky Note Form Component
 * Form for creating/editing sticky notes with rich text and mentions
 */

import { useState, useRef, useEffect } from 'react';
import {
  NoteType,
  NOTE_TYPES,
  NOTE_TYPE_CONFIG,
  MentionSuggestion,
  CreateStickyNoteRequest,
} from '@/types/sticky-notes.types';
import RichTextEditor, { RichTextEditorHandle } from './RichTextEditor';
import { X, Send } from 'lucide-react';

interface StickyNoteFormProps {
  workspaceId: string;
  patientId?: string | null;
  parentId?: string | null;
  workspaceMembers: MentionSuggestion[];
  initialContent?: string;
  initialNoteType?: NoteType;
  onSubmit: (data: CreateStickyNoteRequest) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isReply?: boolean;
  className?: string;
}

export default function StickyNoteForm({
  workspaceId,
  patientId,
  parentId,
  workspaceMembers,
  initialContent = '',
  initialNoteType = NOTE_TYPES.INFO,
  onSubmit,
  onCancel,
  submitButtonText = 'Gönder',
  isReply = false,
  className = '',
}: StickyNoteFormProps) {
  const [noteType, setNoteType] = useState<NoteType>(initialNoteType);
  const [content, setContent] = useState(initialContent);
  const [mentions, setMentions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => {
    // Focus editor on mount if it's a reply form
    if (isReply) {
      setTimeout(() => {
        editorRef.current?.focus();
      }, 100);
    }
  }, [isReply]);

  const handleContentChange = (newContent: string, newMentions: string[]) => {
    setContent(newContent);
    setMentions(newMentions);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length === 0) {
      setError('Not içeriği boş olamaz');
      return;
    }

    if (plainText.length > 5000) {
      setError('Not içeriği 5000 karakterden uzun olamaz');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        workspace_id: workspaceId,
        patient_id: patientId,
        content,
        note_type: noteType,
        color: NOTE_TYPE_CONFIG[noteType].color,
        parent_id: parentId,
        mentions,
      });

      // Reset form
      setContent('');
      setMentions([]);
      setNoteType(NOTE_TYPES.INFO);
      editorRef.current?.clear();
    } catch (err: any) {
      setError(err.message || 'Not eklenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`sticky-note-form ${className}`}>
      {!isReply && (
        <div className="form-header">
          <h3>Yeni Not</h3>
          {onCancel && (
            <button type="button" onClick={onCancel} className="close-button">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      {/* Note type selector */}
      {!isReply && (
        <div className="note-type-selector">
          {Object.values(NOTE_TYPES).map((type) => {
            const config = NOTE_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                className={`note-type-option ${noteType === type ? 'selected' : ''}`}
                onClick={() => setNoteType(type)}
                style={{
                  borderColor: noteType === type ? config.color : 'transparent',
                  backgroundColor: noteType === type ? config.bgColor : 'transparent',
                }}
              >
                <span className="note-type-icon">{config.icon}</span>
                <span className="note-type-label">{config.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Rich text editor */}
      <div className="form-field">
        <RichTextEditor
          ref={editorRef}
          content={content}
          onChange={handleContentChange}
          placeholder={isReply ? 'Yanıtınızı yazın, @ ile etiketleyin...' : 'Notunuzu yazın, @ ile birini etiketleyin...'}
          workspaceMembers={workspaceMembers}
          disabled={isSubmitting}
          minHeight={isReply ? '80px' : '120px'}
          maxHeight="400px"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="form-error">
          <span>{error}</span>
        </div>
      )}

      {/* Mentions preview */}
      {mentions.length > 0 && (
        <div className="mentions-preview">
          <span className="mentions-label">Etiketlenenler:</span>
          <div className="mentions-list">
            {mentions.map((userId) => {
              const member = workspaceMembers.find((m) => m.id === userId);
              return member ? (
                <span key={userId} className="mention-tag">
                  {member.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-button" disabled={isSubmitting}>
            İptal
          </button>
        )}
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="loading-spinner">Gönderiliyor...</span>
          ) : (
            <>
              <Send size={16} />
              <span>{submitButtonText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
