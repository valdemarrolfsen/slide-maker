import { useEffect, useRef } from 'react';
import { SlideFrame } from './SlideFrame';
import type { Comment, DeckConfig, SlideEntry } from './types';

const THUMB_WIDTH = 168;

interface FilmstripProps {
  slides: SlideEntry[];
  config: DeckConfig;
  activeIndex: number;
  comments: Comment[];
  onSelect: (index: number) => void;
}

/**
 * The slide rail.
 *
 * Thumbnails are the real slides rendered at a small scale rather than
 * screenshots, so they update the moment a file is saved and never drift out
 * of date with what the stage is showing.
 */
export function Filmstrip({ slides, config, activeIndex, comments, onSelect }: FilmstripProps) {
  const scale = THUMB_WIDTH / config.width;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  const openBySlide = new Map<string, number>();
  for (const comment of comments) {
    if (comment.status !== 'open') continue;
    openBySlide.set(comment.slideId, (openBySlide.get(comment.slideId) ?? 0) + 1);
  }

  return (
    <nav className="sm-filmstrip" ref={listRef} aria-label="Slides">
      {slides.map((slide) => {
        const open = openBySlide.get(slide.id) ?? 0;
        return (
          <button
            key={slide.id}
            type="button"
            data-active={slide.index === activeIndex}
            className={`sm-thumb${slide.index === activeIndex ? ' sm-thumb-on' : ''}`}
            onClick={() => onSelect(slide.index)}
            title={slide.file}
          >
            <span className="sm-thumb-no">{String(slide.number).padStart(2, '0')}</span>
            <span
              className="sm-thumb-box"
              style={{ width: THUMB_WIDTH, height: config.height * scale }}
            >
              <span
                className="sm-thumb-frame"
                style={{
                  width: config.width,
                  height: config.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                // Thumbnails are decoration; the button label carries the meaning.
                aria-hidden="true"
              >
                <SlideFrame slide={slide} total={slides.length} config={config} />
              </span>
            </span>
            {open > 0 && <span className="sm-thumb-badge">{open}</span>}
          </button>
        );
      })}
    </nav>
  );
}
