'use client'

/**
 * Rich Text Editor with @mention support using TipTap
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import { MentionSuggestion } from '@/types/sticky-notes.types'
import './RichTextEditor.css'

// Mention suggestion component
import MentionList from './MentionList'

interface RichTextEditorProps {
  content: string
  onChange: (content: string, mentions: string[]) => void
  placeholder?: string
  workspaceMembers: MentionSuggestion[]
  disabled?: boolean
  minHeight?: string
  maxHeight?: string
  className?: string
}

export interface RichTextEditorHandle {
  focus: () => void
  clear: () => void
  getContent: () => string
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
    // Fix SSR hydration issue - use useState with initial value instead of useEffect
    const [mounted] = useState(true)
    // Extract mentions from content
    const extractMentions = useCallback((html: string): string[] => {
      const mentionRegex = /data-id="([^"]+)"/g
      const mentions: string[] = []
      let match

      while ((match = mentionRegex.exec(html)) !== null) {
        if (match[1] && !mentions.includes(match[1])) {
          mentions.push(match[1])
        }
      }

      return mentions
    }, [])

    // Mention suggestion configuration - memoize to avoid recreation
    const mentionSuggestion = useMemo(
      () => ({
        items: ({ query }: { query: string }) => {
          if (!workspaceMembers || workspaceMembers.length === 0) {
            return []
          }

          // If query is empty, show all members (up to 10)
          if (!query || query.trim() === '') {
            return workspaceMembers.slice(0, 10)
          }

          return workspaceMembers
            .filter((member) => {
              const label = member.label?.toLowerCase() || ''
              const email = member.email?.toLowerCase() || ''
              const queryLower = query.toLowerCase()
              return label.includes(queryLower) || email.includes(queryLower)
            })
            .slice(0, 10)
        },
        render: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let component: any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let popup: any
          let isMounted = true

          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart: (props: any) => {
              if (!isMounted) return

              try {
                component = new MentionList({
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) {
                  return
                }

                popup = document.createElement('div')
                popup.className = 'mention-suggestions-popup'
                document.body.appendChild(popup)
                popup.appendChild(component.element)

                const rect = props.clientRect()
                if (rect) {
                  popup.style.top = `${rect.bottom + window.scrollY}px`
                  popup.style.left = `${rect.left + window.scrollX}px`
                }
              } catch {
                // Silently ignore errors
              }
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate(props: any) {
              if (!isMounted || !component) return

              try {
                component.updateProps(props)

                if (!props.clientRect) {
                  return
                }

                const rect = props.clientRect()
                if (rect && popup) {
                  popup.style.top = `${rect.bottom + window.scrollY}px`
                  popup.style.left = `${rect.left + window.scrollX}px`
                }
              } catch {
                // Silently ignore errors
              }
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onKeyDown(props: any) {
              if (!isMounted) return false

              try {
                if (props.event.key === 'Escape') {
                  popup?.remove()
                  return true
                }

                return component?.ref?.onKeyDown(props) || false
              } catch (error) {
                return false
              }
            },

            onExit() {
              isMounted = false
              try {
                if (popup) {
                  popup.remove()
                  popup = null
                }
                if (component) {
                  component.destroy()
                  component = null
                }
              } catch (error) {
                // Silently ignore cleanup errors
              }
            },
          }
        },
      }),
      [workspaceMembers]
    )

    // Initialize editor
    const editor = useEditor({
      immediatelyRender: false,
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
        const html = editor.getHTML()
        const mentions = extractMentions(html)
        onChange(html, mentions)
      },
    })

    // Update editor content when prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        try {
          editor.commands.setContent(content)
        } catch (error) {
          // Silently ignore content update errors
        }
      }
    }, [content, editor])

    // Update disabled state
    useEffect(() => {
      if (editor) {
        try {
          editor.setEditable(!disabled)
        } catch (error) {
          // Silently ignore editable state errors
        }
      }
    }, [disabled, editor])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        try {
          if (editor) {
            editor.destroy()
          }
        } catch (error) {
          // Silently ignore cleanup errors
        }
      }
    }, [editor])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus()
      },
      clear: () => {
        editor?.commands.clearContent()
      },
      getContent: () => {
        return editor?.getHTML() || ''
      },
    }))

    if (!mounted || !editor) {
      return (
        <div
          className={`rich-text-editor ${disabled ? 'disabled' : ''} ${className}`}
          style={{
            minHeight,
            maxHeight,
          }}
        >
          <div style={{ padding: '12px', color: '#9ca3af' }}>Yükleniyor...</div>
        </div>
      )
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
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
