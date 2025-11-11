'use client';

/**
 * Sticky Notes List Component
 * Display list of sticky notes with filtering and sorting
 */

import { useState } from 'react';
import { StickyNoteWithDetails, NoteType, NOTE_TYPES, NOTE_TYPE_CONFIG } from '@/types/sticky-notes.types';
import StickyNoteCard from './StickyNoteCard';
import { Filter, Pin, CheckCircle, AlertCircle } from 'lucide-react';

interface StickyNotesListProps {
  notes: StickyNoteWithDetails[];
  currentUserId: string;
  onReply?: (noteId: string) => void;
  onEdit?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onTogglePin?: (noteId: string, isPinned: boolean) => void;
  onToggleResolve?: (noteId: string, isResolved: boolean) => void;
  onReaction?: (noteId: string, emoji: string) => void;
  onRemoveReaction?: (noteId: string, emoji: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  showFilters?: boolean;
  showRepliesInline?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function StickyNotesList({
  notes,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleResolve,
  onReaction,
  onRemoveReaction,
  canEdit = false,
  canDelete = false,
  showFilters = true,
  showRepliesInline = false,
  emptyMessage = 'Henüz not yok',
  className = '',
}: StickyNotesListProps) {
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [filterResolved, setFilterResolved] = useState<boolean | 'all'>('all');
  const [filterPinned, setFilterPinned] = useState<boolean | 'all'>('all');

  // Apply filters
  const filteredNotes = notes.filter((note) => {
    // Type filter
    if (filterType !== 'all' && note.note_type !== filterType) {
      return false;
    }

    // Resolved filter
    if (filterResolved !== 'all' && note.is_resolved !== filterResolved) {
      return false;
    }

    // Pinned filter
    if (filterPinned !== 'all' && note.is_pinned !== filterPinned) {
      return false;
    }

    return true;
  });

  // Sort notes: pinned first, then by created_at
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // Pinned notes first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    // Then by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Stats
  const stats = {
    total: notes.length,
    pinned: notes.filter((n) => n.is_pinned).length,
    resolved: notes.filter((n) => n.is_resolved).length,
    urgent: notes.filter((n) => n.note_type === NOTE_TYPES.URGENT).length,
  };

  return (
    <div className={`sticky-notes-list ${className}`}>
      {/* Stats & Filters */}
      {showFilters && notes.length > 0 && (
        <div className="notes-controls">
          {/* Stats */}
          <div className="notes-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Toplam</span>
            </div>
            {stats.pinned > 0 && (
              <div className="stat-item">
                <Pin size={14} />
                <span className="stat-value">{stats.pinned}</span>
              </div>
            )}
            {stats.urgent > 0 && (
              <div className="stat-item urgent">
                <AlertCircle size={14} />
                <span className="stat-value">{stats.urgent}</span>
              </div>
            )}
            {stats.resolved > 0 && (
              <div className="stat-item">
                <CheckCircle size={14} />
                <span className="stat-value">{stats.resolved}</span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="notes-filters">
            <button
              className="filter-toggle"
              onClick={() => {
                // Reset filters
                setFilterType('all');
                setFilterResolved('all');
                setFilterPinned('all');
              }}
            >
              <Filter size={16} />
              <span>Filtreler</span>
            </button>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NoteType | 'all')}
              className="filter-select"
            >
              <option value="all">Tüm Tipler</option>
              {Object.values(NOTE_TYPES).map((type) => (
                <option key={type} value={type}>
                  {NOTE_TYPE_CONFIG[type].icon} {NOTE_TYPE_CONFIG[type].label}
                </option>
              ))}
            </select>

            {/* Status filters */}
            <select
              value={filterResolved === 'all' ? 'all' : filterResolved ? 'resolved' : 'active'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setFilterResolved('all');
                } else if (e.target.value === 'resolved') {
                  setFilterResolved(true);
                } else {
                  setFilterResolved(false);
                }
              }}
              className="filter-select"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="resolved">Çözüldü</option>
            </select>
          </div>
        </div>
      )}

      {/* Notes list */}
      {sortedNotes.length === 0 ? (
        <div className="notes-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="notes-grid">
          {sortedNotes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              onToggleResolve={onToggleResolve}
              onReaction={onReaction}
              onRemoveReaction={onRemoveReaction}
              canEdit={canEdit}
              canDelete={canDelete}
              showReplies={!showRepliesInline}
            />
          ))}
        </div>
      )}

      {/* Active filters indicator */}
      {(filterType !== 'all' || filterResolved !== 'all' || filterPinned !== 'all') && (
        <div className="active-filters-banner">
          <span>Filtre aktif: {filteredNotes.length} / {notes.length} not</span>
          <button
            onClick={() => {
              setFilterType('all');
              setFilterResolved('all');
              setFilterPinned('all');
            }}
            className="clear-filters-button"
          >
            Temizle
          </button>
        </div>
      )}
    </div>
  );
}
