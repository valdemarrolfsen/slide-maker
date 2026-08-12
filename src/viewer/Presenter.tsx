import { useCallback, useEffect, useState } from 'react';
import { config, slides } from 'virtual:slide-maker/deck';
import { SlideFrame } from './SlideFrame';

/**
 * The standalone deck.
 *
 * Every slide is in the DOM at once and only the current one is shown. That
 * costs nothing at deck sizes and buys two things: instant navigation with no
 * mount flash, and a print stylesheet that can reveal all of them for a
 * one-page-per-slide PDF without any JavaScript running.
 */
export function Presenter() {
  const [index, setIndex] = useState(() => {
    const fromHash = Number.parseInt(window.location.hash.slice(1), 10);
    return Number.isFinite(fromHash) && fromHash > 0 ? fromHash - 1 : 0;
  });
  const [scale, setScale] = useState(1);
  const [hintVisible, setHintVisible] = useState(true);

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  }, []);

  useEffect(() => {
    const fit = () => {
      setScale(Math.min(window.innerWidth / config.width, window.innerHeight / config.height));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const next = `#${index + 1}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [index]);

  // The hash is a real address, not just a bookmark: editing it, using browser
  // back, or driving the deck from a script all page through it. Headless
  // rendering navigates this way too.
  useEffect(() => {
    const onHashChange = () => {
      const n = Number.parseInt(window.location.hash.slice(1), 10);
      if (Number.isFinite(n) && n > 0) go(n - 1);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          go(index + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          go(index - 1);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(slides.length - 1);
          break;
        case 'f':
        case 'F':
          document.documentElement.requestFullscreen?.().catch(() => {});
          break;
        case 'p':
        case 'P':
          window.print();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="sm-present">
      {slides.map((slide) => (
        <div
          key={slide.id}
          className={`sm-present-slide${slide.index === index ? ' sm-present-on' : ''}`}
          style={{ transform: `scale(${scale})` }}
        >
          <SlideFrame slide={slide} total={slides.length} config={config} />
        </div>
      ))}

      <div
        className="sm-present-hit sm-present-prev"
        onClick={() => go(index - 1)}
        aria-hidden="true"
      />
      <div
        className="sm-present-hit sm-present-next"
        onClick={() => go(index + 1)}
        aria-hidden="true"
      />

      {hintVisible && (
        <div className="sm-present-hint">← → to navigate · P to print · F for fullscreen</div>
      )}
      <div className="sm-present-counter">
        {pad(index + 1)} / {pad(slides.length)}
      </div>
    </div>
  );
}
