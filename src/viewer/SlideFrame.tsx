import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SlideContext } from 'slide-maker/runtime';
import type { DeckConfig, SlideEntry } from './types';

interface BoundaryProps {
  slide: SlideEntry;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

/**
 * Keeps one broken slide from taking down the studio.
 *
 * A deck is usually mid-edit, so a slide that throws is an expected state, not
 * an exceptional one. Showing the message in place of the slide is far more
 * useful than a blank page plus a console trace.
 */
class SlideBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[slide-maker] ${this.props.slide.file} failed to render`, error, info);
  }

  componentDidUpdate(prev: BoundaryProps) {
    // A hot update replaces the module, so clear the error and try again.
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sm-slide sm-error-slide">
          <div className="sm-error-title">{this.props.slide.file} failed to render</div>
          <pre className="sm-error-body">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SlideFrameProps {
  slide: SlideEntry;
  total: number;
  config: DeckConfig;
}

/** Renders a single slide with the deck metadata its runtime components read. */
export function SlideFrame({ slide, total, config }: SlideFrameProps) {
  const SlideComponent = slide.module?.default;

  if (!SlideComponent) {
    return (
      <div className="sm-slide sm-error-slide">
        <div className="sm-error-title">{slide.file} has no default export</div>
        <pre className="sm-error-body">
          {`export default function Slide() {\n  return <Slide>...</Slide>\n}`}
        </pre>
      </div>
    );
  }

  return (
    <SlideContext.Provider
      value={{ index: slide.index, total, deckTitle: config.title, id: slide.id }}
    >
      <SlideBoundary slide={slide}>
        <SlideComponent />
      </SlideBoundary>
    </SlideContext.Provider>
  );
}
