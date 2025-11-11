'use client';

/**
 * Rich Text Editor with @mention support using TipTap
 */

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MentionSuggestion } from '@/types/sticky-notes.types';
import './RichTextEditor.css';

// Mention suggestion component
import MentionList from './MentionList';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string, mentions: string[]) => void;
  placeholder?: string;
  workspaceMembers: MentionSuggestion[];
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

export interface RichTextEditorHandle {
  focus: () => void;
  clear: () => void;
  getContent: () => string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      content,
      onChange,
      placeholder = 'Type @ to mention someone...',
      workspaceMembers,
      disabled = false,
      minHeight = '100px',
      maxHeight = '300px',
      className = '',
    },
    ref
  ) => {
    // Extract mentions from content
    const extractMentions = useCallback((html: string): string[] => {
      const mentionRegex = /data-id="([^"]+)"/g;
      const mentions: string[] = [];
      let match;

      while ((match = mentionRegex.exec(html)) !== null) {
        if (match[1] && !mentions.includes(match[1])) {
          mentions.push(match[1]);
        }
      }

      return mentions;
    }, []);

    // Mention suggestion configuration
    const mentionSuggestion = {
      items: ({ query }: { query: string }) => {
        return workspaceMembers
          .filter((member) =>
            member.label.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 10);
      },
      render: () => {
        let component: any;
        let popup: any;

        return {
          onStart: (props: any) => {
            component = new MentionList({
              props,
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            popup = document.createElement('div');
            popup.className = 'mention-suggestions-popup';
            document.body.appendChild(popup);
            popup.appendChild(component.element);

            const rect = props.clientRect();
            if (rect) {
              popup.style.top = `${rect.bottom + window.scrollY}px`;
              popup.style.left = `${rect.left + window.scrollX}px`;
            }
          },

          onUpdate(props: any) {
            component.updateProps(props);

            if (!props.clientRect) {
              return;
            }

            const rect = props.clientRect();
            if (rect && popup) {
              popup.style.top = `${rect.bottom + window.scrollY}px`;
              popup.style.left = `${rect.left + window.scrollX}px`;
            }
          },

          onKeyDown(props: any) {
            if (props.event.key === 'Escape') {
              popup?.remove();
              return true;
            }

            return component.ref?.onKeyDown(props);
          },

          onExit() {
            popup?.remove();
            component.destroy();
          },
        };
      },
    };

    // Initialize editor
    const editor = useEditor({
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: 'mention',
          },
          suggestion: mentionSuggestion,
        }),
      ],
      content,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const mentions = extractMentions(html);
        onChange(html, mentions);
      },
    });

    // Update editor content when prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    // Update disabled state
    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [disabled, editor]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus();
      },
      clear: () => {
        editor?.commands.clearContent();
      },
      getContent: () => {
        return editor?.getHTML() || '';
      },
    }));

    if (!editor) {
      return null;
    }

    return (
      <div
        className={`rich-text-editor ${disabled ? 'disabled' : ''} ${className}`}
        style={{
          minHeight,
          maxHeight,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
