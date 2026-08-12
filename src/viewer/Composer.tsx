import { useEffect, useRef, useState } from 'react';
import type { DraftComment } from './types';

interface ComposerProps {
  draft: DraftComment;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

/**
 * The floating note input.
 *
 * Anchored with percentages over the stage overlay, so it stays the same size
 * whatever the slide is scaled to. Flips to the other side of its anchor near
 * an edge so it never hangs off the stage.
 */
export function Composer({ draft, onSubmit, onCancel }: ComposerProps) {
  const [body, setBody] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [draft]);

  const submit = () => {
    const trimmed = body.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const flipX = draft.anchor.x > 0.66;
  const flipY = draft.anchor.y > 0.7;

  return (
    <div
      className="sm-composer"
      style={{
        left: `${draft.anchor.x * 100}%`,
        top: `${draft.anchor.y * 100}%`,
        transform: `translate(${flipX ? '-100%' : '-50%'}, ${flipY ? 'calc(-100% - 14px)' : '10px'})`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {draft.quote && (
        <div className="sm-composer-quote" title={draft.quote}>
          {draft.quote}
        </div>
      )}
      <textarea
        ref={inputRef}
        className="sm-composer-input"
        value={body}
        placeholder={
          draft.kind === 'selection'
            ? 'What should change about this?'
            : draft.kind === 'pin'
              ? 'Note about this spot'
              : 'Note about this slide'
        }
        rows={3}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="sm-composer-actions">
        <span className="sm-composer-hint">
          <kbd>⌘</kbd>
          <kbd>↵</kbd> to send
        </span>
        <div className="sm-composer-buttons">
          <button type="button" className="sm-btn sm-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="sm-btn sm-btn-primary"
            onClick={submit}
            disabled={!body.trim()}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
