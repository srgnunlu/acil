'use client';

/**
 * Sticky Notes Panel
 * Complete panel with form, list, and real-time updates
 * Can be integrated into patient detail page
 */

import { useState, useCallback } from 'react';
import { useStickyNotes } from '@/lib/hooks/useStickyNotes';
import { MentionSuggestion, CreateStickyNoteRequest } from '@/types/sticky-notes.types';
import StickyNoteForm from './StickyNoteForm';
import StickyNotesList from './StickyNotesList';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';
import './StickyNotes.css';

interface StickyNotesPanelProps {
  workspaceId: string;
  patientId?: string | null;
  currentUserId: string;
  workspaceMembers: MentionSuggestion[];
  canEdit?: boolean;
  canDelete?: boolean;
  showAddButton?: boolean;
  className?: string;
}

export default function StickyNotesPanel({
  workspaceId,
  patientId,
  currentUserId,
  workspaceMembers,
  canEdit = true,
  canDelete = false,
  showAddButton = true,
  className = '',
}: StickyNotesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [replyToNoteId, setReplyToNoteId] = useState<string | null>(null);

  // Use sticky notes hook with real-time
  const {
    notes,
    total,
    isLoading,
    error,
    realtimeConnected,
    refetch,
    createNote,
    deleteNote,
    togglePin,
    toggleResolve,
    addReaction,
    removeReaction,
    isCreating,
  } = useStickyNotes({
    workspaceId,
    patientId,
    realtime: true,
  });

  // Handle note submission
  const handleNoteSubmit = useCallback(
    async (data: CreateStickyNoteRequest) => {
      await createNote(data);
      setShowForm(false);
      setReplyToNoteId(null);
    },
    [createNote]
  );

  // Handle reply
  const handleReply = useCallback((noteId: string) => {
    setReplyToNoteId(noteId);
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(
    async (noteId: string) => {
      if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        await deleteNote(noteId);
      }
    },
    [deleteNote]
  );

  // Handle toggle pin
  const handleTogglePin = useCallback(
    async (noteId: string, isPinned: boolean) => {
      await togglePin({ noteId, isPinned });
    },
    [togglePin]
  );

  // Handle toggle resolve
  const handleToggleResolve = useCallback(
    async (noteId: string, isResolved: boolean) => {
      await toggleResolve({ noteId, isResolved });
    },
    [toggleResolve]
  );

  // Handle reaction
  const handleReaction = useCallback(
    async (noteId: string, emoji: string) => {
      await addReaction({ noteId, emoji });
    },
    [addReaction]
  );

  // Handle remove reaction
  const handleRemoveReaction = useCallback(
    async (noteId: string, emoji: string) => {
      await removeReaction({ noteId, emoji });
    },
    [removeReaction]
  );

  return (
    <div className={`sticky-notes-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <MessageSquarePlus size={20} />
          <h3>Notlar ve Yorumlar</h3>
          {realtimeConnected && (
            <span className="realtime-badge" title="Canlı güncellemeler aktif">
              🟢 Canlı
            </span>
          )}
        </div>
        <div className="panel-actions">
          <button onClick={() => refetch()} className="refresh-button" title="Yenile">
            <RefreshCw size={16} />
          </button>
          {showAddButton && canEdit && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="add-note-button"
              disabled={isCreating}
            >
              {showForm ? 'İptal' : 'Yeni Not'}
            </button>
          )}
        </div>
      </div>

      {/* Add note form */}
      {showForm && canEdit && (
        <StickyNoteForm
          workspaceId={workspaceId}
          patientId={patientId}
          parentId={replyToNoteId}
          workspaceMembers={workspaceMembers}
          onSubmit={handleNoteSubmit}
          onCancel={() => {
            setShowForm(false);
            setReplyToNoteId(null);
          }}
          isReply={!!replyToNoteId}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="panel-error">
          <p>Notlar yüklenirken bir hata oluştu</p>
          <button onClick={() => refetch()}>Tekrar Dene</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="panel-loading">
          <div className="spinner" />
          <p>Notlar yükleniyor...</p>
        </div>
      )}

      {/* Notes list */}
      {!isLoading && !error && (
        <StickyNotesList
          notes={notes}
          currentUserId={currentUserId}
          onReply={handleReply}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onToggleResolve={handleToggleResolve}
          onReaction={handleReaction}
          onRemoveReaction={handleRemoveReaction}
          canEdit={canEdit}
          canDelete={canDelete}
          showFilters={true}
          emptyMessage="Henüz not eklenmemiş. İlk notu siz ekleyin!"
        />
      )}

      {/* Stats footer */}
      {!isLoading && !error && notes.length > 0 && (
        <div className="panel-footer">
          <span className="note-count">Toplam {total} not</span>
        </div>
      )}
    </div>
  );
}
