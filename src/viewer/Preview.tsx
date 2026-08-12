import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const CANVAS_W = 1280;
const CANVAS_H = 720;

/* The preview document holds one slide and nothing else, so the page around it
   should contribute no space and no colour of its own. The error rules are
   here rather than in base.css because nothing outside this document reaches
   into it. */
const FRAME_CSS = `
html,body{margin:0;padding:0;overflow:hidden;background:transparent}
.sm-error-slide{--sm-bg:#150f10;--sm-fg:#f3d7d7;--sm-border:#43262a;justify-content:center;gap:16px}
.sm-error-title{font-size:20px;font-weight:500;color:#f08c8c}
.sm-error-body{padding:16px 18px;border:1px solid #43262a;background:rgba(0,0,0,.25);
  font-family:var(--sm-mono);font-size:14px;line-height:1.6;color:#f3d7d7;white-space:pre-wrap}
`;

interface PreviewProps {
  /** The style's stylesheet, as text. */
  css: string;
  /** The runtime stylesheet every style is layered on top of. */
  runtimeCss: string;
  title: string;
  children: ReactNode;
}

/**
 * One slide rendered in one style, inside its own document.
 *
 * Every style defines the same custom properties on the same classes, so
 * putting several on a page at once means either rewriting their selectors or
 * giving each one a document. An iframe is the honest option: what renders here
 * is byte for byte the stylesheet a deck would load, and the slide inside is
 * laid out at its true 1280x720 and scaled with a transform, exactly as the
 * studio does it.
 */
export function Preview({ css, runtimeCss, title, children }: PreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [doc, setDoc] = useState<Document | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const fit = () => setScale(Math.max(0.05, host.clientWidth / CANVAS_W));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // A blank iframe already has a complete document by the time the ref lands,
  // and browsers differ on whether load fires again for about:blank, so both
  // paths set it and the later one is a no-op.
  const attach = useCallback((el: HTMLIFrameElement | null) => {
    setDoc(el?.contentDocument ?? null);
  }, []);

  useEffect(() => {
    if (!doc) return;
    const tag = doc.createElement('style');
    tag.textContent = `${runtimeCss}\n${css}\n${FRAME_CSS}`;
    doc.head.appendChild(tag);
    return () => tag.remove();
  }, [doc, css, runtimeCss]);

  return (
    <div ref={hostRef} className="sm-lib-preview" style={{ height: CANVAS_H * scale }}>
      <iframe
        ref={attach}
        title={title}
        tabIndex={-1}
        className="sm-lib-iframe"
        style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}
        onLoad={(event) => setDoc(event.currentTarget.contentDocument)}
      />
      {doc && createPortal(<PreviewBoundary title={title}>{children}</PreviewBoundary>, doc.body)}
    </div>
  );
}

interface BoundaryProps {
  title: string;
  children: ReactNode;
}

/**
 * Keeps one broken template from taking the whole library down.
 *
 * Local templates are ordinary source files a person is probably still editing,
 * so a throw is an expected state rather than an exceptional one.
 */
class PreviewBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[slide-maker] ${this.props.title} failed to render`, error, info);
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sm-slide sm-error-slide">
          <div className="sm-error-title">{this.props.title} failed to render</div>
          <pre className="sm-error-body">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
