'use client';

/**
 * Emoji Reactions Component
 * Display and manage emoji reactions on sticky notes
 */

import { useState, useRef, useEffect } from 'react';
import { NoteReaction, POPULAR_REACTIONS } from '@/types/sticky-notes.types';
import { Smile, Plus } from 'lucide-react';

interface EmojiReactionsProps {
  noteId: string;
  reactions: NoteReaction[];
  currentUserId: string;
  onReaction?: (noteId: string, emoji: string) => void;
  onRemoveReaction?: (noteId: string, emoji: string) => void;
}

export default function EmojiReactions({
  noteId,
  reactions,
  currentUserId,
  onReaction,
  onRemoveReaction,
}: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
          userReacted: false,
        };
      }
      acc[reaction.emoji].count++;
      if (reaction.user_id === currentUserId) {
        acc[reaction.emoji].userReacted = true;
      }
      return acc;
    },
    {} as Record<string, { count: number; users: any[]; userReacted: boolean }>
  );

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleReactionClick = (emoji: string) => {
    const group = groupedReactions[emoji];

    if (group?.userReacted) {
      onRemoveReaction?.(noteId, emoji);
    } else {
      onReaction?.(noteId, emoji);
    }

    setShowPicker(false);
  };

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className="emoji-reactions">
      {/* Existing reactions */}
      {hasReactions && (
        <div className="reactions-list">
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <button
              key={emoji}
              className={`reaction-button ${data.userReacted ? 'reacted' : ''}`}
              onClick={() => handleReactionClick(emoji)}
              title={data.userReacted ? 'Tepkini kaldır' : 'Tepki ver'}
            >
              <span className="reaction-emoji">{emoji}</span>
              {data.count > 1 && <span className="reaction-count">{data.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      {onReaction && (
        <div className="reaction-picker-container" ref={pickerRef}>
          <button
            className="add-reaction-button"
            onClick={() => setShowPicker(!showPicker)}
            title="Tepki ekle"
          >
            {hasReactions ? <Plus size={14} /> : <Smile size={14} />}
          </button>

          {showPicker && (
            <div className="emoji-picker">
              <div className="emoji-picker-header">Tepki seç</div>
              <div className="emoji-picker-grid">
                {POPULAR_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-option"
                    onClick={() => handleReactionClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
