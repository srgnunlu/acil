'use client';

/**
 * Mention List Component for TipTap Editor
 * Shows suggestion dropdown when typing @
 */

import { MentionSuggestion } from '@/types/sticky-notes.types';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface MentionListProps {
  items: MentionSuggestion[];
  command: (item: MentionSuggestion) => void;
}

interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionListComponent = forwardRef<
  MentionListHandle,
  MentionListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="mention-list-empty">
        <p>Kullanıcı bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="mention-list">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => selectItem(index)}
          type="button"
        >
          <div className="mention-item-avatar">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt={item.label} />
            ) : (
              <div className="mention-item-avatar-placeholder">
                {item.label.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mention-item-info">
            <div className="mention-item-name">{item.label}</div>
            {item.email && (
              <div className="mention-item-email">{item.email}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

MentionListComponent.displayName = 'MentionListComponent';

// Factory class for TipTap
export default class MentionList {
  public element: HTMLDivElement;
  public ref: MentionListHandle | null = null;
  private props: any;
  private editor: any;

  constructor({ props, editor }: { props: any; editor: any }) {
    this.props = props;
    this.editor = editor;
    this.element = document.createElement('div');
    this.render();
  }

  updateProps(props: any) {
    this.props = props;
    this.render();
  }

  render() {
    const { createElement } = require('react');
    const { createRoot } = require('react-dom/client');

    if (!(this.element as any)._reactRoot) {
      (this.element as any)._reactRoot = createRoot(this.element);
    }

    (this.element as any)._reactRoot.render(
      createElement(MentionListComponent, {
        ...this.props,
        ref: (ref: MentionListHandle) => {
          this.ref = ref;
        },
      })
    );
  }

  destroy() {
    if ((this.element as any)._reactRoot) {
      (this.element as any)._reactRoot.unmount();
    }
    this.element.remove();
  }
}
