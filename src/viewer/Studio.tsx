import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { config, slides } from 'virtual:slide-maker/deck';
import { template } from 'virtual:slide-maker/theme';
import * as api from './api';
import { CommentPanel } from './CommentPanel';
import { Composer } from './Composer';
import { Filmstrip } from './Filmstrip';
import { ChevronLeft, ChevronRight, Close, Deck, Download, Message, Pin, Play } from './Icons';
import { Pins } from './Pins';
import { SlideFrame } from './SlideFrame';
import { Stage } from './Stage';
import { captureSelection, capturePoint, clearSelection } from './selection';
import type { Comment, DraftComment, TemplateInfo } from './types';

/** Ignores keyboard shortcuts while the user is typing. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'INPUT' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable === true
  );
}

export function Studio() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState<DraftComment | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templatePending, setTemplatePending] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const active = slides[Math.min(activeIndex, slides.length - 1)];
  const openCount = comments.filter((c) => c.status === 'open').length;

  const slideComments = useMemo(
    () => comments.filter((c) => c.slideId === active?.id),
    [comments, active?.id],
  );

  /* ── Data ── */

  useEffect(() => {
    api.fetchState().then((state) => {
      setComments(state.comments);
      setTemplates(state.templates);
    }).catch(() => {});
    return api.onCommentsChanged(setComments);
  }, []);

  useEffect(() => {
    if (active) api.reportView(active.index, active.id);
  }, [active?.id, active?.index]);

  // Speaker notes live on the rendered slide as a data attribute, so reading
  // them back from the DOM avoids a second channel for the same information.
  useEffect(() => {
    const el = frameRef.current?.querySelector('.sm-slide');
    setNotes(el?.getAttribute('data-notes') || null);
  }, [active?.id]);

  const refresh = useCallback(async () => {
    const { comments: next } = await api.fetchComments();
    setComments(next);
  }, []);

  const changeTemplate = async (name: string) => {
    if (name === config.template) return;
    setTemplatePending(true);
    setTemplateError(null);
    try {
      await api.setTemplate(name);
      // Writing deck.json triggers a full reload, which imports the new theme.
    } catch (err) {
      setTemplatePending(false);
      setTemplateError(err instanceof Error ? err.message : 'Could not switch template');
    }
  };

  const exportPdf = async () => {
    setExportPending(true);
    setExportError(null);
    try {
      await api.exportPdf();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Could not export PDF');
    } finally {
      setExportPending(false);
    }
  };

  /* ── Navigation ── */

  const go = useCallback((next: number) => {
    setActiveIndex((current) => {
      const target = Math.max(0, Math.min(slides.length - 1, next));
      if (target !== current) {
        setDraft(null);
        setSelectedId(null);
      }
      return target;
    });
  }, []);

  /** Leaves a note about the slide as a whole, with no anchor to a phrase. */
  const commentOnSlide = useCallback(() => {
    if (!active) return;
    setDraft({
      kind: 'slide',
      slideId: active.id,
      slideFile: active.file,
      slideNumber: active.number,
      anchor: { x: 0.5, y: 0.5 },
    });
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          go(activeIndex + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          go(activeIndex - 1);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(slides.length - 1);
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          commentOnSlide();
          break;
        case 'p':
        case 'P':
          setPresenting((v) => !v);
          break;
        case 'f':
        case 'F':
          document.documentElement.requestFullscreen?.().catch(() => {});
          break;
        case 'Escape':
          if (draft) setDraft(null);
          else if (pinMode) setPinMode(false);
          else if (presenting) setPresenting(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, draft, pinMode, presenting, go, commentOnSlide]);

  /* ── Capturing feedback ── */

  // A selection is only meaningful once the drag ends, so this listens for the
  // release rather than for selectionchange, which would fire continuously.
  useEffect(() => {
    if (presenting) return;
    const onMouseUp = (e: MouseEvent) => {
      if (isTyping(e.target)) return;
      // Let the browser finish updating the selection before reading it.
      requestAnimationFrame(() => {
        const captured = captureSelection(frameRef.current, config.width, config.height);
        if (!captured || !active) return;
        setDraft({
          kind: 'selection',
          slideId: active.id,
          slideFile: active.file,
          slideNumber: active.number,
          quote: captured.quote,
          context: captured.context,
          anchor: captured.anchor,
        });
      });
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [active, presenting]);

  const onStageClick = (e: React.MouseEvent) => {
    if (!pinMode || !active) return;
    const point = capturePoint(frameRef.current, e, config.width, config.height);
    if (!point) return;
    setDraft({
      kind: 'pin',
      slideId: active.id,
      slideFile: active.file,
      slideNumber: active.number,
      anchor: point.anchor,
    });
    setPinMode(false);
  };

  const submitDraft = async (body: string) => {
    if (!draft) return;
    await api.createComment({ ...draft, body });
    clearSelection();
    setDraft(null);
    setPinMode(false);
    await refresh();
  };

  /* ── Comment actions ── */

  const selectComment = (comment: Comment) => {
    const index = slides.findIndex((s) => s.id === comment.slideId);
    if (index >= 0) setActiveIndex(index);
    setSelectedId(comment.id);
  };

  /** Runs a comment mutation and pulls the list back into sync. */
  const act = <A extends unknown[]>(fn: (...args: A) => Promise<unknown>) => {
    return (...args: A) => {
      fn(...args)
        .then(refresh)
        .catch(() => {});
    };
  };

  if (!slides.length) {
    return (
      <div className="sm-studio sm-studio-empty">
        <div className="sm-empty">
          <p className="sm-empty-title">No slides yet</p>
          <p className="sm-empty-body">
            Add a <code>.tsx</code> file to <code>{config.slides}/</code> and it will appear here.
            Ask Claude to make you one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`sm-studio${presenting ? ' sm-presenting' : ''}`}>
      <header className="sm-topbar">
        <div className="sm-topbar-left">
          <span className="sm-mark">
            <Deck />
          </span>
          <span className="sm-deck-title">{config.title}</span>
          <span className="sm-crumb" aria-hidden="true">
            /
          </span>
          <label className="sm-template-picker">
            <span className="sm-visually-hidden">Template</span>
            <select
              className={`sm-template-select${templateError ? ' sm-template-select-error' : ''}`}
              value={config.template}
              disabled={templatePending || templates.length === 0}
              onChange={(event) => changeTemplate(event.target.value)}
              title={templateError || 'Swap template'}
              aria-label="Template"
              aria-invalid={Boolean(templateError)}
            >
              {!template && <option value={config.template}>{config.template} (missing)</option>}
              {templates.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.label}{item.source === 'local' ? ' (local)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="sm-topbar-right">
          <span className={`sm-status${openCount ? ' sm-status-live' : ''}`}>
            {openCount ? `${openCount} open for Claude` : 'No open comments'}
          </span>
          <span className="sm-divider" aria-hidden="true" />
          <button
            type="button"
            className={`sm-btn${pinMode ? ' sm-btn-primary' : ''}`}
            onClick={() => setPinMode((v) => !v)}
            title="Drop a comment on a specific spot"
          >
            <Pin />
            {pinMode ? 'Click the slide' : 'Pin a note'}
          </button>
          <button type="button" className="sm-btn" onClick={commentOnSlide} title="Comment (C)">
            <Message />
            Comment
          </button>
          <button
            type="button"
            className="sm-btn"
            onClick={() => setPresenting(true)}
            title="Present (P)"
          >
            <Play />
            Present
          </button>
          <button
            type="button"
            className={`sm-btn${exportError ? ' sm-btn-error' : ''}`}
            onClick={exportPdf}
            disabled={exportPending}
            title={exportError || 'Download PDF'}
            aria-label={exportError ? `Export PDF: ${exportError}` : 'Export PDF'}
          >
            <Download />
            {exportPending ? 'Exporting…' : exportError ? 'Export failed' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div className="sm-body">
        <Filmstrip
          slides={slides}
          config={config}
          activeIndex={activeIndex}
          comments={comments}
          onSelect={go}
        />

        <main className="sm-main">
          <div
            className={`sm-stage-host${pinMode ? ' sm-pinning' : ''}`}
            onClick={onStageClick}
            onMouseDown={() => {
              if (draft?.kind !== 'selection') setDraft(null);
            }}
          >
            <Stage
              width={config.width}
              height={config.height}
              padding={presenting ? 0 : 36}
              frameRef={frameRef}
              onScaleChange={setScale}
              overlay={
                <>
                  <Pins
                    comments={presenting ? [] : slideComments}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                  {draft && !presenting && (
                    <Composer draft={draft} onSubmit={submitDraft} onCancel={() => setDraft(null)} />
                  )}
                </>
              }
            >
              {active && <SlideFrame slide={active} total={slides.length} config={config} />}
            </Stage>
          </div>

          <footer className="sm-stagebar">
            <div className="sm-nav">
              <button
                type="button"
                className="sm-btn sm-btn-icon"
                onClick={() => go(activeIndex - 1)}
                disabled={activeIndex === 0}
                title="Previous slide (←)"
                aria-label="Previous slide"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="sm-btn sm-btn-icon"
                onClick={() => go(activeIndex + 1)}
                disabled={activeIndex === slides.length - 1}
                title="Next slide (→)"
                aria-label="Next slide"
              >
                <ChevronRight />
              </button>
            </div>
            <span className="sm-counter">
              {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
            <span className="sm-stagebar-file">{active?.file}</span>
            <span className="sm-stagebar-notes">{notes || ''}</span>
            <span className="sm-zoom" title="Slide scale">
              {Math.round(scale * 100)}%
            </span>
          </footer>
        </main>

        <CommentPanel
          comments={comments}
          slides={slides}
          selectedId={selectedId}
          onSelect={selectComment}
          onResolve={act((id: string) => api.resolveComment(id))}
          onReopen={act((id: string) => api.reopenComment(id))}
          onDelete={act((id: string) => api.deleteComment(id))}
          onClearResolved={act(() => api.clearResolved())}
        />
      </div>

      {presenting && (
        <button type="button" className="sm-exit-present" onClick={() => setPresenting(false)}>
          <Close />
          Exit
        </button>
      )}
    </div>
  );
}
