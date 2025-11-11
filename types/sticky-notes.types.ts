/**
 * Sticky Notes & Communication Types
 * Phase 4: Types for sticky notes, mentions, and reactions
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const NOTE_TYPES = {
  URGENT: 'urgent',
  IMPORTANT: 'important',
  INFO: 'info',
  ROUTINE: 'routine',
  QUESTION: 'question',
} as const;

export type NoteType = (typeof NOTE_TYPES)[keyof typeof NOTE_TYPES];

// Note type configurations
export const NOTE_TYPE_CONFIG: Record<
  NoteType,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
  }
> = {
  urgent: {
    label: 'Acil',
    color: '#dc2626',
    bgColor: '#fef2f2',
    icon: '🔴',
  },
  important: {
    label: 'Önemli',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: '🟡',
  },
  info: {
    label: 'Bilgi',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    icon: '🔵',
  },
  routine: {
    label: 'Rutin',
    color: '#10b981',
    bgColor: '#f0fdf4',
    icon: '🟢',
  },
  question: {
    label: 'Soru',
    color: '#8b5cf6',
    bgColor: '#faf5ff',
    icon: '🟣',
  },
};

// Popular emoji reactions
export const POPULAR_REACTIONS = [
  '👍',
  '❤️',
  '🔥',
  '👀',
  '✅',
  '🎉',
  '💯',
  '🙏',
] as const;

// ============================================
// DATABASE TYPES
// ============================================

/**
 * Sticky Note from database
 */
export interface StickyNote {
  id: string;
  workspace_id: string;
  patient_id: string | null;
  content: string;
  note_type: NoteType;
  color: string;
  position_x: number | null;
  position_y: number | null;
  sort_order: number;
  is_pinned: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  parent_id: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Note Mention from database
 */
export interface NoteMention {
  id: string;
  note_id: string;
  mentioned_user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Note Reaction from database
 */
export interface NoteReaction {
  id: string;
  note_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// ============================================
// EXTENDED TYPES (with relations)
// ============================================

/**
 * Sticky Note with author info
 */
export interface StickyNoteWithAuthor extends StickyNote {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

/**
 * Sticky Note with full details (author, mentions, reactions, replies)
 */
export interface StickyNoteWithDetails extends StickyNoteWithAuthor {
  mentions: (NoteMention & {
    mentioned_user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  })[];
  reactions: (NoteReaction & {
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  })[];
  replies: StickyNoteWithAuthor[];
  replies_count: number;
}

/**
 * Mention with note details
 */
export interface MentionWithNote extends NoteMention {
  note: StickyNoteWithAuthor | null;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Create sticky note request
 */
export interface CreateStickyNoteRequest {
  workspace_id: string;
  patient_id?: string | null;
  content: string;
  note_type: NoteType;
  color?: string;
  parent_id?: string | null;
  mentions?: string[]; // Array of user IDs to mention
}

/**
 * Update sticky note request
 */
export interface UpdateStickyNoteRequest {
  content?: string;
  note_type?: NoteType;
  color?: string;
  is_pinned?: boolean;
  is_resolved?: boolean;
  position_x?: number | null;
  position_y?: number | null;
  sort_order?: number;
}

/**
 * Sticky notes list response
 */
export interface StickyNotesResponse {
  notes: StickyNoteWithDetails[];
  total: number;
  has_more: boolean;
}

/**
 * Create reaction request
 */
export interface CreateReactionRequest {
  note_id: string;
  emoji: string;
}

/**
 * Reactions grouped by emoji
 */
export interface ReactionGroup {
  emoji: string;
  count: number;
  users: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  user_reacted: boolean; // Whether current user has reacted with this emoji
}

// ============================================
// FILTER & SORT TYPES
// ============================================

export interface StickyNotesFilters {
  workspace_id: string;
  patient_id?: string | null;
  note_type?: NoteType | NoteType[];
  is_pinned?: boolean;
  is_resolved?: boolean;
  author_id?: string;
  parent_id?: string | null; // null = top-level notes only, undefined = all
  search?: string;
}

export type StickyNotesSortBy =
  | 'created_at'
  | 'updated_at'
  | 'sort_order'
  | 'note_type';

export type StickyNotesSortOrder = 'asc' | 'desc';

export interface StickyNotesQuery extends StickyNotesFilters {
  sort_by?: StickyNotesSortBy;
  sort_order?: StickyNotesSortOrder;
  limit?: number;
  offset?: number;
}

// ============================================
// UI STATE TYPES
// ============================================

/**
 * Sticky note form state
 */
export interface StickyNoteFormState {
  content: string;
  note_type: NoteType;
  color: string;
  mentions: string[];
  parent_id: string | null;
}

/**
 * Mention suggestion
 */
export interface MentionSuggestion {
  id: string;
  label: string; // Display name
  email?: string;
  avatar_url?: string | null;
}

/**
 * Note editor state
 */
export interface NoteEditorState {
  isEditing: boolean;
  content: string;
  mentions: string[];
}

// ============================================
// REALTIME TYPES
// ============================================

/**
 * Realtime sticky note event
 */
export interface RealtimeStickyNoteEvent {
  event_type: 'INSERT' | 'UPDATE' | 'DELETE';
  note: StickyNote;
  old_note?: StickyNote;
}

/**
 * Realtime mention event
 */
export interface RealtimeMentionEvent {
  event_type: 'INSERT' | 'UPDATE' | 'DELETE';
  mention: NoteMention;
}

/**
 * Realtime reaction event
 */
export interface RealtimeReactionEvent {
  event_type: 'INSERT' | 'DELETE';
  reaction: NoteReaction;
}

// ============================================
// VALIDATION SCHEMAS (Zod)
// ============================================

export interface StickyNoteValidation {
  content: {
    min: number;
    max: number;
  };
  mentions: {
    max: number;
  };
}

export const STICKY_NOTE_VALIDATION: StickyNoteValidation = {
  content: {
    min: 1,
    max: 5000,
  },
  mentions: {
    max: 10,
  },
};

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Note with temporary ID (for optimistic updates)
 */
export interface OptimisticStickyNote extends StickyNoteWithAuthor {
  _isOptimistic?: boolean;
  _tempId?: string;
}

/**
 * Note thread (parent note with replies)
 */
export interface NoteThread {
  parent: StickyNoteWithDetails;
  replies: StickyNoteWithAuthor[];
}

/**
 * Unread mentions summary
 */
export interface UnreadMentionsSummary {
  total_unread: number;
  by_note_type: Record<NoteType, number>;
  recent_mentions: MentionWithNote[];
}

// ============================================
// EXPORT ALL
// ============================================

export type {
  // Database types
  StickyNote,
  NoteMention,
  NoteReaction,
  // Extended types
  StickyNoteWithAuthor,
  StickyNoteWithDetails,
  MentionWithNote,
  // API types
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  StickyNotesResponse,
  CreateReactionRequest,
  ReactionGroup,
  // Filter types
  StickyNotesFilters,
  StickyNotesQuery,
  // UI types
  StickyNoteFormState,
  MentionSuggestion,
  NoteEditorState,
  // Realtime types
  RealtimeStickyNoteEvent,
  RealtimeMentionEvent,
  RealtimeReactionEvent,
  // Utility types
  OptimisticStickyNote,
  NoteThread,
  UnreadMentionsSummary,
};
