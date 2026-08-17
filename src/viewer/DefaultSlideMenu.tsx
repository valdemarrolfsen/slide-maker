import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { defaultSlides } from 'virtual:slide-maker/default-slides';
import { Plus } from './Icons';
import { SlideFrame } from './SlideFrame';
import type { DeckConfig } from './types';

const THUMB_WIDTH = 152;

interface DefaultSlideMenuProps {
  config: DeckConfig;
  pending: boolean;
  error: string | null;
  onPick: (defaultSlide: string) => void;
}

/**
 * The Add slide gallery.
 *
 * A popover rather than the native select the style picker uses, because the
 * thing worth showing is the layout, and no select can draw one. The previews
 * are the real default-slide components rendered small, in the deck's own style:
 * the studio has already loaded that stylesheet, so a default slide mounted here
 * picks it up for free and the gallery restyles with the deck.
 */
export function DefaultSlideMenu({ config, pending, error, onPick }: DefaultSlideMenuProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scale = THUMB_WIDTH / config.width;

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        // Stop the studio's own Escape handler from also closing a draft.
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDown);
    // Capture, so Escape reaches this before the window-level shortcut handler.
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  // Moving focus onto the highlighted card is what makes the arrow keys work:
  // the browser scrolls it into view and screen readers announce it.
  useLayoutEffect(() => {
    if (!open) return;
    const cards = panelRef.current?.querySelectorAll<HTMLButtonElement>('.sm-tmpl-card');
    cards?.[cursor]?.focus();
  }, [open, cursor]);

  const move = (delta: number) => {
    setCursor((current) => Math.max(0, Math.min(defaultSlides.length - 1, current + delta)));
  };

  /** How many cards sit on a row, so Up and Down move by a row rather than one. */
  const columns = () => {
    const panel = panelRef.current;
    if (!panel) return 1;
    const grid = panel.querySelector('.sm-tmpl-grid');
    if (!grid) return 1;
    return Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
  };

  const label = pending ? 'Adding…' : error ? 'Could not add' : 'Add slide';

  return (
    <div className="sm-tmpl" ref={rootRef}>
      <button
        type="button"
        className={`sm-tmpl-trigger${error ? ' sm-tmpl-trigger-error' : ''}`}
        disabled={pending || defaultSlides.length === 0}
        onClick={() => {
          setCursor(0);
          setOpen((v) => !v);
        }}
        title={error || 'Append one of this template\'s default slides'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Plus />
        {label}
        <i className="sm-tmpl-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="sm-tmpl-panel" ref={panelRef} role="menu" aria-label="Default slides">
          <div className="sm-tmpl-head">
            Start from a layout, then tell Claude what it should say
          </div>
          <div
            className="sm-tmpl-grid"
            onKeyDown={(event) => {
              const keys: Record<string, number> = {
                ArrowRight: 1,
                ArrowLeft: -1,
                ArrowDown: columns(),
                ArrowUp: -columns(),
              };
              const delta = keys[event.key];
              if (delta === undefined) return;
              event.preventDefault();
              move(delta);
            }}
          >
            {defaultSlides.map((defaultSlide, index) => (
              <button
                key={defaultSlide.id}
                type="button"
                role="menuitem"
                className="sm-tmpl-card"
                tabIndex={index === cursor ? 0 : -1}
                title={defaultSlide.description}
                onFocus={() => setCursor(index)}
                onClick={() => {
                  setOpen(false);
                  onPick(defaultSlide.id);
                }}
              >
                <span
                  className="sm-tmpl-thumb"
                  style={{ width: THUMB_WIDTH, height: config.height * scale }}
                >
                  <span
                    className="sm-tmpl-frame"
                    style={{
                      width: config.width,
                      height: config.height,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                    // Decoration: the card's label is what carries the meaning.
                    aria-hidden="true"
                  >
                    <SlideFrame slide={defaultSlide} total={1} config={config} />
                  </span>
                </span>
                <span className="sm-tmpl-name">
                  {defaultSlide.label}
                  {defaultSlide.source === 'local' && <i className="sm-tmpl-local">local</i>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
